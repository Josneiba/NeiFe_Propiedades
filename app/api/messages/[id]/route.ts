import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, context: any) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { params } = context
  const { id } = params
  const body = await request.json().catch(() => ({}))
  const { isRead } = body

  if (typeof isRead !== 'boolean') return NextResponse.json({ error: 'isRead required' }, { status: 400 })

  const updated = await prisma.brokerMessage.update({
    where: { id },
    data: { isRead },
  })

  return NextResponse.json({ message: updated })
}

export async function DELETE(request: NextRequest, context: any) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { params } = context
  const { id } = params
  await prisma.brokerMessage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
