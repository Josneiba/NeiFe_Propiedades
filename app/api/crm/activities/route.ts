// app/api/crm/activities/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { CrmActivityType } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const brokerId = session.user.id
  const { searchParams } = new URL(request.url)
  const dealId = searchParams.get('dealId')
  const contactId = searchParams.get('contactId')
  const isDone = searchParams.get('isDone')

  const where: any = { brokerId }

  if (dealId) {
    where.dealId = dealId
  }

  if (contactId) {
    where.contactId = contactId
  }

  if (isDone) {
    where.isDone = isDone === 'true'
  }

  const activities = await prisma.crmActivity.findMany({
    where,
    include: {
      deal: { select: { id: true, code: true, title: true } },
      contact: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(activities)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const body = await request.json()

  const {
    type,
    title,
    description,
    dealId,
    contactId,
    scheduledAt,
    outcome,
    isDone,
    completedAt,
  } = body

  if (!type || !title) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: type, title' },
      { status: 400 }
    )
  }

  try {
    const activity = await prisma.crmActivity.create({
      data: {
        type: type as CrmActivityType,
        title,
        description: description || null,
        brokerId,
        dealId: dealId || null,
        contactId: contactId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        outcome: outcome || null,
        isDone: isDone ?? false,
        completedAt: completedAt ? new Date(completedAt) : isDone ? new Date() : null,
      },
      include: {
        deal: true,
        contact: true,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Error al crear actividad' },
      { status: 500 }
    )
  }
}
