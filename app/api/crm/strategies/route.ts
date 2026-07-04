import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { getCurrentWeekNumber, getCurrentYear, getISOWeekRange } from '@/lib/goal-engine'
import { NextRequest, NextResponse } from 'next/server'

const STRATEGY_TYPES = new Set([
  'CAPTACION_PROPIEDADES',
  'GENERACION_LEADS',
  'MARKETING',
  'REFERIDOS',
  'REACTIVACION',
  'INVERSIONISTAS',
  'OPEN_HOUSE',
  'ALIANZAS',
])

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const week = Number(request.nextUrl.searchParams.get('week') ?? getCurrentWeekNumber())
  const year = Number(request.nextUrl.searchParams.get('year') ?? getCurrentYear())
  const { start, end } = getISOWeekRange(week, year)
  const strategies = await prisma.crmStrategy.findMany({
    where: { brokerId: session.user.id, week, year },
    include: { activities: { include: { owner: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  } as any)
  const [newContacts, newDeals] = await Promise.all([
    prisma.crmContact.count({ where: { brokerId: session.user.id, createdAt: { gte: start, lt: end } } }),
    prisma.crmDeal.count({ where: { brokerId: session.user.id, createdAt: { gte: start, lt: end } } }),
  ])
  const enriched = strategies.map((strategy: any) => {
    const completed = strategy.activities.filter((activity: any) => activity.isCompleted).length
    const actualConversion = strategy.activities.length > 0 ? completed / strategy.activities.length : 0
    return {
      ...strategy,
      actualConversion,
      pipelineContribution: {
        count: strategy.type === 'GENERACION_LEADS' ? newContacts : strategy.type === 'CAPTACION_PROPIEDADES' ? newDeals : 0,
        attribution: strategy.type === 'GENERACION_LEADS' || strategy.type === 'CAPTACION_PROPIEDADES'
          ? 'Contribución por período: registros nuevos del broker en la semana, sin atribución individual porque el modelo actual no guarda strategyId en contactos/deals.'
          : 'Sin atribución directa disponible en el modelo actual.',
      },
    }
  })

  return NextResponse.json({ strategies: enriched, week, year })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await request.json()
  if (!STRATEGY_TYPES.has(body.type) || !body.name) {
    return NextResponse.json({ error: 'Faltan type válido y name' }, { status: 400 })
  }

  const strategy = await prisma.crmStrategy.create({
    data: {
      brokerId: session.user.id,
      type: body.type,
      name: body.name,
      goalDescription: body.goalDescription ?? null,
      targetNumber: body.targetNumber === undefined || body.targetNumber === null ? null : Number(body.targetNumber),
      expectedConversion: body.expectedConversion === undefined || body.expectedConversion === null ? null : Number(body.expectedConversion),
      week: Number(body.week ?? getCurrentWeekNumber()),
      year: Number(body.year ?? getCurrentYear()),
    },
  } as any)

  return NextResponse.json(strategy, { status: 201 })
}
