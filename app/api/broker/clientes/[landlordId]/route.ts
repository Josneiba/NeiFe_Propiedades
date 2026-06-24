import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ landlordId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { landlordId } = await params
  const brokerId = session.user.id

  // Verificar que el broker tiene mandato activo con este landlord
  const mandateCount = await prisma.mandate.count({ where: { brokerId, ownerId: landlordId, status: 'ACTIVE' } })
  if (mandateCount === 0) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const now = new Date()
  const [owner, properties, statements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: landlordId },
      select: { id: true, name: true, email: true, phone: true, avatar: true, company: true },
    }),
    prisma.property.findMany({
      where: { landlordId, mandates: { some: { brokerId, status: 'ACTIVE' } } },
      include: {
        payments: { where: { month: now.getMonth() + 1, year: now.getFullYear() } },
        maintenance: { where: { status: { in: ['REQUESTED', 'REVIEWING', 'IN_PROGRESS'] } }, select: { id: true, category: true, status: true } },
        tenant: { select: { name: true, email: true, phone: true } },
        contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    prisma.brokerStatement.findMany({
      where: { brokerId, landlordId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  const totalRecaudado = properties.reduce((sum, p) => {
    const paid = p.payments.filter((pay) => pay.status === 'PAID').reduce((s, pay) => s + pay.amountCLP, 0)
    return sum + paid
  }, 0)

  const commissionRate = await prisma.mandate.findFirst({
    where: { brokerId, ownerId: landlordId, status: 'ACTIVE' },
    select: { commissionRate: true },
  })

  const comisionEstimada = commissionRate?.commissionRate
    ? Math.round(totalRecaudado * (commissionRate.commissionRate / 100))
    : null

  return NextResponse.json({ owner, properties, statements, totalRecaudado, comisionEstimada })
}
