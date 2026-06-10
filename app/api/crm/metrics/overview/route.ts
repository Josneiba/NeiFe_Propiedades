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

  // Get deal counts by status
  const activeDeals = await prisma.crmDeal.count({
    where: { brokerId, status: 'ACTIVE' },
  })

  // Get deals by phase
  const preVentaCount = await prisma.crmDeal.count({
    where: { brokerId, status: 'ACTIVE', phase: 'PRE_VENTA' },
  })

  const ventaCount = await prisma.crmDeal.count({
    where: { brokerId, status: 'ACTIVE', phase: 'VENTA' },
  })

  const postVentaCount = await prisma.crmDeal.count({
    where: { brokerId, status: 'ACTIVE', phase: 'POST_VENTA' },
  })

  // Get this month's won and lost
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const wonThisMonth = await prisma.crmDeal.count({
    where: {
      brokerId,
      status: 'WON',
      wonAt: { gte: monthStart },
    },
  })

  const lostThisMonth = await prisma.crmDeal.count({
    where: {
      brokerId,
      status: 'LOST',
      updatedAt: { gte: monthStart },
    },
  })

  // Calculate conversion rate
  const conversionRate =
    wonThisMonth + lostThisMonth > 0
      ? (wonThisMonth / (wonThisMonth + lostThisMonth)) * 100
      : 0

  // Get average days to close
  const closedDeals = await prisma.crmDeal.findMany({
    where: { brokerId, status: { in: ['WON', 'LOST'] } },
    select: { createdAt: true, wonAt: true, updatedAt: true, status: true },
  })

  let avgDaysToClose = 0
  if (closedDeals.length > 0) {
    const totalDays = closedDeals.reduce((sum, deal) => {
      const endDate = deal.status === 'WON' ? deal.wonAt : deal.updatedAt
      if (!endDate) return sum
      const days = (endDate.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      return sum + days
    }, 0)
    avgDaysToClose = Math.round(totalDays / closedDeals.length)
  }

  // Get commission estimates
  const activeCommission = await prisma.crmDeal.aggregate({
    where: { brokerId, status: 'ACTIVE' },
    _sum: { commission: true },
  })

  const wonCommission = await prisma.crmDeal.aggregate({
    where: { brokerId, status: 'WON', wonAt: { gte: monthStart } },
    _sum: { commission: true },
  })

  const commissionEstimated = activeCommission._sum.commission || 0
  const commissionWon = wonCommission._sum.commission || 0

  return NextResponse.json({
    totalActive: activeDeals,
    preVentaCount,
    ventaCount,
    postVentaCount,
    wonThisMonth,
    lostThisMonth,
    conversionRate: Math.round(conversionRate * 100) / 100,
    avgDaysToClose,
    commissionEstimated,
    commissionWon,
  })
}
