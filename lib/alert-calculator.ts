import { prisma } from '@/lib/prisma'

export async function calcBrokerAlerts(brokerId: string) {
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 86_400_000)

  const [dealsWithoutActivity, overdueTasks, expiringContracts] = await Promise.all([
    // Deals sin actividad >48h
    prisma.crmDeal.findMany({
      where: {
        brokerId,
        status: 'ACTIVE',
        stage: { notIn: ['ADMINISTRAR'] },
        activities: { none: { createdAt: { gte: twoDaysAgo } } },
      },
      select: { id: true, code: true, title: true, stage: true },
      take: 10,
    }),

    // Tareas vencidas sin completar
    prisma.crmTask.count({
      where: { brokerId, isCompleted: false, dueDate: { lt: now } },
    }),

    // Contratos de propiedades mandatadas que vencen en 30 días
    prisma.contract.count({
      where: {
        property: { mandates: { some: { brokerId, status: 'ACTIVE' } } },
        endDate: { gte: now, lte: new Date(now.getTime() + 30 * 86_400_000) },
        status: 'ACTIVE',
      },
    }),
  ])

  return {
    coldDeals: dealsWithoutActivity,
    overdueTasks,
    expiringContracts,
    totalAlerts: dealsWithoutActivity.length + overdueTasks + expiringContracts,
  }
}
