import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentWeekNumber,
  getCurrentYear,
  getISOWeekRange,
  getRealProgressForRange,
} from '@/lib/goal-engine'

const ALLOWED_METRICS = [
  'CONTACTS',
  'VISITS',
  'DEALS_CLOSED',
  'COMMISSION_CLP',
  'MANDATES',
  'PROPERTIES_PUBLISHED',
] as const

function isGoalMetric(value: string | null): value is (typeof ALLOWED_METRICS)[number] {
  return typeof value === 'string' && ALLOWED_METRICS.includes(value as any)
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const metricParam = request.nextUrl.searchParams.get('metric')
  const metric = isGoalMetric(metricParam) ? metricParam : 'CONTACTS'
  const brokerId = session.user.id
  const currentWeek = getCurrentWeekNumber()
  const currentYear = getCurrentYear()

  const weeks = [] as { week: number; year: number }[]
  for (let i = 5; i >= 0; i -= 1) {
    let week = currentWeek - i
    let year = currentYear
    if (week <= 0) {
      week += 52
      year -= 1
    }
    weeks.push({ week, year })
  }

  const currentGoal = await prisma.brokerGoal.findFirst({
    where: { brokerId, period: 'WEEKLY', metric, year: currentYear, week: currentWeek },
  })
  const target = currentGoal?.target ?? 0

  const result = await Promise.all(
    weeks.map(async ({ week, year }) => {
      const { start, end } = getISOWeekRange(week, year)
      const real = await getRealProgressForRange(brokerId, metric, start, end)
      const startLabel = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
      const endLabel = new Date(end.getTime() - 1).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
      return {
        label: `${startLabel}–${endLabel}`,
        target,
        real,
      }
    }),
  )

  return NextResponse.json(result)
}
