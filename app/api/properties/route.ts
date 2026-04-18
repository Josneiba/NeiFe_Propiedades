import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1),
  commune: z.string().min(1),
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
  monthlyRentCLP: z.number().int().positive().optional(),  // Int, no decimal, positive if provided
})

// GET — listar propiedades del arrendador autenticado o filtrar por ownerId
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const ownerId = req.nextUrl.searchParams.get('ownerId')

    // Si se especifica ownerId (para corredores buscando propiedades), permitir solo si es broker
    if (ownerId && ownerId !== session.user.id) {
      if (session.user.role !== 'BROKER') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const properties = await prisma.property.findMany({
      where: { 
        landlordId: ownerId || session.user.id, 
        isActive: true 
      },
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
        mandates: {
          where: { status: 'ACTIVE' },
          select: { id: true, status: true },
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
      // Return specific error messages for each field
      const firstError = error.errors[0]
      if (firstError.path.includes('name')) {
        return NextResponse.json({ error: "El nombre de la propiedad es requerido" }, { status: 400 })
      }
      if (firstError.path.includes('address')) {
        return NextResponse.json({ error: "La dirección es requerida" }, { status: 400 })
      }
      if (firstError.path.includes('commune')) {
        return NextResponse.json({ error: "La comuna es requerida" }, { status: 400 })
      }
      if (firstError.path.includes('monthlyRentCLP')) {
        return NextResponse.json({ error: "El arriendo debe ser un número positivo" }, { status: 400 })
      }
      const messages = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      return NextResponse.json({ error: messages }, { status: 400 })
    }
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Error al crear propiedad' },
      { status: 500 }
    )
  }
}
