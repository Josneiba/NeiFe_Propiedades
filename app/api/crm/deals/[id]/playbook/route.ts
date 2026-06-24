import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_PLAYBOOK } from '@/lib/playbook-defaults'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const brokerId = session.user.id

  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    select: { id: true, stage: true, brokerId: true },
  })
  if (!deal || deal.brokerId !== brokerId)
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const completions = await prisma.crmPlaybookCompletion.findMany({
    where: { dealId: id },
    select: { stepId: true, completedAt: true, notes: true },
  })
  const completedIds = new Set(completions.map((c) => c.stepId))

  const stageSteps = DEFAULT_PLAYBOOK.filter((s) => s.stage === deal.stage)
  const result = stageSteps.map((s) => {
    const stepId = `${s.stage}-${s.order}`
    const completion = completions.find((c) => c.stepId === stepId)
    return {
      ...s,
      stepId,
      isCompleted: completedIds.has(stepId),
      completedAt: completion?.completedAt ?? null,
      notes: completion?.notes ?? null,
    }
  })

  const allRequired = result.filter((s) => s.isRequired)
  const canAdvance = allRequired.every((s) => s.isCompleted)

  return NextResponse.json({ steps: result, canAdvance, stage: deal.stage })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const brokerId = session.user.id
  const { stepId, notes } = await req.json()

  if (!stepId) return NextResponse.json({ error: 'stepId requerido' }, { status: 400 })

  const deal = await prisma.crmDeal.findUnique({ where: { id }, select: { brokerId: true } })
  if (!deal || deal.brokerId !== brokerId)
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const completion = await prisma.crmPlaybookCompletion.upsert({
    where: { stepId_dealId: { stepId, dealId: id } },
    create: { stepId, dealId: id, brokerId, notes: notes ?? null },
    update: { notes: notes ?? null },
  })

  return NextResponse.json(completion)
}
