import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const task = await prisma.crmTask.findUnique({
    where: { id },
    select: { brokerId: true },
  })

  if (!task) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
  if (task.brokerId !== session.user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const data: Record<string, unknown> = {}
  if (body.type !== undefined) data.type = body.type
  if (body.title !== undefined) data.title = body.title
  if (body.description !== undefined) data.description = body.description
  if (body.channel !== undefined) data.channel = body.channel
  if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate)
  if (body.priority !== undefined) data.priority = Number(body.priority)
  if (body.isCompleted !== undefined) {
    data.isCompleted = Boolean(body.isCompleted)
    data.completedAt = body.isCompleted ? new Date() : null
  }

  const updated = await prisma.crmTask.update({
    where: { id },
    data,
    include: {
      deal: { select: { id: true, code: true, title: true } },
      contact: { select: { id: true, code: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}
