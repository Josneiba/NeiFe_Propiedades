import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  photoUrl: z.string().optional(),
  description: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
})

// GET — obtener detalle del proveedor
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const provider = await prisma.provider.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
      include: {
        properties: {
          include: { property: true },
        },
      },
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ provider })
  } catch (error) {
    console.error('Error getting provider:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedor' },
      { status: 500 }
    )
  }
}

// PUT — actualizar proveedor
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const provider = await prisma.provider.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    const updated = await prisma.provider.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ provider: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating provider:', error)
    return NextResponse.json(
      { error: 'Error al actualizar proveedor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const provider = await prisma.provider.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    const deleted = await prisma.provider.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ provider: deleted })
  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json(
      { error: 'Error al eliminar proveedor' },
      { status: 500 }
    )
  }
}
