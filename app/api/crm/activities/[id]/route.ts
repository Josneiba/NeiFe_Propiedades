// app/api/crm/activities/[id]/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const body = await request.json()
  const { isDone } = body

  const activity = await prisma.crmActivity.findUnique({
    where: { id: params.id },
    select: { brokerId: true },
  })

  if (!activity) {
    return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })
  }

  if (activity.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const updated = await prisma.crmActivity.update({
    where: { id: params.id },
    data: {
      isDone: isDone ?? true,
      completedAt: isDone ? new Date() : null,
      outcome: body.outcome ?? undefined,
    },
    include: { deal: true, contact: true },
  })

  return NextResponse.json(updated)
}
