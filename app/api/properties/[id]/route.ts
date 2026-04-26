import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { assertPropertyAccess } from '@/lib/permissions'
import { logUnauthorizedAccess } from '@/lib/activity'

const emptyToUndefined = (val: unknown) =>
  val === '' || val === null || typeof val === 'undefined' ? undefined : val

const optionalNumber = z
  .preprocess(emptyToUndefined, z.coerce.number().finite())
  .optional()
const optionalInt = z
  .preprocess(emptyToUndefined, z.coerce.number().int().finite())
  .optional()
const optionalDate = z
  .preprocess(emptyToUndefined, z.coerce.date())
  .optional()
const optionalRate = z
  .preprocess(emptyToUndefined, z.coerce.number().finite())
  .refine((v) => v === undefined || (v >= 0 && v <= 100), {
    message: 'commissionRate debe estar entre 0 y 100',
  })
  .optional()

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  commune: z.string().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  bedrooms: optionalInt,
  bathrooms: optionalInt,
  squareMeters: optionalNumber,
  lat: optionalNumber,
  lng: optionalNumber,
  contractStart: optionalDate,
  contractEnd: optionalDate,
  monthlyRentUF: optionalNumber,
  monthlyRentCLP: optionalInt,  // Cambio: debe ser Int, no Number
  // Campos del agente/corredor
  agentName: z.string().max(100).optional(),
  agentRut: z.string().max(20).optional(),
  agentEmail: z.string().email().optional(),
  agentPhone: z.string().max(20).optional(),
  agentCompany: z.string().max(100).optional(),
  commissionRate: optionalRate,
  commissionType: z.enum(['MONTHLY', 'ONE_TIME', 'ANNUAL']).optional(),
  commissionPaidUntil: optionalDate,
  commissionNotes: z.string().max(500).optional(),
  // Inspecciones e IPC
  inspectionFrequencyMonths: optionalInt,
  ipcAdjustmentMonths: optionalInt,
})

// GET — detalle de propiedad
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    const property = await prisma.property.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rut: true,
            documentType: true,
            documentNumber: true,
            documentNumberNormalized: true,
          },
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
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        providers: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                specialty: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        mandates: {
          where: { status: 'ACTIVE' },
          select: { brokerId: true, status: true },
        },
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const canAccess =
      property.landlordId === session.user.id ||
      property.tenantId === session.user.id ||
      (session.user.role === 'BROKER' &&
        property.mandates.some(
          (mandate) =>
            mandate.brokerId === session.user.id && mandate.status === 'ACTIVE'
        ))

    if (!canAccess) {
      logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    const { mandates, ...propertyResponse } = property

    return NextResponse.json({ property: propertyResponse })
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    try {
      await assertPropertyAccess(id, session.user.id, session.user.role)
    } catch {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const parsed = updateSchema.parse(body)
    const data = Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) =>
          value !== undefined &&
          !(typeof value === 'number' && Number.isNaN(value))
      )
    )

    console.log('Update payload:', JSON.stringify(data, null, 2))

    const updated = await prisma.property.update({
      where: { id },
      data,
    })

    return NextResponse.json({ property: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      console.error('Validation error:', messages)
      return NextResponse.json({ error: messages }, { status: 400 })
    }
    
    // Manejo mejorado de errores de Prisma y otros errores
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error updating property:', errorMessage)
    
    return NextResponse.json(
      { error: 'Error al actualizar propiedad' },
      { status: 500 }
    )
  }
}

export const PATCH = PUT

// DELETE — desactivar propiedad (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const property = await prisma.property.findFirst({
      where: {
        id,
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
      where: { id },
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
