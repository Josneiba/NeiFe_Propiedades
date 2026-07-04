import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id: instanceId } = await params
  const { stageId } = await request.json()
  if (!stageId) return NextResponse.json({ error: 'stageId required' }, { status: 400 })

  try {
    // stageId is the instance-stage id (primary key on CrmWorkflowInstanceStage).
    const updated = await prisma.crmWorkflowInstanceStage.updateMany({ where: { instanceId, id: stageId }, data: { isCompleted: true, completedAt: new Date() } })
    const nextStage = await prisma.crmWorkflowInstanceStage.findFirst({
      where: { instanceId, isCompleted: false },
      include: { stage: true },
      orderBy: { stage: { order: 'asc' } },
    })
    await prisma.crmWorkflowInstance.update({
      where: { id: instanceId },
      data: { currentStageId: nextStage?.stageId ?? null },
    })
    return NextResponse.json({ ok: true, updated: updated.count, currentStageId: nextStage?.stageId ?? null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error updating stage' }, { status: 500 })
  }
}
