import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentWeekNumber, getCurrentYear, getISOWeekRange, getRealProgressForRange } from '@/lib/goal-engine'
import { GoalMetric } from '@prisma/client'

const WEEKLY_METRICS: GoalMetric[] = [
  'CONTACTS',
  'VISITS',
  'DEALS_CLOSED',
  'COMMISSION_CLP',
  'MANDATES',
  'PROPERTIES_PUBLISHED',
]

function metricLabel(metric: GoalMetric) {
  switch (metric) {
    case 'CONTACTS':
      return 'Contactos'
    case 'VISITS':
      return 'Visitas'
    case 'DEALS_CLOSED':
      return 'Cierres'
    case 'COMMISSION_CLP':
      return 'Comisión'
    case 'MANDATES':
      return 'Mandatos'
    case 'PROPERTIES_PUBLISHED':
      return 'Propiedades publicadas'
    default:
      return metric
  }
}

function getPreviousWeekRange(week: number, year: number) {
  const currentWeekRange = getISOWeekRange(week, year)
  const previousDay = new Date(currentWeekRange.start.getTime() - 1)
  const previousWeekNumber = getCurrentWeekNumber(previousDay)
  const previousYear = previousDay.getUTCFullYear()
  return getISOWeekRange(previousWeekNumber, previousYear)
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const requestedWeek = Number(searchParams.get('week'))
  const requestedYear = Number(searchParams.get('year'))
  const brokerId = session.user.id
  const week = Number.isNaN(requestedWeek) ? getCurrentWeekNumber() : requestedWeek
  const year = Number.isNaN(requestedYear) ? getCurrentYear() : requestedYear
  const currentRange = getISOWeekRange(week, year)
  const previousRange = getPreviousWeekRange(week, year)

  try {
    const [currentGoals, previousGoals] = await Promise.all([
      prisma.brokerGoal.findMany({
        where: { brokerId, period: 'WEEKLY', week, year },
      }),
      prisma.brokerGoal.findMany({
        where: {
          brokerId,
          period: 'WEEKLY',
          week: previousRange.start.getUTCFullYear() === year
            ? getCurrentWeekNumber(previousRange.start)
            : getCurrentWeekNumber(previousRange.start),
          year: previousRange.start.getUTCFullYear(),
        },
      }),
    ])

    const currentGoalsMap = new Map(currentGoals.map((goal) => [goal.metric, goal]))
    const previousGoalsMap = new Map(previousGoals.map((goal) => [goal.metric, goal]))

    const weeklyCompare = await Promise.all(
      WEEKLY_METRICS.map(async (metric) => {
        const currentValue = await getRealProgressForRange(brokerId, metric, currentRange.start, currentRange.end)
        const previousValue = await getRealProgressForRange(brokerId, metric, previousRange.start, previousRange.end)
        const currentGoal = currentGoalsMap.get(metric)
        const previousGoal = previousGoalsMap.get(metric)

        return {
          metric,
          label: metricLabel(metric),
          currentValue,
          previousValue,
          target: currentGoal?.target ?? 0,
          previousTarget: previousGoal?.target ?? 0,
          progress: currentGoal?.target ? Math.min(100, Math.round((currentValue / currentGoal.target) * 100)) : 0,
        }
      }),
    )

    return NextResponse.json({ week, year, weeklyCompare })
  } catch (error) {
    console.error('Weekly compare API error:', error)
    return NextResponse.json({ week, year, weeklyCompare: [] })
  }
}
