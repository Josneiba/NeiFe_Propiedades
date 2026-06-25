// app/api/crm/metrics/overview/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const brokerId = session.user.id
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    activeDeals,
    stageCounts,
    wonThisMonth,
    lostThisMonth,
    closedDeals,
    activeCommission,
    wonCommission,
    recentActivities,
  ] = await Promise.all([
    prisma.crmDeal.count({
      where: { brokerId, status: 'ACTIVE' },
    }),
    prisma.crmDeal.groupBy({
      by: ['stage'],
      where: { brokerId },
      _count: { id: true },
      _sum: { value: true },
    }),
    prisma.crmDeal.count({
      where: {
        brokerId,
        status: 'WON',
        wonAt: { gte: monthStart },
      },
    }),
    prisma.crmDeal.count({
      where: {
        brokerId,
        status: 'LOST',
        updatedAt: { gte: monthStart },
      },
    }),
    prisma.crmDeal.findMany({
      where: { brokerId, status: { in: ['WON', 'LOST'] } },
      select: { createdAt: true, wonAt: true, updatedAt: true, status: true },
    }),
    prisma.crmDeal.aggregate({
      where: { brokerId, status: 'ACTIVE' },
      _sum: { commission: true },
    }),
    prisma.crmDeal.aggregate({
      where: { brokerId, status: 'WON', wonAt: { gte: monthStart } },
      _sum: { commission: true },
    }),
    prisma.crmActivity.findMany({
      where: { brokerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const stageBreakdown = stageCounts
    .map((row) => ({
      stage: row.stage,
      count: row._count.id,
      value: row._sum.value || 0,
    }))
    .sort((a, b) => b.count - a.count)

  const totalDeals = wonThisMonth + lostThisMonth
  const conversionRate =
    totalDeals > 0 ? (wonThisMonth / totalDeals) * 100 : 0

  const avgDaysToClose = closedDeals.length
    ? Math.round(
        closedDeals.reduce((sum, deal) => {
          const endDate = deal.status === 'WON' ? deal.wonAt : deal.updatedAt
          if (!endDate) return sum
          return (
            sum +
            (endDate.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        }, 0) / closedDeals.length,
      )
    : 0

  const totalPipelineValue = stageBreakdown.reduce(
    (sum, stage) => sum + stage.value,
    0,
  )

  const avgDealValue = activeDeals > 0 ? Math.round(totalPipelineValue / activeDeals) : 0
  const commissionEstimated = activeCommission._sum.commission || 0
  const commissionWon = wonCommission._sum.commission || 0

  return NextResponse.json({
    totalActive: activeDeals,
    stageBreakdown,
    conversionRate: Math.round(conversionRate * 100) / 100,
    avgDealValue,
    avgDaysToClose,
    winRate: totalDeals > 0 ? Math.round((wonThisMonth / totalDeals) * 100) : 0,
    lossRate: totalDeals > 0 ? Math.round((lostThisMonth / totalDeals) * 100) : 0,
    totalPipelineValue,
    commissionEstimated,
    commissionWon,
    recentActivities: recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      timestamp: activity.createdAt.toISOString(),
    })),
  })
}
