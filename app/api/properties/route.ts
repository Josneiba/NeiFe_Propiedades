import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  commune: z.string(),
  region: z.string().optional().default('Metropolitana'),
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

// GET — listar propiedades del arrendador autenticado
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const properties = await prisma.property.findMany({
      where: { landlordId: session.user.id, isActive: true },
      include: {
        tenant: {
          select: { id: true, name: true, email: true, phone: true },
        },
        payments: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
          take: 1,
        },
        _count: {
          select: {
            maintenance: {
              where: {
                status: {
                  in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Error al obtener propiedades' },
      { status: 500 }
    )
  }
}

// POST — crear nueva propiedad
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'LANDLORD' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const property = await prisma.property.create({
      data: {
        ...data,
        landlordId: session.user.id,
        contractStart: data.contractStart
          ? new Date(data.contractStart)
          : undefined,
        contractEnd: data.contractEnd ? new Date(data.contractEnd) : undefined,
      },
    })

    return NextResponse.json({ property }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Error al crear propiedad' },
      { status: 500 }
    )
  }
}
