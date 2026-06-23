// app/api/crm/deals/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { generateCrmCode } from '@/lib/crm-codes'
import { NextRequest, NextResponse } from 'next/server'
import { CrmOperationType } from '@prisma/client'

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
  const stage = searchParams.get('stage')
  const phase = searchParams.get('phase')
  const status = searchParams.get('status') || 'ACTIVE'
  const q = searchParams.get('q')

  const where: any = { brokerId, status }

  if (stage) {
    where.stage = stage
  }

  if (phase) {
    where.phase = phase
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ]
  }

  const deals = await prisma.crmDeal.findMany({
    where,
    include: {
      property: {
        select: { id: true, code: true, address: true, type: true },
      },
      contacts: {
        include: { contact: { select: { id: true, code: true, name: true, phone: true, email: true } } },
        orderBy: { isPrimary: 'desc' },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, type: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(deals)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const body = await request.json()

  const {
    title,
    operationType,
    propertyId,
    value,
    commission,
    dueDate,
    notes,
  } = body

  if (!title || !operationType) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: title, operationType' },
      { status: 400 }
    )
  }

  try {
    const deal = await prisma.$transaction(async (tx) => {
      const code = await generateCrmCode('OPE', tx)

      return tx.crmDeal.create({
        data: {
          code,
          title,
          operationType: operationType as CrmOperationType,
          stage: 'NUEVO_LEAD',
          phase: 'PRE_VENTA',
          status: 'ACTIVE',
          propertyId: propertyId || null,
          value: value ? parseFloat(value) : null,
          commission: commission ? parseFloat(commission) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          brokerId,
          notes: notes || null,
        },
        include: {
          property: true,
          contacts: { include: { contact: true } },
          activities: true,
        },
      })
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Error al crear operación' }, { status: 500 })
  }
}
