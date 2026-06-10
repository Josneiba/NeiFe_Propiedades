// app/api/crm/deals/[id]/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id

  const deal = await prisma.crmDeal.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      broker: { select: { id: true, name: true } },
      contacts: {
        include: { contact: true },
        orderBy: { isPrimary: 'desc' },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!deal) {
    return NextResponse.json({ error: 'Operación no encontrada' }, { status: 404 })
  }

  if (deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  return NextResponse.json(deal)
}

export async function PUT(
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

  const existing = await prisma.crmDeal.findUnique({
    where: { id: params.id },
    select: { brokerId: true },
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Operación no encontrada' },
      { status: 404 }
    )
  }

  if (existing.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { title, value, commission, dueDate, notes } = body

  const updated = await prisma.crmDeal.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(value !== undefined && { value: value ? parseFloat(value) : null }),
      ...(commission !== undefined && {
        commission: commission ? parseFloat(commission) : null,
      }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      property: true,
      contacts: { include: { contact: true } },
      activities: true,
    },
  })

  return NextResponse.json(updated)
}
