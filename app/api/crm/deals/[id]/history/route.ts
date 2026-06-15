import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await paramsPromise
  const brokerId = session.user.id

  // Verificar que el deal pertenece al broker
  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    select: { brokerId: true },
  })

  if (!deal || deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const history = await prisma.crmDealStageHistory.findMany({
    where: { dealId: id },
    orderBy: { changedAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(history)
}
