import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.crmSavedView.findFirst({ where: { id, brokerId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Vista no encontrada' }, { status: 404 })
  if (existing.isStandard) return NextResponse.json({ error: 'No se puede editar una vista estándar' }, { status: 400 })

  const body = await request.json()
  const updated = await prisma.crmSavedView.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      filters: body.filters ?? existing.filters,
      sortBy: body.sortBy ?? existing.sortBy,
      sortOrder: body.sortOrder ?? existing.sortOrder,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.crmSavedView.findFirst({ where: { id, brokerId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Vista no encontrada' }, { status: 404 })
  if (existing.isStandard) return NextResponse.json({ error: 'No se puede eliminar una vista estándar' }, { status: 400 })

  await prisma.crmSavedView.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
