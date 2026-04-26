import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET no está configurado' },
      { status: 500 }
    )
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const dayOfMonth = now.getDate()

  const overdueCandidates = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lt: currentMonth } },
        ...(dayOfMonth > 10
          ? [{ year: currentYear, month: currentMonth }]
          : []),
      ],
    },
    include: {
      property: {
        select: {
          landlordId: true,
          address: true,
        },
      },
    },
    take: 250,
  })

  if (overdueCandidates.length === 0) {
    return NextResponse.json({
      success: true,
      markedOverdue: 0,
      timestamp: now.toISOString(),
    })
  }

  await prisma.payment.updateMany({
    where: {
      id: { in: overdueCandidates.map((payment) => payment.id) },
    },
    data: { status: 'OVERDUE' },
  })

  const byLandlord = new Map<string, typeof overdueCandidates>()
  for (const payment of overdueCandidates) {
    const landlordId = payment.property.landlordId
    if (!byLandlord.has(landlordId)) byLandlord.set(landlordId, [])
    byLandlord.get(landlordId)?.push(payment)
  }

  for (const [landlordId, payments] of byLandlord) {
    const count = payments.length
    await createNotification(
      landlordId,
      'PAYMENT_OVERDUE',
      count === 1 ? 'Pago atrasado detectado' : `${count} pagos atrasados detectados`,
      count === 1
        ? `El pago de ${payments[0].property.address} está atrasado.`
        : `Tienes ${count} pagos atrasados en tus propiedades.`,
      '/dashboard/pagos?status=OVERDUE'
    )
  }

  return NextResponse.json({
    success: true,
    markedOverdue: overdueCandidates.length,
    timestamp: now.toISOString(),
  })
}
