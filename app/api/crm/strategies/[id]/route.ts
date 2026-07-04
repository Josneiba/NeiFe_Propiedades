import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const strategy = await prisma.crmStrategy.findFirst({
    where: { id, brokerId: session.user.id },
    include: { activities: { include: { owner: { select: { id: true, name: true, email: true } } } } },
  } as any)
  if (!strategy) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(strategy)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const existing = await prisma.crmStrategy.findFirst({ where: { id, brokerId: session.user.id } } as any)
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const strategy = await prisma.crmStrategy.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      goalDescription: body.goalDescription ?? undefined,
      targetNumber: body.targetNumber === undefined ? undefined : body.targetNumber === null ? null : Number(body.targetNumber),
      expectedConversion: body.expectedConversion === undefined ? undefined : body.expectedConversion === null ? null : Number(body.expectedConversion),
    },
  } as any)
  return NextResponse.json(strategy)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const existing = await prisma.crmStrategy.findFirst({ where: { id, brokerId: session.user.id } } as any)
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  await prisma.crmStrategy.delete({ where: { id } } as any)
  return NextResponse.json({ ok: true })
}
