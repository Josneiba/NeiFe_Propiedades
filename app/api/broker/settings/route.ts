import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const broker = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dailyContactGoal: true },
  })

  if (!broker) {
    return NextResponse.json({ error: 'Broker no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    ...broker,
    googleSyncEnabled: false,
  })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { dailyContactGoal } = body

  const updateData: Record<string, unknown> = {}

  if (typeof dailyContactGoal === 'number' && dailyContactGoal >= 1 && dailyContactGoal <= 100) {
    updateData.dailyContactGoal = dailyContactGoal
  } else if (dailyContactGoal !== undefined) {
    return NextResponse.json(
      { error: 'dailyContactGoal debe ser un número entre 1 y 100' },
      { status: 400 },
    )
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { dailyContactGoal: true },
  })

  return NextResponse.json({
    ...updated,
    googleSyncEnabled: false,
  })
}
