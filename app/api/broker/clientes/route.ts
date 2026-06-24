import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER')
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const brokerId = session.user.id

  const mandates = await prisma.mandate.findMany({
    where: { brokerId, status: 'ACTIVE' },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          commune: true,
          payments: {
            where: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
            select: { status: true, amountCLP: true },
          },
          maintenance: {
            where: { status: { in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'] } },
            select: { id: true },
          },
        },
      },
    },
  })

  // Agrupar por arrendador
  const byLandlord = new Map<string, { owner: any; properties: any[] }>()
  for (const m of mandates) {
    const key = m.owner.id
    if (!byLandlord.has(key)) byLandlord.set(key, { owner: m.owner, properties: [] })
    byLandlord.get(key)!.properties.push(m.property)
  }

  const result = [...byLandlord.values()].map(({ owner, properties }) => {
    const totalProperties = properties.length
    const paidThisMonth = properties.filter((p) => p.payments[0]?.status === 'PAID').length
    const overduePayments = properties.filter((p) => p.payments[0]?.status === 'OVERDUE').length
    const activeMaintenance = properties.reduce((sum, p) => sum + p.maintenance.length, 0)

    // Semáforo: 🔴 hay overdue | 🟠 mantenciones activas | 🟢 ok
    const status = overduePayments > 0 ? 'RED' : activeMaintenance > 0 ? 'ORANGE' : 'GREEN'

    return { owner, totalProperties, paidThisMonth, overduePayments, activeMaintenance, status }
  })

  return NextResponse.json(result)
}
