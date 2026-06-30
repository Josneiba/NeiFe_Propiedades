import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id

  const [openDeals, openTasks, openContacts] = await Promise.all([
    prisma.crmDeal.count({
      where: { brokerId, status: 'ACTIVE' },
    }),
    prisma.crmTask.count({
      where: { brokerId, isCompleted: false },
    }),
    prisma.crmContact.count({
      where: { brokerId, status: 'ACTIVE' },
    }),
  ])

  return NextResponse.json({
    openDeals,
    openTasks,
    openContacts,
  })
}
