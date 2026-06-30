import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentWeekNumber, getCurrentYear, getISOWeekRange, getRealProgressForRange } from '@/lib/goal-engine'

const METRIC_LABELS: Record<string, string> = {
  CONTACTS: 'Contactos',
  VISITS: 'Visitas',
  DEALS_CLOSED: 'Cierres',
  COMMISSION_CLP: 'Comisión',
  MANDATES: 'Mandatos',
  PROPERTIES_PUBLISHED: 'Propiedades',
}

const ALLOWED_METRICS = [
  'CONTACTS',
  'VISITS',
  'DEALS_CLOSED',
  'COMMISSION_CLP',
  'MANDATES',
  'PROPERTIES_PUBLISHED',
] as const

type GoalMetric = (typeof ALLOWED_METRICS)[number]

function isGoalMetric(value: string | null): value is GoalMetric {
  return typeof value === 'string' && ALLOWED_METRICS.includes(value as GoalMetric)
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const url = new URL(request.url)
  const metricParam = url.searchParams.get('metric')
  const metric: GoalMetric = isGoalMetric(metricParam) ? metricParam : 'CONTACTS'

  const brokerId = session.user.id
  const currentWeek = getCurrentWeekNumber()
  const currentYear = getCurrentYear()

  const weeks = Array.from({ length: 8 }, (_, index) => {
    const week = currentWeek - (7 - index)
    if (week > 0) {
      return { week, year: currentYear }
    }

    return {
      week: week + 52,
      year: currentYear - 1,
    }
  })

  const goals = await prisma.brokerGoal.findMany({
    where: {
      brokerId,
      period: 'WEEKLY',
      metric,
      OR: weeks.map(({ week, year }) => ({ week, year })),
    },
  })

  const data = await Promise.all(
    weeks.map(async ({ week, year: weekYear }) => {
      const { start, end } = getISOWeekRange(week, weekYear)
      const actual = await getRealProgressForRange(brokerId, metric, start, end)
      const goal = goals.find((item) => item.week === week && item.year === weekYear)
      return {
        label: `S${week}`,
        actual,
        target: goal?.target ?? 0,
      }
    }),
  )

  return NextResponse.json({ metric, metricLabel: METRIC_LABELS[metric], data })
}
