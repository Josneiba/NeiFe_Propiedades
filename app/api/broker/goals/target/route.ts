import { auth } from '@/lib/auth-session'
import { NextResponse } from 'next/server'
import { upsertBrokerGoal } from '@/lib/goal-engine'
import { GoalMetric, GoalPeriod } from '@prisma/client'

const ALLOWED_METRICS: GoalMetric[] = [
  'CONTACTS',
  'VISITS',
  'DEALS_CLOSED',
  'COMMISSION_CLP',
  'MANDATES',
  'PROPERTIES_PUBLISHED',
]

const ALLOWED_PERIODS: GoalPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY']

function isValidMetric(value: unknown): value is GoalMetric {
  return typeof value === 'string' && ALLOWED_METRICS.includes(value as GoalMetric)
}

function isValidPeriod(value: unknown): value is GoalPeriod {
  return typeof value === 'string' && ALLOWED_PERIODS.includes(value as GoalPeriod)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { metric, period, target, week, month, year, commitment, unit } = body as Record<string, unknown>

  if (!isValidMetric(metric)) {
    return NextResponse.json({ error: 'Metric inválido' }, { status: 400 })
  }

  if (!isValidPeriod(period)) {
    return NextResponse.json({ error: 'Period inválido' }, { status: 400 })
  }

  if (typeof target !== 'number' || Number.isNaN(target) || target < 0) {
    return NextResponse.json({ error: 'Target inválido' }, { status: 400 })
  }

  if (typeof year !== 'number' || Number.isNaN(year)) {
    return NextResponse.json({ error: 'Year inválido' }, { status: 400 })
  }

  if (period === 'WEEKLY' && (typeof week !== 'number' || Number.isNaN(week))) {
    return NextResponse.json({ error: 'Week es obligatorio para period WEEKLY' }, { status: 400 })
  }

  if (period === 'MONTHLY' && (typeof month !== 'number' || Number.isNaN(month))) {
    return NextResponse.json({ error: 'Month es obligatorio para period MONTHLY' }, { status: 400 })
  }

  try {
    const goal = await upsertBrokerGoal(session.user.id, {
      metric,
      period,
      target,
      year,
      week: period === 'WEEKLY' ? week as number : null,
      month: period === 'MONTHLY' ? month as number : null,
      commitment: typeof commitment === 'string' ? commitment : null,
      unit: typeof unit === 'string' ? unit : 'count',
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Error upserting BrokerGoal:', error)
    return NextResponse.json({ error: 'No se pudo guardar la meta' }, { status: 500 })
  }
}
