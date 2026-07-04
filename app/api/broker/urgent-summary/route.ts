import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const now = new Date()
  const next30Days = new Date(now)
  next30Days.setDate(now.getDate() + 30)
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const [overduePayments, expiringContracts, urgentMaintenance, pendingApplications] = await Promise.all([
    prisma.payment.count({
      where: {
        property: { landlordId: brokerId },
        status: 'OVERDUE',
      },
    }),
    prisma.contract.count({
      where: {
        property: { managedBy: brokerId },
        status: 'ACTIVE',
        endDate: { gte: now, lte: next30Days },
      },
    }),
    prisma.maintenanceRequest.count({
      where: {
        property: {
          OR: [
            { managedBy: brokerId },
            { mandates: { some: { brokerId, status: 'ACTIVE' } } },
          ],
        },
        status: { in: ['REQUESTED', 'REVIEWING', 'APPROVED'] },
        providerId: null,
      },
    }),
    prisma.tenantApplication.count({
      where: {
        property: {
          OR: [
            { managedBy: brokerId },
            { mandates: { some: { brokerId, status: 'ACTIVE' } } },
          ],
        },
        status: 'PENDING',
        createdAt: { lte: twoDaysAgo },
      },
    }),
  ])

  return NextResponse.json({
    overduePayments,
    expiringContracts,
    urgentMaintenance,
    pendingApplications,
  })
}
