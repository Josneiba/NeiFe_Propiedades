import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { endBrokerLandlordPartnership } from '@/lib/revoke-broker-partnership'

/** POST — el corredor deja de administrar las propiedades de un propietario */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'Solo corredores pueden usar esta acción' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const landlordId = typeof body?.landlordId === 'string' ? body.landlordId : null
    if (!landlordId) {
      return NextResponse.json({ error: 'landlordId es requerido' }, { status: 400 })
    }

    const permission = await prisma.brokerPermission.findUnique({
      where: {
        landlordId_brokerId: {
          landlordId,
          brokerId: session.user.id,
        },
      },
      include: {
        landlord: { select: { name: true, email: true } },
      },
    })

    if (!permission || permission.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'No hay relación activa aprobada con este propietario' },
        { status: 400 }
      )
    }

    await endBrokerLandlordPartnership(landlordId, session.user.id)

    await createNotification(
      landlordId,
      'SYSTEM',
      'Corredor dejó de administrar',
      `${session.user.name || session.user.email} dejó de administrar tus propiedades.`,
      '/dashboard/solicitudes-corredores'
    )

    await logActivity(
      session.user.id,
      'BROKER_PARTNERSHIP_ENDED_BY_BROKER',
      `Dejó de administrar propiedades de ${permission.landlord.name}`,
      undefined
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error ending broker partnership:', error)
    return NextResponse.json(
      { error: 'Error al finalizar la relación' },
      { status: 500 }
    )
  }
}
