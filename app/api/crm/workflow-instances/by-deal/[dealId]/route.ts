import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { dealId } = await params
  const instance = await prisma.crmWorkflowInstance.findFirst({ where: { dealId }, include: { stages: { include: { stage: true } }, workflow: true } })
  if (!instance) return NextResponse.json({ found: false })
  return NextResponse.json({ found: true, instance })
}
