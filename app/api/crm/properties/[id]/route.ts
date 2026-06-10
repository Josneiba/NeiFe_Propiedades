// app/api/crm/properties/[id]/route.ts
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

  const property = await prisma.crmProperty.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      broker: { select: { id: true, name: true } },
      deals: { include: { contacts: { include: { contact: true } } } },
    },
  })

  if (!property) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
  }

  if (property.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  return NextResponse.json(property)
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

  const existing = await prisma.crmProperty.findUnique({
    where: { id: params.id },
    select: { brokerId: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
  }

  if (existing.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const {
    address,
    commune,
    bedrooms,
    bathrooms,
    sqMeters,
    askingPrice,
    crmStatus,
    ownerId,
    notes,
  } = body

  const updated = await prisma.crmProperty.update({
    where: { id: params.id },
    data: {
      ...(address && { address }),
      ...(commune && { commune }),
      ...(bedrooms !== undefined && { bedrooms: bedrooms ? parseInt(bedrooms) : null }),
      ...(bathrooms !== undefined && { bathrooms: bathrooms ? parseInt(bathrooms) : null }),
      ...(sqMeters !== undefined && { sqMeters: sqMeters ? parseFloat(sqMeters) : null }),
      ...(askingPrice !== undefined && { askingPrice: askingPrice ? parseFloat(askingPrice) : null }),
      ...(crmStatus && { crmStatus }),
      ...(ownerId !== undefined && { ownerId }),
      ...(notes !== undefined && { notes }),
    },
    include: { owner: true, deals: true },
  })

  return NextResponse.json(updated)
}
