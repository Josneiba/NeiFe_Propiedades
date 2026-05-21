import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

const createSchema = z.object({
  landlordId: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerName: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(180),
  commune: z.string().trim().min(1).max(80),
  region: z.string().trim().max(120).optional().default('Metropolitana'),
  description: z.string().trim().max(1000).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(10).optional(),
  squareMeters: z.number().min(0).max(10000).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  monthlyRentUF: z.number().min(0).optional(),
  monthlyRentCLP: z.number().int().min(0).optional(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
})

function getRequestLabel(property: { name: string; address: string }) {
  return property.name?.trim() || property.address
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') ?? undefined

  try {
    if (session.user.role === 'BROKER') {
      const requests = await prisma.brokerPropertyCreationRequest.findMany({
        where: {
          brokerId: session.user.id,
          ...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}),
        },
        include: {
          landlord: {
            select: { id: true, name: true, email: true },
          },
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              commune: true,
              region: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ requests })
    }

    if (session.user.role === 'LANDLORD' || session.user.role === 'OWNER') {
      const requests = await prisma.brokerPropertyCreationRequest.findMany({
        where: {
          landlordId: session.user.id,
          ...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}),
        },
        include: {
          broker: {
            select: { id: true, name: true, email: true, company: true },
          },
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              commune: true,
              region: true,
              description: true,
              bedrooms: true,
              bathrooms: true,
              squareMeters: true,
              monthlyRentUF: true,
              monthlyRentCLP: true,
              contractStart: true,
              contractEnd: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ requests })
    }

    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching broker property requests:', error)
    return NextResponse.json(
      { error: 'Error al obtener las solicitudes de alta de propiedades' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'Solo los corredores pueden crear propiedades por cuenta del arrendador' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const landlord = await prisma.user.findFirst({
      where: {
        id: data.landlordId,
        email: data.ownerEmail,
        role: {
          in: ['LANDLORD', 'OWNER'],
        },
      },
      select: { id: true, name: true, email: true },
    })

    if (!landlord) {
      return NextResponse.json({ error: 'No encontramos al arrendador indicado en el sistema' }, { status: 404 })
    }

    const permission = await prisma.brokerPermission.findUnique({
      where: {
        landlordId_brokerId: {
          landlordId: landlord.id,
          brokerId: session.user.id,
        },
      },
      select: { status: true },
    })

    if (!permission || permission.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Primero necesitas permiso general aprobado del arrendador para crear propiedades en su nombre' },
        { status: 403 },
      )
    }

    const existingProperty = await prisma.property.findFirst({
      where: {
        landlordId: landlord.id,
        address: data.address,
      },
      select: { id: true, isActive: true },
    })

    if (existingProperty) {
      return NextResponse.json(
        { error: existingProperty.isActive ? 'Ya existe una propiedad activa con esta dirección para este arrendador' : 'Ya existe una alta pendiente para esta dirección' },
        { status: 409 },
      )
    }

    const created = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          name: data.name,
          address: data.address,
          commune: data.commune,
          region: data.region,
          description: data.description,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          squareMeters: data.squareMeters,
          lat: data.lat,
          lng: data.lng,
          monthlyRentUF: data.monthlyRentUF,
          monthlyRentCLP: data.monthlyRentCLP,
          contractStart: data.contractStart ? new Date(data.contractStart) : undefined,
          contractEnd: data.contractEnd ? new Date(data.contractEnd) : undefined,
          landlordId: landlord.id,
          managedBy: session.user.id,
          isActive: false,
          isPublished: false,
        },
      })

      const requestRow = await tx.brokerPropertyCreationRequest.create({
        data: {
          propertyId: property.id,
          brokerId: session.user.id,
          landlordId: landlord.id,
          ownerName: data.ownerName || landlord.name,
          ownerEmail: landlord.email,
          notes: data.notes,
        },
      })

      return { property, requestRow }
    })

    await createNotification(
      landlord.id,
      'SYSTEM',
      'Nueva propiedad cargada por tu corredor',
      `${session.user.name || session.user.email} creó una propiedad a tu nombre y espera tu aprobación para administrarla.`,
      '/dashboard/solicitudes-corredores?tab=altas',
    )

    await logActivity(
      session.user.id,
      'BROKER_PROPERTY_CREATED',
      `Alta de propiedad pendiente para ${getRequestLabel(created.property)}`,
      created.property.id,
      {
        landlordId: landlord.id,
        requestId: created.requestRow.id,
      },
    )

    return NextResponse.json({ request: created.requestRow, property: created.property }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating broker property request:', error)
    return NextResponse.json(
      { error: 'Error al crear la propiedad en nombre del arrendador' },
      { status: 500 },
    )
  }
}
