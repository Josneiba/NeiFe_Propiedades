import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { mandateInclude } from '@/lib/mandates'

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || typeof value === 'undefined'
    ? undefined
    : value

const createMandateSchema = z
  .object({
    propertyId: z.string().min(1),
    ownerId: z.string().min(1),
    notes: z.string().trim().max(1000).optional(),
    startsAt: z.preprocess(emptyToUndefined, z.coerce.date()).optional(),
    expiresAt: z.preprocess(emptyToUndefined, z.coerce.date()).optional(),
    commissionRate: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(100)).optional(),
    commissionType: z.enum(['MONTHLY', 'ONE_TIME', 'ANNUAL']).optional(),
  })
  .refine(
    (data) =>
      !data.startsAt ||
      !data.expiresAt ||
      data.expiresAt.getTime() > data.startsAt.getTime(),
    {
      message: 'La fecha de expiración debe ser posterior a la de inicio',
      path: ['expiresAt'],
    }
  )

const listMandatesSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED']).optional(),
})

function getPropertyLabel(property: { name: string | null; address: string }) {
  return property.name?.trim() || property.address
}

function forbiddenResponse() {
  return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return forbiddenResponse()
  }

  try {
    const body = await req.json()
    const data = createMandateSchema.parse(body)

    // Verify owner is different from broker
    if (data.ownerId === session.user.id) {
      return NextResponse.json(
        { error: 'El propietario no puede ser el mismo que el corredor' },
        { status: 400 }
      )
    }

    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        landlordId: data.ownerId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        landlordId: true,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const brokerPermission = await prisma.brokerPermission.findUnique({
      where: {
        landlordId_brokerId: {
          landlordId: data.ownerId,
          brokerId: session.user.id,
        },
      },
      select: { status: true },
    })

    if (!brokerPermission || brokerPermission.status !== 'APPROVED') {
      return NextResponse.json(
        {
          error:
            'Primero debes solicitar y obtener permiso del propietario para administrar sus propiedades.',
        },
        { status: 403 }
      )
    }

    const existing = await prisma.mandate.findFirst({
      where: {
        propertyId: data.propertyId,
        status: {
          in: ['ACTIVE', 'PENDING']
        },
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un mandato activo o pendiente para esta propiedad' },
        { status: 409 }
      )
    }

    const mandate = await prisma.mandate.create({
      data: {
        propertyId: data.propertyId,
        ownerId: data.ownerId,
        brokerId: session.user.id,
        status: 'PENDING',
        signedByBroker: true,
        brokerSignedAt: new Date(),
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        commissionRate: data.commissionRate,
        commissionType: data.commissionType,
        notes: data.notes,
      },
      include: mandateInclude,
    })

    await createNotification(
      data.ownerId,
      'MANDATE_REQUESTED',
      'Solicitud de administración',
      `El corredor ${session.user.name || session.user.email} solicita administrar tu propiedad`,
      '/dashboard/solicitudes-corredores?tab=propiedades'
    )

    await logActivity(
      session.user.id,
      'MANDATE_REQUESTED',
      `Solicitud de mandato para ${getPropertyLabel(property)}`,
      data.propertyId,
      {
        mandateId: mandate.id,
        ownerId: data.ownerId,
      }
    )

    return NextResponse.json({ mandate }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating mandate:', error)
    return NextResponse.json(
      { error: 'Error al crear mandato' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const query = listMandatesSchema.parse({
      status: req.nextUrl.searchParams.get('status') ?? undefined,
    })

    const propertyId = req.nextUrl.searchParams.get('propertyId')

    const where =
      session.user.role === 'BROKER'
        ? {
            brokerId: session.user.id,
            ...(query.status ? { status: query.status } : {}),
            ...(propertyId ? { propertyId } : {}),
          }
        : session.user.role === 'LANDLORD' || session.user.role === 'OWNER'
          ? {
              ownerId: session.user.id,
              ...(query.status ? { status: query.status } : {}),
              ...(propertyId ? { propertyId } : {}),
            }
          : null

    if (!where) {
      return forbiddenResponse()
    }

    const mandates = await prisma.mandate.findMany({
      where,
      include: mandateInclude,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ mandates })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error fetching mandates:', error)
    return NextResponse.json(
      { error: 'Error al obtener mandatos' },
      { status: 500 }
    )
  }
}
