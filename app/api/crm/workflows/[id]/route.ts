import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const wf = await prisma.crmWorkflow.findUnique({ where: { id }, include: { stages: { orderBy: { order: 'asc' } } } })
  if (!wf) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(wf)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  try {
    if (body.isDefault) {
      // unset other defaults for this broker+type
      const wf = await prisma.crmWorkflow.findUnique({ where: { id } })
      if (wf) await prisma.crmWorkflow.updateMany({ where: { brokerId: wf.brokerId, type: wf.type }, data: { isDefault: false } })
    }
    const updated = await prisma.crmWorkflow.update({ where: { id }, data: body })
    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error updating' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    await prisma.crmWorkflow.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error deleting' }, { status: 500 })
  }
}
