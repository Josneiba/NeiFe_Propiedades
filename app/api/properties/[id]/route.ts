import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  commune: z.string().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  squareMeters: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  monthlyRentUF: z.number().optional(),
  monthlyRentCLP: z.number().optional(),
})

// GET — detalle de propiedad
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
      include: {
        tenant: {
          select: { id: true, name: true, email: true, phone: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        services: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        maintenance: true,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Error al obtener propiedad' },
      { status: 500 }
    )
  }
}

// PUT — actualizar propiedad
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Verificar que el usuario es el propietario
    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: {
        ...data,
        contractStart: data.contractStart
          ? new Date(data.contractStart)
          : undefined,
        contractEnd: data.contractEnd ? new Date(data.contractEnd) : undefined,
      },
    })

    return NextResponse.json({ property: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Error al actualizar propiedad' },
      { status: 500 }
    )
  }
}

// DELETE — desactivar propiedad (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const deleted = await prisma.property.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ property: deleted })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: 'Error al eliminar propiedad' },
      { status: 500 }
    )
  }
}
