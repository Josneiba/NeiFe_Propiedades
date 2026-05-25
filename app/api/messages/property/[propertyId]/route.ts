import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, context: any) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propertyId } = context.params

  const messages = await prisma.brokerMessage.findMany({
    where: { propertyId },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest, context: any) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propertyId } = context.params
  const body = await request.json().catch(() => ({}))
  const { message, subject, tenantId } = body

  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const created = await prisma.brokerMessage.create({
    data: {
      propertyId,
      senderId: session.user.id,
      tenantId: tenantId ?? '',
      subject: subject ?? '',
      message,
    },
  })

  return NextResponse.json({ message: created }, { status: 201 })
}
