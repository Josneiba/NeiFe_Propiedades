import { prisma } from '@/lib/prisma'

export interface StageVelocity {
  stage: string
  avgDays: number
  count: number
  percentage: number
}

export interface ConversionMetric {
  source: string
  total: number
  won: number
  lost: number
  rate: number
}

export interface RevisionProjection {
  phase: string
  activeDeals: number
  avgValue: number
  projectedRevenue: number
  worstCase: number
  bestCase: number
}

export interface TopContact {
  id: string
  code: string
  name: string
  email: string | null
  dealsCount: number
  totalValue: number
  score: number
  lastActivityDate: Date | null
}

export interface MetricsOverview {
  stageVelocity: StageVelocity[]
  conversionBySource: ConversionMetric[]
  revenuProjections: RevisionProjection[]
  topContacts: TopContact[]
  avgClosingTime: number
  totalPipelineValue: number
  winRate: number
  lossRate: number
}

/**
 * Calculate how long deals spend in each stage
 */
export async function getStageVelocity(brokerId: string): Promise<StageVelocity[]> {
  const stageHistory = await prisma.crmDealStageHistory.findMany({
    where: { deal: { brokerId } },
    include: { deal: true },
    orderBy: { changedAt: 'asc' },
  })

  const stageMetrics: Record<string, { days: number[]; count: number }> = {}

  // Group history by deal to calculate time spent in each stage
  const dealHistory: Record<string, any[]> = {}
  stageHistory.forEach((history) => {
    if (!dealHistory[history.dealId]) {
      dealHistory[history.dealId] = []
    }
    dealHistory[history.dealId].push(history)
  })

  // Calculate time spent in each stage for each deal
  Object.values(dealHistory).forEach((transitions) => {
    for (let i = 0; i < transitions.length; i++) {
      const currentTransition = transitions[i]
      const nextTransition = transitions[i + 1]
      
      if (currentTransition.toStage) {
        const stage = currentTransition.toStage
        if (!stageMetrics[stage]) {
          stageMetrics[stage] = { days: [], count: 0 }
        }

        // Calculate days in stage
        if (nextTransition) {
          const daysSpent = Math.floor(
            (new Date(nextTransition.changedAt).getTime() - new Date(currentTransition.changedAt).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSpent >= 0 && daysSpent < 365) {
            stageMetrics[stage].days.push(daysSpent)
          }
        }
        
        stageMetrics[stage].count += 1
      }
    }
  })

  const totalDeals = await prisma.crmDeal.count({ where: { brokerId } })

  return Object.entries(stageMetrics).map(([stage, data]) => ({
    stage,
    avgDays: data.days.length > 0 ? Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length) : 0,
    count: data.count,
    percentage: totalDeals > 0 ? Math.round((data.count / totalDeals) * 100) : 0,
  }))
}

/**
 * Calculate conversion rates by lead source
 */
export async function getConversionBySource(brokerId: string): Promise<ConversionMetric[]> {
  const contacts = await prisma.crmContact.findMany({
    where: { brokerId },
    include: { deals: { include: { deal: true } } },
  })

  const sourceMetrics: Record<string, { total: number; won: number; lost: number }> = {}

  contacts.forEach((contact) => {
    if (!sourceMetrics[contact.source]) {
      sourceMetrics[contact.source] = { total: 0, won: 0, lost: 0 }
    }

    contact.deals.forEach((dealContact) => {
      sourceMetrics[contact.source].total += 1
      if (dealContact.deal.status === 'WON') {
        sourceMetrics[contact.source].won += 1
      } else if (dealContact.deal.status === 'LOST') {
        sourceMetrics[contact.source].lost += 1
      }
    })
  })

  return Object.entries(sourceMetrics)
    .map(([source, data]) => ({
      source,
      total: data.total,
      won: data.won,
      lost: data.lost,
      rate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
}

/**
 * Project revenue based on current pipeline
 */
export async function getRevenueProjections(brokerId: string): Promise<RevisionProjection[]> {
  const deals = await prisma.crmDeal.findMany({
    where: { brokerId, status: 'ACTIVE' },
  })

  const phases: Record<string, { deals: typeof deals; values: number[] }> = {
    PRE_VENTA: { deals: [], values: [] },
    VENTA: { deals: [], values: [] },
    POST_VENTA: { deals: [], values: [] },
  }

  deals.forEach((deal) => {
    if (phases[deal.phase]) {
      phases[deal.phase].deals.push(deal)
      if (deal.value) phases[deal.phase].values.push(deal.value)
    }
  })

  return Object.entries(phases).map(([phase, data]) => {
    const avgValue = data.values.length > 0 ? data.values.reduce((a, b) => a + b, 0) / data.values.length : 0
    const bestCase = data.values.reduce((a, b) => a + b, 0)
    const worstCase = Math.round(bestCase * 0.6)

    return {
      phase,
      activeDeals: data.deals.length,
      avgValue: Math.round(avgValue),
      projectedRevenue: Math.round(bestCase * 0.7),
      worstCase,
      bestCase,
    }
  })
}

/**
 * Get top performing contacts
 */
export async function getTopContacts(brokerId: string, limit: number = 10): Promise<TopContact[]> {
  const contacts = await prisma.crmContact.findMany({
    where: { brokerId },
    include: {
      deals: {
        include: { deal: true },
      },
      activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      score: true,
    },
  })

  const contactMetrics = contacts
    .map((contact) => {
      const totalValue = contact.deals
        .filter((dc) => dc.deal.status === 'WON')
        .reduce((sum, dc) => sum + (dc.deal.value || 0), 0)

      return {
        id: contact.id,
        code: contact.code,
        name: contact.name,
        email: contact.email,
        dealsCount: contact.deals.length,
        totalValue,
        score: contact.score?.score || 50,
        lastActivityDate: contact.activities[0]?.createdAt || null,
      }
    })
    .filter((c) => c.dealsCount > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit)

  return contactMetrics
}

/**
 * Calculate average time from lead to deal closure
 */
export async function getAvgClosingTime(brokerId: string): Promise<number> {
  const wonDeals = await prisma.crmDeal.findMany({
    where: { brokerId, status: 'WON', wonAt: { not: null } },
  })

  if (wonDeals.length === 0) return 0

  const times = wonDeals
    .map((deal) => {
      if (!deal.wonAt) return 0
      return Math.floor((deal.wonAt.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    })
    .filter((t) => t > 0 && t < 365)

  return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
}

/**
 * Get complete metrics overview
 */
export async function getMetricsOverview(brokerId: string): Promise<MetricsOverview> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    stageVelocity,
    conversionBySource,
    revenuProjections,
    topContacts,
    avgClosingTime,
    allDeals,
    wonDeals,
    lostDeals,
  ] = await Promise.all([
    getStageVelocity(brokerId),
    getConversionBySource(brokerId),
    getRevenueProjections(brokerId),
    getTopContacts(brokerId, 10),
    getAvgClosingTime(brokerId),
    prisma.crmDeal.findMany({ where: { brokerId, status: 'ACTIVE' } }),
    prisma.crmDeal.count({ where: { brokerId, status: 'WON', wonAt: { gte: monthStart } } }),
    prisma.crmDeal.count({ where: { brokerId, status: 'LOST', updatedAt: { gte: monthStart } } }),
  ])

  const totalPipelineValue = allDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
  const totalDeals = wonDeals + lostDeals
  const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0
  const lossRate = totalDeals > 0 ? Math.round((lostDeals / totalDeals) * 100) : 0

  return {
    stageVelocity,
    conversionBySource,
    revenuProjections,
    topContacts,
    avgClosingTime,
    totalPipelineValue,
    winRate,
    lossRate,
  }
}
