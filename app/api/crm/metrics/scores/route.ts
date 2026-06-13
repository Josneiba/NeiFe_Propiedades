// app/api/crm/metrics/scores/route.ts
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

  const scores = await prisma.crmContactScore.findMany({
    where: {
      contact: {
        brokerId,
        status: 'ACTIVE',
      },
    },
    include: {
      contact: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { score: 'asc' }, // Lower scores first (higher risk)
    take: 100,
  })

  return NextResponse.json(scores)
}
