// app/api/crm/deals/[id]/stage/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { recalculateAllScores } from '@/lib/crm-scoring'
import { getPhaseFromStage } from '@/lib/crm-stage-utils'
import { getPublicOrigin } from '@/lib/public-origin'
import { getResendFrom } from '@/lib/resend-from'
import { buildBrandedEmailHtml } from '@/lib/email-composer'
import { NextRequest, NextResponse } from 'next/server'
import { CrmDealStage } from '@prisma/client'
import { hash } from 'bcryptjs'
import { Resend } from 'resend'

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const body = await request.json()
  const { newStage } = body

  if (!newStage) {
    return NextResponse.json(
      { error: 'Campo requerido: newStage' },
      { status: 400 }
    )
  }

  const deal = await prisma.crmDeal.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      contacts: {
        include: { contact: true },
        where: { role: { in: ['PROPIETARIO', 'ARRENDATARIO'] } },
      },
    },
  })

  if (!deal) {
    return NextResponse.json(
      { error: 'Operación no encontrada' },
      { status: 404 }
    )
  }

  if (deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  // Handle ADMINISTRAR transition (special logic)
  if (newStage === 'ADMINISTRAR') {
    return await transitionToAdministration(deal, brokerId, request)
  }

  // Normal stage transition
  const phase = getPhaseFromStage(newStage as CrmDealStage)

  const updated = await prisma.crmDeal.update({
    where: { id: params.id },
    data: {
      stage: newStage as CrmDealStage,
      phase,
    },
    include: {
      property: true,
      contacts: { include: { contact: true } },
      activities: true,
    },
  })

  // Registrar cambio de etapa en el historial
  await prisma.crmDealStageHistory.create({
    data: {
      dealId: params.id,
      fromStage: deal.stage,
      toStage: newStage as CrmDealStage,
      changedBy: brokerId,
    },
  })

  // Recalculate scores after stage change
  await recalculateAllScores(brokerId)

  return NextResponse.json(updated)
}

async function transitionToAdministration(deal: any, brokerId: string, request: NextRequest) {
  if (!deal.property) {
    return NextResponse.json(
      { error: 'El deal no tiene propiedad vinculada' },
      { status: 400 }
    )
  }

  const propietario = deal.contacts.find((dc: any) => dc.role === 'PROPIETARIO')
  const arrendatario = deal.contacts.find((dc: any) => dc.role === 'ARRENDATARIO')

  if (!propietario || !propietario.contact.email) {
    return NextResponse.json(
      { error: 'El deal debe tener un propietario con email' },
      { status: 400 }
    )
  }

  let tempPasswordForEmail: string | null = null
  const publicOrigin = getPublicOrigin(request)
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check if landlord already exists in NeiFe
      let landlordId: string

      if (propietario.contact.neifeUserId) {
        landlordId = propietario.contact.neifeUserId
      } else {
        // Create landlord user in NeiFe
        const tempPassword = Math.random().toString(36).slice(2, 12)
        tempPasswordForEmail = tempPassword
        const hashedPw = await hash(tempPassword, 10)

        const newLandlord = await tx.user.create({
          data: {
            email: propietario.contact.email,
            name: propietario.contact.name,
            role: 'LANDLORD',
            password: hashedPw,
            phone: propietario.contact.phone || '',
            rut: propietario.contact.rut || undefined,
          },
        })

        landlordId = newLandlord.id

        // Update CRM contact with NeiFe linkage
        await tx.crmContact.update({
          where: { id: propietario.contactId },
          data: { neifeUserId: landlordId },
        })
      }

      // Create Property in NeiFe system
      const neifeProperty = await tx.property.create({
        data: {
          name: deal.property.address,
          address: deal.property.address,
          commune: deal.property.commune,
          region: 'Metropolitana',
          landlordId,
          managedBy: brokerId,
          monthlyRentCLP: deal.value ? Math.round(deal.value) : undefined,
          bedrooms: deal.property.bedrooms ?? undefined,
          bathrooms: deal.property.bathrooms ?? undefined,
          squareMeters: deal.property.sqMeters ?? undefined,
        },
      })

      // Create BrokerPermission
      await tx.brokerPermission.upsert({
        where: { landlordId_brokerId: { landlordId, brokerId } },
        create: {
          landlordId,
          brokerId,
          status: 'APPROVED',
          approvedAt: new Date(),
        },
        update: {
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      })

      // Create Mandate automatically so the property appears in broker listings
      await tx.mandate.create({
        data: {
          propertyId: neifeProperty.id,
          ownerId: landlordId,
          brokerId,
          status: 'ACTIVE',
          signedByBroker: true,
          brokerSignedAt: new Date(),
          signedByOwner: false,
          startsAt: new Date(),
          commissionRate: deal.commission ?? null,
          commissionType: 'MONTHLY',
          notes: `Creado automáticamente desde deal ${deal.code}`,
        },
      })

      // Create Invitation for tenant if exists with email
      if (arrendatario?.contact.email) {
        await tx.invitation.create({
          data: {
            type: 'BROKER_INVITE',
            email: arrendatario.contact.email,
            propertyId: neifeProperty.id,
            senderId: brokerId,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        })
      }

      // Create an initial contract record for the managed property
      const contract = await tx.contract.create({
        data: {
          propertyId: neifeProperty.id,
          status: 'DRAFT',
          startDate: neifeProperty.contractStart ?? undefined,
          endDate: neifeProperty.contractEnd ?? undefined,
          rentUF: neifeProperty.monthlyRentUF ?? undefined,
        },
      })

      // Update CRM deal
      const updatedDeal = await tx.crmDeal.update({
        where: { id: deal.id },
        data: {
          stage: 'ADMINISTRAR',
          phase: 'POST_VENTA',
          status: 'WON',
          wonAt: new Date(),
          neifeContractId: contract.id,
        },
        include: {
          property: true,
          contacts: { include: { contact: true } },
        },
      })

      // Update CRM property status
      await tx.crmProperty.update({
        where: { id: deal.propertyId! },
        data: {
          crmStatus: 'CONVERTIDA',
          neifePropertyId: neifeProperty.id,
        },
      })

      // Mark deal contacts as CONVERTED
      const contactIds = deal.contacts.map((dc: any) => dc.contactId)
      await tx.crmContact.updateMany({
        where: { id: { in: contactIds } },
        data: { status: 'CONVERTED' },
      })

      // Registrar cambio de etapa en el historial
      await tx.crmDealStageHistory.create({
        data: {
          dealId: deal.id,
          fromStage: deal.stage,
          toStage: 'ADMINISTRAR',
          changedBy: brokerId,
        },
      })

      return {
        neifePropertyId: neifeProperty.id,
        deal: updatedDeal,
      }
    })

    // Recalculate scores after conversion
    await recalculateAllScores(brokerId)

    if (tempPasswordForEmail && propietario.contact.email && resend) {
      try {
        const emailHtml = buildBrandedEmailHtml({
          preview: 'Tu propiedad ya está activa en NeiFe',
          title: 'Bienvenida a NeiFe',
          greeting: `Hola ${propietario.contact.name || 'propietario'}`,
          intro: [
            'Tu corredor ha registrado tu propiedad en NeiFe y creó tu acceso al panel.',
          ],
          infoRows: [
            { label: 'Usuario', value: propietario.contact.email },
            { label: 'Contraseña temporal', value: tempPasswordForEmail },
          ],
          bulletList: [
            'Guarda esta contraseña y cámbiala al iniciar sesión.',
            'Si no solicitaste este correo, contacta a tu corredor.',
          ],
          cta: {
            label: 'Ir a NeiFe',
            url: `${publicOrigin}/login`,
          },
          closing: [
            'Bienvenido a NeiFe. Estamos aquí para ayudarte a administrar tu propiedad.',
          ],
        })

        await resend.emails.send({
          from: getResendFrom(),
          to: propietario.contact.email,
          subject: 'Tu propiedad ya está en NeiFe — accede con tu contraseña temporal',
          html: emailHtml,
        })
      } catch (sendError) {
        console.error('Error sending landlord welcome email:', sendError)
      }
    }

    return NextResponse.json({
      ok: true,
      neifePropertyId: result.neifePropertyId,
      redirectTo: `/broker/propiedades/${result.neifePropertyId}`,
      deal: result.deal,
    })
  } catch (error) {
    console.error('Error in ADMINISTRAR transition:', error)
    return NextResponse.json(
      { error: 'Error al trasladar a administración' },
      { status: 500 }
    )
  }
}
