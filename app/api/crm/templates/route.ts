import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { extractVariables } from '@/lib/template-engine'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const templates = await prisma.crmMessageTemplate.findMany({
    where: { brokerId: session.user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { name, channel, subject, body } = await req.json()
  if (!name || !channel || !body)
    return NextResponse.json({ error: 'Faltan: name, channel, body' }, { status: 400 })

  const variables = extractVariables(body)

  const template = await prisma.crmMessageTemplate.create({
    data: { brokerId: session.user.id, name, channel, subject: subject ?? null, body, variables },
  })
  return NextResponse.json(template, { status: 201 })
}
