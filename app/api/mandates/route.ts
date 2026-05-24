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
    ownerId: z.string().min(1).optional(),
    brokerId: z.string().min(1).optional(),
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

  if (
    session.user.role !== 'BROKER' &&
    session.user.role !== 'LANDLORD' &&
    session.user.role !== 'OWNER'
  ) {
    return forbiddenResponse()
  }

  try {
    const body = await req.json()
    const data = createMandateSchema.parse(body)

    const ownerId =
      session.user.role === 'BROKER' ? data.ownerId : session.user.id
    const brokerId =
      session.user.role === 'BROKER' ? session.user.id : data.brokerId

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId es requerido' },
        { status: 400 }
      )
    }

    if (!brokerId) {
      return NextResponse.json(
        { error: 'brokerId es requerido' },
        { status: 400 }
      )
    }

    if (ownerId === brokerId) {
      return NextResponse.json(
        { error: 'El propietario no puede ser el mismo que el corredor' },
        { status: 400 }
      )
    }

    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        landlordId: ownerId,
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

    const broker = await prisma.user.findFirst({
      where: {
        id: brokerId,
        role: 'BROKER',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!broker) {
      return NextResponse.json(
        { error: 'Corredor no encontrado' },
        { status: 404 }
      )
    }

    if (session.user.role === 'BROKER') {
      const brokerPermission = await prisma.brokerPermission.findUnique({
        where: {
          landlordId_brokerId: {
            landlordId: ownerId,
            brokerId,
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
        ownerId,
        brokerId,
        status: 'PENDING',
        signedByBroker: session.user.role === 'BROKER',
        brokerSignedAt: session.user.role === 'BROKER' ? new Date() : undefined,
        signedByOwner:
          session.user.role === 'LANDLORD' || session.user.role === 'OWNER',
        ownerSignedAt:
          session.user.role === 'LANDLORD' || session.user.role === 'OWNER'
            ? new Date()
            : undefined,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        commissionRate: data.commissionRate,
        commissionType: data.commissionType,
        notes: data.notes,
      },
      include: mandateInclude,
    })

    if (session.user.role === 'BROKER') {
      await createNotification({
        userId: ownerId,
        type: 'MANDATE_REQUESTED',
        title: 'Solicitud de administración',
        message: `El corredor ${session.user.name || session.user.email} solicita administrar tu propiedad`,
        link: '/dashboard/solicitudes-corredores?tab=propiedades'
      })
    } else {
      await createNotification({
        userId: brokerId,
        type: 'MANDATE_REQUESTED',
        title: 'Nueva solicitud de administración',
        message: `${session.user.name || session.user.email} quiere delegarte la administración de una propiedad.`,
        link: '/broker/mandatos'
      })
    }

    await logActivity(
      session.user.id,
      'MANDATE_REQUESTED',
      `Solicitud de mandato para ${getPropertyLabel(property)}`,
      data.propertyId,
      {
        mandateId: mandate.id,
        ownerId,
        brokerId,
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
