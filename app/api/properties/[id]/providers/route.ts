import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

// GET — listar proveedores asignados a esta propiedad
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Anti-IDOR: verificar que la propiedad es del landlord
  const property = await prisma.property.findFirst({
    where: { id: params.id, landlordId: session.user.id },
    select: { id: true }
  })

  if (!property) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
  }

  const providers = await prisma.propertyProvider.findMany({
    where: { propertyId: params.id },
    include: {
      provider: {
        select: {
          id: true, name: true, specialty: true,
          phone: true, email: true, photoUrl: true,
          description: true, rating: true,
        }
      }
    },
    orderBy: { assignedAt: 'asc' }
  })

  return NextResponse.json({ providers })
}

// POST — asignar proveedor a esta propiedad (Body: { providerId, notes? })
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Anti-IDOR: verificar ownership
  const property = await prisma.property.findFirst({
    where: { id: params.id, landlordId: session.user.id },
    select: { id: true }
  })

  if (!property) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
  }

  const { providerId } = await req.json()

  if (!providerId || typeof providerId !== 'string') {
    return NextResponse.json({ error: 'providerId requerido' }, { status: 400 })
  }

  // Verificar que el proveedor es del landlord
  const provider = await prisma.provider.findFirst({
    where: { id: providerId, landlordId: session.user.id },
    select: { id: true, name: true }
  })

  if (!provider) {
    return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })
  }

  const assignment = await prisma.propertyProvider.upsert({
    where: {
      propertyId_providerId: {
        propertyId: params.id,
        providerId,
      }
    },
    create: { propertyId: params.id, providerId },
    update: {},
  })

  return NextResponse.json({ assignment }, { status: 201 })
}

// DELETE — desasignar proveedor de esta propiedad (Body: { providerId })
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Anti-IDOR
  const property = await prisma.property.findFirst({
    where: { id: params.id, landlordId: session.user.id },
    select: { id: true }
  })

  if (!property) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
  }

  const { providerId } = await req.json()

  await prisma.propertyProvider.delete({
    where: {
      propertyId_providerId: {
        propertyId: params.id,
        providerId,
      }
    }
  }).catch(() => {}) // No fallar si ya no existe

  return NextResponse.json({ ok: true })
}
