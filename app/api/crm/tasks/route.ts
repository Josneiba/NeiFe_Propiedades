import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { generateTaskSuggestions } from '@/lib/task-engine'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER')
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

    const brokerId = session.user.id
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 86_400_000)

    // Tareas manuales pendientes del día
    const manualTasks = await prisma.crmTask.findMany({
      where: { brokerId, isCompleted: false, dueDate: { lte: endOfDay } },
      include: {
        deal: { select: { id: true, code: true, title: true, stage: true } },
        contact: { select: { id: true, code: true, name: true, phone: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 20,
    })

    // Deals activos con contexto para el motor
    const deals = await prisma.crmDeal.findMany({
      where: { brokerId, status: 'ACTIVE' },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, type: true } },
        tasks: {
          where: { isCompleted: false },
          select: { id: true, isCompleted: true, dueDate: true, type: true, title: true, priority: true },
        },
        playbookSteps: { select: { stepId: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Actividades completadas hoy (para el contador de productividad)
    const todayActivities = await prisma.crmActivity.count({
      where: { brokerId, createdAt: { gte: startOfDay, lt: endOfDay } },
    })

    // Sugerencias automáticas del motor
    const suggestions = generateTaskSuggestions(deals as any)

    return NextResponse.json({ manualTasks, suggestions, todayActivities, totalDeals: deals.length })
  } catch (error) {
    console.error('crm/tasks route error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const brokerId = session.user.id
  const body = await req.json()
  const { type, title, description, channel, dueDate, dealId, contactId, priority } = body

  if (!type || !title || !dueDate) {
    return NextResponse.json({ error: 'Faltan: type, title, dueDate' }, { status: 400 })
  }

  const task = await prisma.crmTask.create({
    data: {
      brokerId,
      type,
      title,
      description: description ?? null,
      channel: channel ?? null,
      dueDate: new Date(dueDate),
      dealId: dealId ?? null,
      contactId: contactId ?? null,
      priority: priority ?? 0,
    },
    include: {
      deal: { select: { id: true, code: true, title: true } },
      contact: { select: { id: true, code: true, name: true } },
    },
  })

  return NextResponse.json(task, { status: 201 })
}
