import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'

// GET — verificar token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { property: true, sender: { select: { name: true, email: true } } },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitación ya fue procesada' },
        { status: 400 }
      )
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      })

      return NextResponse.json(
        { error: 'Invitación expirada' },
        { status: 400 }
      )
    }

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json(
      { error: 'Error al verificar invitación' },
      { status: 500 }
    )
  }
}

// POST — aceptar invitación
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'TENANT' && session.user.role !== 'LANDLORD') {
    return NextResponse.json(
      { error: 'Solo arrendatarios o propietarios pueden aceptar invitaciones' },
      { status: 403 }
    )
  }

  try {
    const { token } = await params
    const ownerEmailQuery = session.user.email
      ? `?email=${encodeURIComponent(session.user.email)}`
      : ''
    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { token },
        include: { property: true, sender: { select: { name: true, email: true } } },
      })

      if (!invitation) {
        throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' })
      }

      if (invitation.status !== 'PENDING') {
        throw Object.assign(new Error('YA_PROCESADA'), { code: 'BAD_STATUS' })
      }

      if (new Date() > invitation.expiresAt) {
        throw Object.assign(new Error('EXPIRADA'), { code: 'EXPIRED' })
      }

      if (invitation.type === 'BROKER_INVITE') {
        if (session.user.role !== 'LANDLORD') {
          throw Object.assign(new Error('SOLO_PROPIETARIOS'), { code: 'WRONG_ROLE' })
        }

        // Aceptar esta invitación equivale a autorizar al corredor.
        await tx.brokerPermission.upsert({
          where: {
            landlordId_brokerId: {
              landlordId: session.user.id,
              brokerId: invitation.senderId,
            },
          },
          update: {
            status: 'APPROVED',
            approvedAt: new Date(),
            rejectedAt: null,
          },
          create: {
            landlordId: session.user.id,
            brokerId: invitation.senderId,
            status: 'APPROVED',
            approvedAt: new Date(),
          },
        })
      } else {
        if (session.user.role !== 'TENANT') {
          throw Object.assign(new Error('SOLO_ARRENDATARIOS'), { code: 'WRONG_ROLE' })
        }

        if (!invitation.property) {
          throw Object.assign(new Error('PROPIEDAD_NO_ENCONTRADA'), { code: 'NO_PROPERTY' })
        }

        if (invitation.property.tenantId != null) {
          throw Object.assign(new Error('OCUPADA'), { code: 'PROPERTY_TAKEN' })
        }

        const existingRental = await tx.property.findFirst({
          where: { tenantId: session.user.id },
          select: { id: true },
        })
        if (existingRental && existingRental.id !== invitation.propertyId) {
          throw Object.assign(new Error('YA_ARRIENDAS'), { code: 'ALREADY_TENANT' })
        }
      }

      const updated = await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          receiverId: session.user.id,
        },
      })

      if (invitation.type !== 'BROKER_INVITE' && invitation.property) {
        await tx.property.update({
          where: { id: invitation.propertyId! },
          data: { tenantId: session.user.id },
        })
      }

      return { invitation: updated, property: invitation.property, senderId: invitation.senderId, senderName: invitation.sender.name }
    })

    if (result.invitation.type === 'BROKER_INVITE') {
      // Notificar al corredor que ya tiene autorización para gestionar propiedades.
      await createNotification(
        result.senderId,
        'SYSTEM',
        'Permiso aprobado por propietario',
        `${session.user.name || session.user.email} aceptó tu invitación y te autorizó para administrar sus propiedades.`,
        `/broker/mandatos/nuevo${ownerEmailQuery}`
      )

      await logActivity(
        session.user.id,
        'BROKER_PERMISSION_APPROVED',
        `Aprobaste al corredor ${result.senderName || 'sin nombre'}`,
        undefined
      )
    } else {
      const propLabel =
        result.property?.name?.trim() || result.property?.address || 'propiedad'

      await createNotification(
        result.property!.landlordId,
        'INVITATION_RECEIVED',
        'Invitación aceptada',
        `${session.user.name || session.user.email} aceptó tu invitación para ${propLabel}`,
        `/dashboard/propiedades/${result.property!.id}`
      )

      await logActivity(
        session.user.id,
        'INVITATION_ACCEPTED',
        `Invitación aceptada para ${propLabel}`,
        result.property!.id
      )
    }

    return NextResponse.json({ invitation: result.invitation })
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : ''
    if (code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }
    if (code === 'BAD_STATUS') {
      return NextResponse.json({ error: 'Invitación ya fue procesada' }, { status: 400 })
    }
    if (code === 'EXPIRED') {
      return NextResponse.json({ error: 'Invitación expirada' }, { status: 400 })
    }
    if (code === 'PROPERTY_TAKEN') {
      return NextResponse.json(
        { error: 'Esta propiedad ya tiene un arrendatario asignado' },
        { status: 409 }
      )
    }
    if (code === 'ALREADY_TENANT') {
      return NextResponse.json(
        { error: 'Ya tienes otra propiedad como arrendatario. Solo puedes arrendar una a la vez.' },
        { status: 409 }
      )
    }
    if (code === 'WRONG_ROLE') {
      return NextResponse.json(
        { error: 'Tipo de cuenta incorrecto para esta invitación' },
        { status: 403 }
      )
    }
    if (code === 'NO_PROPERTY') {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Error al aceptar invitación' },
      { status: 500 }
    )
  }
}
