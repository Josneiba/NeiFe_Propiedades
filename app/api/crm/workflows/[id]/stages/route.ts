import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id: workflowId } = await params
  const body = await request.json()
  const { name, description, isRequired } = body
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  try {
    const maxOrder = (await prisma.crmWorkflowStage.findMany({ where: { workflowId }, orderBy: { order: 'desc' }, take: 1 }))[0]?.order ?? 0
    const stage = await prisma.crmWorkflowStage.create({ data: { workflowId, name, description: description || null, isRequired: !!isRequired, order: maxOrder + 1 } })
    return NextResponse.json(stage, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error creating stage' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { stageId, action } = await request.json()
  const { id: workflowId } = await params
  try {
    if (action === 'reorder' && stageId) {
      // body should include newOrder
      const { newOrder } = await request.json()
      const stage = await prisma.crmWorkflowStage.findUnique({ where: { id: stageId } })
      if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 })
      // simple reorder: update target then normalize others
      await prisma.$transaction(async (tx) => {
        await tx.crmWorkflowStage.update({ where: { id: stageId }, data: { order: newOrder } })
        const stages = await tx.crmWorkflowStage.findMany({ where: { workflowId }, orderBy: { order: 'asc' } })
        for (let i = 0; i < stages.length; i++) {
          if (stages[i].order !== i + 1) await tx.crmWorkflowStage.update({ where: { id: stages[i].id }, data: { order: i + 1 } })
        }
      })
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
