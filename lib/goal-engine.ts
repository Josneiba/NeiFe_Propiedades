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

type InsightCount = {
  count: number
  savedViewQuery: {
    entity: 'CONTACTS' | 'DEALS'
    filters: Record<string, unknown>
    sortBy?: string
    sortOrder?: string
  }
}

export type GoalInsightInput = {
  metric: GoalMetric | string
  target: number
  current: number
  insufficientHistory?: boolean
  message?: string
  probability?: number
  pipelineWeighted?: number
  breakdown?: Record<string, InsightCount>
}

// Insight priority is deterministic: insufficient data first, then already-covered
// pipeline, then actionable gap from active negotiations/visits, then an honest gap.
export function generateGoalInsight(kpi: GoalMetric | string, data: GoalInsightInput) {
  if (data.insufficientHistory) {
    return data.message ?? 'Se necesita más historial antes de predecir de forma confiable.'
  }

  const target = Number(data.target || 0)
  const current = Number(data.current || 0)
  const probability = Number(data.probability ?? 0)
  const pipelineWeighted = Number(data.pipelineWeighted ?? 0)

  if (target > 0 && pipelineWeighted >= target) {
    return `Con el pipeline actual tienes ${probability}% de probabilidad de alcanzar la meta.`
  }

  if (kpi === 'DEALS_CLOSED') {
    const negotiating = data.breakdown?.negotiating?.count ?? 0
    const gap = Math.max(0, Math.ceil(target - current - pipelineWeighted))
    if (gap > 0 && negotiating > 0 && gap <= negotiating) {
      return `Si conviertes ${gap} de las ${negotiating} negociaciones activas, alcanzarás la meta.`
    }
  }

  if (kpi === 'VISITS') {
    const gap = Math.max(0, Math.ceil(target - current))
    if (gap > 0) return `Necesitas generar aproximadamente ${gap} visitas más esta semana para alcanzar la meta.`
  }

  if (target <= 0) return 'Define una meta para calcular forecast e insight accionable.'
  return `Faltan ${Math.max(0, Math.ceil(target - current))} unidades para alcanzar la meta con datos actuales.`
}

async function countWeeksWithGoalHistory(brokerId: string) {
  const rows = await prisma.$queryRaw<Array<{ week_key: string; total: bigint }>>`
    SELECT week_key, SUM(total)::bigint AS total
    FROM (
      SELECT DATE_TRUNC('week', "createdAt") AS week_key, COUNT(*)::bigint AS total
      FROM "CrmActivity"
      WHERE "brokerId" = ${brokerId}
      GROUP BY week_key
      UNION ALL
      SELECT DATE_TRUNC('week', "wonAt") AS week_key, COUNT(*)::bigint AS total
      FROM "CrmDeal"
      WHERE "brokerId" = ${brokerId} AND "wonAt" IS NOT NULL
      GROUP BY week_key
    ) history
    GROUP BY week_key
    HAVING SUM(total) > 0
  `
  return rows.length
}

// Forecast weights: readyForSignature=0.9, waitingDocs=0.6, waitingApproval=0.5,
// negotiating=0.3, visits=0.12, plannedStrategyActivity=0.1. Two historical
// weeks are required so one anomalous week does not masquerade as a trend.
export async function getBrokerGoalInsights(brokerId: string, targets: Partial<Record<GoalMetric, number>> = {}) {
  const now = new Date()
  const { start, end } = getISOWeekRange(getCurrentWeekNumber(now), getCurrentYear(now))
  const startIso = start.toISOString()
  const endIso = end.toISOString()
  const historyWeeks = await countWeeksWithGoalHistory(brokerId)
  const insufficientForecast = historyWeeks < 2
  const insufficientMessage = 'Se necesita más historial (mínimo 2 semanas) antes de predecir de forma confiable.'

  const contactsBySource = await prisma.$queryRaw<Array<{ source: string | null; count: bigint }>>`
    SELECT source, COUNT(*) as count FROM "CrmContact"
    WHERE "brokerId" = ${brokerId} AND "createdAt" >= ${start} AND "createdAt" < ${end}
    GROUP BY source
  `

  const visitsScheduled = await prisma.crmActivity.count({ where: { brokerId, type: 'VISITA', scheduledAt: { gte: start, lt: end } } })
  const leadsWithoutVisit = await prisma.crmContact.count({ where: { brokerId, activities: { none: { type: 'VISITA' } } } })
  const clientsNoRecent = await prisma.crmContact.count({ where: { brokerId, activities: { none: { createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) } } } } })

  const readyForSignature = await prisma.crmDeal.count({ where: { brokerId, stage: 'FIRMA_CONTRATO', status: 'ACTIVE' } })
  const waitingDocs = await prisma.crmDeal.count({ where: { brokerId, stage: 'DOCS_REVISION' } })
  const waitingApproval = await prisma.crmDeal.count({ where: { brokerId, stage: 'OFERTA_RECIBIDA', status: 'ACTIVE' } })
  const negotiating = await prisma.crmDeal.count({ where: { brokerId, stage: 'NEGOCIANDO' } })
  const closedThisWeek = await prisma.crmDeal.count({ where: { brokerId, status: 'WON', wonAt: { gte: start, lt: end } } })

  const pipelineWeighted = readyForSignature * 0.9 + waitingDocs * 0.6 + waitingApproval * 0.5 + negotiating * 0.3 + visitsScheduled * 0.12
  const contactTotal = contactsBySource.reduce((sum, row) => sum + Number(row.count), 0)

  const buildForecast = (metric: GoalMetric, current: number, weighted = current) => {
    const target = Number(targets[metric] ?? 0)
    if (insufficientForecast) return { insufficientHistory: true, message: insufficientMessage, probability: null, target }
    if (target <= 0) return { insufficientHistory: false, message: 'Define una meta para calcular forecast e insight accionable.', probability: 0, target }
    return { insufficientHistory: false, probability: Math.min(100, Math.round((weighted / target) * 100)), target }
  }

  const contactsBreakdown = contactsBySource.reduce<Record<string, InsightCount>>((acc, row) => {
    const source = row.source ?? 'OTRO'
    acc[source] = {
      count: Number(row.count),
      savedViewQuery: {
        entity: 'CONTACTS',
        filters: { source, brokerId, createdAt: { gte: startIso, lt: endIso } },
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    }
    return acc
  }, {})

  const visitsBreakdown: Record<string, InsightCount> = {
    scheduled: { count: visitsScheduled, savedViewQuery: { entity: 'CONTACTS', filters: { futureVisitsOnly: true, brokerId }, sortBy: 'updatedAt', sortOrder: 'desc' } },
    leadsWithoutVisit: { count: leadsWithoutVisit, savedViewQuery: { entity: 'CONTACTS', filters: { noFutureVisits: true, brokerId }, sortBy: 'updatedAt', sortOrder: 'desc' } },
    clientsNoRecent: { count: clientsNoRecent, savedViewQuery: { entity: 'CONTACTS', filters: { lastContactIsNull: true, brokerId }, sortBy: 'updatedAt', sortOrder: 'desc' } },
  }

  const dealsBreakdown: Record<string, InsightCount> = {
    readyForSignature: { count: readyForSignature, savedViewQuery: { entity: 'DEALS', filters: { stage: 'FIRMA_CONTRATO', status: 'ACTIVE', brokerId }, sortBy: 'dueDate', sortOrder: 'asc' } },
    waitingDocs: { count: waitingDocs, savedViewQuery: { entity: 'DEALS', filters: { stage: 'DOCS_REVISION', brokerId }, sortBy: 'dueDate', sortOrder: 'asc' } },
    waitingApproval: { count: waitingApproval, savedViewQuery: { entity: 'DEALS', filters: { stage: 'OFERTA_RECIBIDA', status: 'ACTIVE', brokerId }, sortBy: 'dueDate', sortOrder: 'asc' } },
    negotiating: { count: negotiating, savedViewQuery: { entity: 'DEALS', filters: { stage: 'NEGOCIANDO', brokerId }, sortBy: 'updatedAt', sortOrder: 'desc' } },
    closedThisWeek: { count: closedThisWeek, savedViewQuery: { entity: 'DEALS', filters: { status: 'WON', wonAt: { gte: startIso, lt: endIso }, brokerId }, sortBy: 'updatedAt', sortOrder: 'desc' } },
  }

  const contactsForecast = buildForecast('CONTACTS', contactTotal)
  const visitsForecast = buildForecast('VISITS', visitsScheduled)
  const dealsForecast = buildForecast('DEALS_CLOSED', closedThisWeek, closedThisWeek + pipelineWeighted)

  const contactsInput = { metric: 'CONTACTS', current: contactTotal, ...contactsForecast, breakdown: contactsBreakdown }
  const visitsInput = { metric: 'VISITS', current: visitsScheduled, ...visitsForecast, breakdown: visitsBreakdown }
  const dealsInput = { metric: 'DEALS_CLOSED', current: closedThisWeek, ...dealsForecast, pipelineWeighted, breakdown: dealsBreakdown }

  return {
    period: { start, end },
    historyWeeks,
    insights: {
      CONTACTS: { ...contactsInput, insight: generateGoalInsight('CONTACTS', contactsInput as GoalInsightInput) },
      VISITS: { ...visitsInput, insight: generateGoalInsight('VISITS', visitsInput as GoalInsightInput) },
      DEALS_CLOSED: { ...dealsInput, insight: generateGoalInsight('DEALS_CLOSED', dealsInput as GoalInsightInput) },
    },
  }
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
