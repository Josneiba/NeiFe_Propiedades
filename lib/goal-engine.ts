import { prisma } from '@/lib/prisma'
import { Prisma, BrokerGoal, GoalMetric, GoalPeriod } from '@prisma/client'

const CONTACT_ACTIVITY_TYPES = ['LLAMADA', 'WHATSAPP', 'EMAIL', 'VISITA', 'REUNION'] as const
const CONTACT_ACTIVITY_TYPES_LIST = [...CONTACT_ACTIVITY_TYPES] as ContactActivityType[]

type ContactActivityType = (typeof CONTACT_ACTIVITY_TYPES)[number]

export type BrokerGoalProgress = {
  id: string
  period: GoalPeriod | string
  metric: GoalMetric | string
  target: number
  current: number
  progressPercent: number
  completed: boolean
  unit: string
  commitment: string | null
  rangeLabel: string
}

export type BrokerWeekPlanPayload = {
  week: number
  year: number
  planText: string | null
  workDays: Prisma.InputJsonValue
  dailyCommitments: Prisma.InputJsonValue
}

export function getCurrentYear(date = new Date()) {
  return date.getFullYear()
}

export function getCurrentMonth(date = new Date()) {
  return date.getMonth() + 1
}

export function getCurrentWeekNumber(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNr = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNr)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getDailyRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(start.getTime() + 86_400_000)
  return { start, end }
}

export function getISOWeekRange(week: number, year: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Start = new Date(jan4)
  week1Start.setUTCDate(jan4.getUTCDate() + 1 - jan4Day)
  const start = new Date(week1Start.getTime() + (week - 1) * 7 * 86_400_000)
  const end = new Date(start.getTime() + 7 * 86_400_000)
  return { start, end }
}

function getMonthlyRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start, end }
}

function getGoalRange(goal: BrokerGoal) {
  if (goal.period === 'DAILY') {
    return getDailyRange()
  }

  if (goal.period === 'WEEKLY') {
    return getISOWeekRange(goal.week ?? getCurrentWeekNumber(), goal.year)
  }

  return getMonthlyRange(goal.month ?? getCurrentMonth(), goal.year)
}

function formatGoalRangeLabel(goal: BrokerGoal) {
  if (goal.period === 'DAILY') {
    return 'Hoy'
  }

  if (goal.period === 'WEEKLY') {
    return `Semana ${goal.week ?? getCurrentWeekNumber()} / ${goal.year}`
  }

  return `Mes ${goal.month ?? getCurrentMonth()} / ${goal.year}`
}

async function fetchGoalMetricValue(
  brokerId: string,
  metric: GoalMetric,
  start: Date,
  end: Date,
): Promise<number> {
  switch (metric) {
    case 'CONTACTS':
      return prisma.crmActivity.count({
        where: {
          brokerId,
          type: { in: CONTACT_ACTIVITY_TYPES_LIST },
          createdAt: { gte: start, lt: end },
        },
      })
    case 'VISITS':
      return prisma.crmActivity.count({
        where: { brokerId, type: 'VISITA', createdAt: { gte: start, lt: end } },
      })
    case 'DEALS_CLOSED':
      return prisma.crmDeal.count({
        where: {
          brokerId,
          status: 'WON',
          wonAt: { gte: start, lt: end },
        },
      })
    case 'COMMISSION_CLP': {
      const result = await prisma.crmDeal.aggregate({
        where: {
          brokerId,
          status: 'WON',
          wonAt: { gte: start, lt: end },
          commission: { not: null },
        },
        _sum: { commission: true },
      })
      return result._sum.commission ?? 0
    }
    case 'MANDATES':
      return prisma.mandate.count({
        where: {
          brokerId,
          signedByBroker: true,
          createdAt: { gte: start, lt: end },
        },
      })
    case 'PROPERTIES_PUBLISHED':
      return prisma.property.count({
        where: {
          agentId: brokerId,
          createdAt: { gte: start, lt: end },
        },
      })
    default:
      return 0
  }
}

export async function getRealProgressForRange(
  brokerId: string,
  metric: GoalMetric,
  start: Date,
  end: Date,
) {
  return fetchGoalMetricValue(brokerId, metric, start, end)
}

export async function getBrokerGoalProgress(brokerId: string) {
  const now = new Date()
  const currentYear = getCurrentYear(now)
  const currentWeek = getCurrentWeekNumber(now)
  const currentMonth = getCurrentMonth(now)

  const goals = await prisma.brokerGoal.findMany({
    where: {
      brokerId,
      OR: [
        { period: 'DAILY', year: currentYear },
        { period: 'WEEKLY', year: currentYear, week: currentWeek },
        { period: 'MONTHLY', year: currentYear, month: currentMonth },
      ],
    },
    orderBy: [{ period: 'asc' }, { metric: 'asc' }],
  })

  const progress = await Promise.all(
    goals.map(async (goal) => {
      const { start, end } = getGoalRange(goal)
      const current = await fetchGoalMetricValue(goal.brokerId, goal.metric, start, end)
      return {
        id: goal.id,
        period: goal.period,
        metric: goal.metric,
        target: goal.target,
        current,
        progressPercent: goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0,
        completed: goal.target > 0 ? current >= goal.target : false,
        unit: goal.unit,
        commitment: goal.commitment,
        rangeLabel: formatGoalRangeLabel(goal),
      }
    }),
  )

  return progress
}

export async function getBrokerGoals(brokerId: string) {
  return prisma.brokerGoal.findMany({
    where: { brokerId },
    orderBy: [{ year: 'desc' }, { period: 'asc' }, { metric: 'asc' }],
  })
}

export async function getBrokerGoalHistory(brokerId: string) {
  return prisma.brokerGoal.findMany({
    where: { brokerId },
    orderBy: [{ year: 'desc' }, { period: 'asc' }, { metric: 'asc' }],
    take: 30,
  })
}

export async function getBrokerWeekPlan(brokerId: string) {
  const week = getCurrentWeekNumber()
  const year = getCurrentYear()
  return prisma.brokerWeekPlan.findUnique({
    where: { brokerId_week_year: { brokerId, week, year } },
  })
}

export async function upsertBrokerWeekPlan(
  brokerId: string,
  payload: Partial<BrokerWeekPlanPayload>,
) {
  const week = getCurrentWeekNumber()
  const year = getCurrentYear()

  return prisma.brokerWeekPlan.upsert({
    where: { brokerId_week_year: { brokerId, week, year } },
    create: {
      brokerId,
      week,
      year,
      planText: payload.planText ?? null,
      workDays: payload.workDays ?? {},
      dailyCommitments: payload.dailyCommitments ?? {},
    },
    update: {
      planText: payload.planText ?? undefined,
      workDays: payload.workDays ?? undefined,
      dailyCommitments: payload.dailyCommitments ?? undefined,
    },
  })
}
