import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

const patchSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

function propertyLabel(property: { name: string; address: string }) {
  return property.name?.trim() || property.address
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'LANDLORD' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Solo el arrendador puede revisar esta solicitud' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { action } = patchSchema.parse(body)

    const requestRow = await prisma.brokerPropertyCreationRequest.findFirst({
      where: {
        id,
        landlordId: session.user.id,
      },
      include: {
        broker: {
          select: { id: true, name: true, email: true },
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            monthlyRentCLP: true,
            monthlyRentUF: true,
          },
        },
      },
    })

    if (!requestRow) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (requestRow.status !== 'PENDING') {
      return NextResponse.json({ error: 'Esta solicitud ya fue revisada' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextRequest = await tx.brokerPropertyCreationRequest.update({
        where: { id: requestRow.id },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewedAt: new Date(),
        },
      })

      if (action === 'approve') {
        await tx.property.update({
          where: { id: requestRow.property.id },
          data: {
            isActive: true,
            managedBy: requestRow.broker.id,
          },
        })

        const existingMandate = await tx.mandate.findFirst({
          where: {
            propertyId: requestRow.property.id,
            brokerId: requestRow.broker.id,
            ownerId: session.user.id,
          },
          select: { id: true },
        })

        if (!existingMandate) {
          await tx.mandate.create({
            data: {
              propertyId: requestRow.property.id,
              ownerId: session.user.id,
              brokerId: requestRow.broker.id,
              status: 'ACTIVE',
              signedByOwner: true,
              signedByBroker: true,
              ownerSignedAt: new Date(),
              brokerSignedAt: new Date(),
              startsAt: new Date(),
              notes: 'Mandato activado automáticamente desde alta de propiedad creada por corredor y aprobada por el arrendador.',
            },
          })
        }
      }

      return nextRequest
    })

    await createNotification({
      userId: requestRow.broker.id,
      type: 'SYSTEM',
      title: action === 'approve' ? 'Propiedad aprobada por el arrendador' : 'Propiedad rechazada por el arrendador',
      message: action === 'approve'
        ? `${session.user.name || session.user.email} aprobó la propiedad ${propertyLabel(requestRow.property)} y ya quedó habilitada para tu administración.`
        : `${session.user.name || session.user.email} rechazó la propiedad ${propertyLabel(requestRow.property)} cargada en su nombre.`,
      link: action === 'approve' ? '/broker/propiedades' : '/broker/propiedades?nuevo=pendientes'
    })

    await logActivity(
      session.user.id,
      action === 'approve' ? 'BROKER_PROPERTY_APPROVED' : 'BROKER_PROPERTY_REJECTED',
      `${action === 'approve' ? 'Aprobó' : 'Rechazó'} alta de propiedad ${propertyLabel(requestRow.property)}`,
      requestRow.property.id,
      {
        requestId: requestRow.id,
        brokerId: requestRow.broker.id,
      },
    )

    return NextResponse.json({ request: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating broker property request:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de alta de propiedad' },
      { status: 500 },
    )
  }
}
