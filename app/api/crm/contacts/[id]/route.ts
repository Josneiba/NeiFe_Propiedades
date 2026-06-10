// app/api/crm/contacts/[id]/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id

  const contact = await prisma.crmContact.findUnique({
    where: { id: params.id },
    include: {
      broker: { select: { id: true, name: true } },
      deals: {
        include: {
          deal: {
            include: { property: true, activities: { orderBy: { createdAt: 'desc' }, take: 5 } },
          },
        },
      },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      score: true,
    },
  })

  if (!contact) {
    return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 })
  }

  if (contact.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  return NextResponse.json(contact)
}

export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const body = await request.json()

  // Verify ownership
  const existing = await prisma.crmContact.findUnique({
    where: { id: params.id },
    select: { brokerId: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 })
  }

  if (existing.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { name, email, phone, rut, priority, status, notes } = body

  const updated = await prisma.crmContact.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(rut !== undefined && { rut }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
    },
    include: { deals: true, score: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id

  const existing = await prisma.crmContact.findUnique({
    where: { id: params.id },
    select: { brokerId: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 })
  }

  if (existing.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  // Soft delete
  const updated = await prisma.crmContact.update({
    where: { id: params.id },
    data: { status: 'INACTIVE' },
  })

  return NextResponse.json(updated)
}
