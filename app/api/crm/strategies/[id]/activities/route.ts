import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { id } = await params
  const strategy = await prisma.crmStrategy.findFirst({ where: { id, brokerId: session.user.id } } as any)
  if (!strategy) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const body = await request.json()
  if (!body.title) return NextResponse.json({ error: 'title requerido' }, { status: 400 })
  const dueDate = body.dueDate ? new Date(body.dueDate) : null

  const result = await prisma.$transaction(async (tx) => {
    const task = dueDate
      ? await tx.crmTask.create({
          data: {
            brokerId: session.user.id,
            type: 'SEGUIMIENTO',
            title: body.title,
            description: `Actividad de estrategia: ${strategy.name}`,
            dueDate,
            priority: 1,
            isAutomatic: true,
          },
        })
      : null

    return tx.crmStrategyActivity.create({
      data: {
        strategyId: id,
        title: body.title,
        ownerId: body.ownerId ?? session.user.id,
        dueDate,
        taskId: task?.id ?? null,
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    } as any)
  })

  return NextResponse.json(result, { status: 201 })
}
