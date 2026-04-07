import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2),
  specialty: z.enum([
    'PLUMBER',
    'ELECTRICIAN',
    'PAINTER',
    'CARPENTER',
    'LOCKSMITH',
    'GENERAL',
    'OTHER',
  ]),
  phone: z.string(),
  email: z.string().email().optional(),
  photoUrl: z.string().optional(),
  description: z.string().optional(),
  rating: z.number().optional(),
})

// GET — listar proveedores del arrendador
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const providers = await prisma.provider.findMany({
      where: { landlordId: session.user.id, isActive: true },
      include: {
        _count: {
          select: { maintenance: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ providers })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    )
  }
}

// POST — crear proveedor
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const provider = await prisma.provider.create({
      data: {
        ...data,
        landlordId: session.user.id,
      },
    })

    return NextResponse.json({ provider }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      return NextResponse.json({ error: messages }, { status: 400 })
    }
    console.error('Error creating provider:', error)
    return NextResponse.json(
      { error: 'Error al crear proveedor' },
      { status: 500 }
    )
  }
}
