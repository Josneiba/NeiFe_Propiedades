import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

// GET — KPIs reales para el dashboard
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const [paidPayments, pendingPayments, activeMaintenances, activeProperties] =
      await Promise.all([
        prisma.payment.aggregate({
          where: {
            property: { landlordId: session.user.id },
            status: 'PAID',
            month: currentMonth,
            year: currentYear,
          },
          _sum: { amountCLP: true, amountUF: true },
        }),
        prisma.payment.aggregate({
          where: {
            property: { landlordId: session.user.id },
            status: 'PENDING',
            month: currentMonth,
            year: currentYear,
          },
          _sum: { amountCLP: true },
        }),
        prisma.maintenanceRequest.count({
          where: {
            property: { landlordId: session.user.id },
            status: {
              in: [
                'REQUESTED',
                'REVIEWING',
                'APPROVED',
                'IN_PROGRESS',
              ],
            },
          },
        }),
        prisma.property.count({
          where: { landlordId: session.user.id, isActive: true },
        }),
      ])

    return NextResponse.json({
      stats: {
        totalRecaudadoCLP: paidPayments._sum.amountCLP || 0,
        totalRecaudadoUF: paidPayments._sum.amountUF || 0,
        pagosPendientesCLP: pendingPayments._sum.amountCLP || 0,
        mantencionesActivas: activeMaintenances,
        propiedadesActivas: activeProperties,
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
