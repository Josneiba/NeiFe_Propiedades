import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const brokerId = session.user.id
  const body = await req.json().catch(() => ({}))

  const task = await prisma.crmTask.findUnique({ where: { id } })
  if (!task || task.brokerId !== brokerId)
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const updated = await prisma.crmTask.update({
    where: { id },
    data: { isCompleted: true, completedAt: new Date() },
  })

  await prisma.crmStrategyActivity.updateMany({
    where: { taskId: id },
    data: { isCompleted: true },
  } as any)

  // Si tiene notas, registrar como actividad en el deal
  if (task.dealId && body.notes) {
    await prisma.crmActivity.create({
      data: {
        type: (task.type as any) ?? 'NOTA',
        title: `Completado: ${task.title}`,
        description: body.notes,
        brokerId,
        dealId: task.dealId,
        isDone: true,
        completedAt: new Date(),
      },
    })
  }

  return NextResponse.json(updated)
}
