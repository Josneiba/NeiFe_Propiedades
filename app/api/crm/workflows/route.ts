import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const brokerId = session.user.id
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  const where: any = {}
  if (type) where.type = type

  // return global + broker-specific
  const workflows = await prisma.crmWorkflow.findMany({
    where: { ...where, OR: [{ brokerId }, { brokerId: null }] },
    include: { stages: { orderBy: { order: 'asc' } } },
    orderBy: [{ type: 'asc' }, { isDefault: 'desc' }],
  })

  return NextResponse.json(workflows)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const brokerId = session.user.id
  const body = await request.json()
  const { name, type, description, isDefault } = body

  if (!name || !type) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  try {
    // if setting isDefault true, unset other defaults for this broker+type
    if (isDefault) {
      await prisma.crmWorkflow.updateMany({ where: { brokerId, type }, data: { isDefault: false } })
    }

    const wf = await prisma.crmWorkflow.create({ data: { name, type, description: description || null, brokerId, isDefault: !!isDefault } })
    return NextResponse.json(wf, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error creando workflow' }, { status: 500 })
  }
}
