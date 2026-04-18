import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { endBrokerLandlordPartnership } from '@/lib/revoke-broker-partnership'

// PATCH — aprobar o rechazar solicitud de corredor
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'Solo propietarios pueden gestionar solicitudes de corredores' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (!['approve', 'reject', 'end_partnership'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    const permission = await prisma.brokerPermission.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
      include: {
        broker: { select: { name: true, email: true } },
      },
    })

    if (!permission) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (action === 'end_partnership') {
      if (permission.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'Solo puedes quitar acceso a un corredor con permiso aprobado' },
          { status: 400 }
        )
      }

      await endBrokerLandlordPartnership(session.user.id, permission.brokerId)

      await createNotification(
        permission.brokerId,
        'SYSTEM',
        'Acceso revocado',
        `${session.user.name || 'El propietario'} revocó tu acceso para administrar sus propiedades.`,
        '/broker/mandatos'
      )

      await logActivity(
        session.user.id,
        'BROKER_PARTNERSHIP_ENDED',
        `Revocó acceso al corredor ${permission.broker.name}`,
        undefined
      )

      return NextResponse.json({ ok: true })
    }

    if (permission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 400 })
    }

    const updateData: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      updatedAt: new Date(),
    }

    if (action === 'approve') {
      updateData.approvedAt = new Date()
    } else {
      updateData.rejectedAt = new Date()
    }

    const updatedPermission = await prisma.brokerPermission.update({
      where: { id: params.id },
      data: updateData,
    })

    // Notificar al corredor
    const notificationType = action === 'approve' ? 'SYSTEM' : 'SYSTEM'
    const notificationTitle = action === 'approve'
      ? 'Solicitud aprobada'
      : 'Solicitud rechazada'
    const notificationMessage = action === 'approve'
      ? `${session.user.name} ha aprobado tu solicitud para administrar sus propiedades.`
      : `${session.user.name} ha rechazado tu solicitud para administrar sus propiedades.`

    await createNotification(
      permission.brokerId,
      notificationType,
      notificationTitle,
      notificationMessage,
      action === 'approve' ? '/broker/mandatos' : undefined
    )

    // Log de actividad
    await logActivity(
      session.user.id,
      action === 'approve' ? 'BROKER_PERMISSION_APPROVED' : 'BROKER_PERMISSION_REJECTED',
      `${action === 'approve' ? 'Aprobada' : 'Rechazada'} solicitud de corredor ${permission.broker.name}`,
      undefined
    )

    return NextResponse.json({ permission: updatedPermission })
  } catch (error) {
    console.error('Error updating broker permission:', error)
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}

// DELETE — eliminar solicitud de corredor (solo el corredor que la envió)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'Solo corredores pueden eliminar sus solicitudes' }, { status: 403 })
  }

  try {
    const permission = await prisma.brokerPermission.findUnique({
      where: { id: params.id },
      include: {
        landlord: { select: { name: true, id: true } },
      },
    })

    if (!permission) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (permission.brokerId !== session.user.id) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar esta solicitud' }, { status: 403 })
    }

    if (permission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo puedes eliminar solicitudes pendientes' },
        { status: 400 }
      )
    }

    await prisma.brokerPermission.delete({
      where: { id: params.id },
    })

    // Log de actividad
    await logActivity(
      session.user.id,
      'BROKER_PERMISSION_DELETED',
      `Solicitud de administración eliminada`,
      undefined
    )

    return NextResponse.json({
      message: 'Solicitud eliminada exitosamente',
    })
  } catch (error) {
    console.error('Error deleting broker permission:', error)
    return NextResponse.json(
      { error: 'Error al eliminar solicitud' },
      { status: 500 }
    )
  }
}