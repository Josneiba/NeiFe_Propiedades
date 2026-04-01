import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'

// GET — verificar token
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
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
  { params }: { params: { token: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
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
      return NextResponse.json(
        { error: 'Invitación expirada' },
        { status: 400 }
      )
    }

    // Actualizar invitación y propiedad
    const updated = await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        receiverId: session.user.id,
      },
    })

    await prisma.property.update({
      where: { id: invitation.propertyId },
      data: { tenantId: session.user.id },
    })

    // Notificar al arrendador
    await createNotification(
      invitation.senderId,
      'INVITATION_RECEIVED',
      'Invitación aceptada',
      `${session.user.name || session.user.email} aceptó tu invitación para ${invitation.property.name}`,
      '/dashboard/propiedades'
    )

    await logActivity(
      session.user.id,
      'INVITATION_ACCEPTED',
      `Invitación aceptada para ${invitation.property.name}`,
      invitation.propertyId
    )

    return NextResponse.json({ invitation: updated })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Error al aceptar invitación' },
      { status: 500 }
    )
  }
}
