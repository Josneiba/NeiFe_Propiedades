import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
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

  if (session.user.role !== 'TENANT') {
    return NextResponse.json(
      { error: 'Solo una cuenta de arrendatario puede aceptar esta invitación' },
      { status: 403 }
    )
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { token: params.token },
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

      const updated = await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          receiverId: session.user.id,
        },
      })

      await tx.property.update({
        where: { id: invitation.propertyId },
        data: { tenantId: session.user.id },
      })

      return { invitation: updated, property: invitation.property }
    })

    const propLabel =
      result.property.name?.trim() || result.property.address

    await createNotification(
      result.property.landlordId,
      'INVITATION_RECEIVED',
      'Invitación aceptada',
      `${session.user.name || session.user.email} aceptó tu invitación para ${propLabel}`,
      `/dashboard/propiedades/${result.property.id}`
    )

    await logActivity(
      session.user.id,
      'INVITATION_ACCEPTED',
      `Invitación aceptada para ${propLabel}`,
      result.property.id
    )

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
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Error al aceptar invitación' },
      { status: 500 }
    )
  }
}
