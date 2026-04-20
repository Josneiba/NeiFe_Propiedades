import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addMonths } from 'date-fns'
import { assertPropertyAccess } from '@/lib/permissions'

const inspectionSchema = z.object({
  scheduledAt: z.string().datetime(),
  type: z.enum(['ROUTINE', 'CHECKIN', 'CHECKOUT', 'MAINTENANCE', 'IPC_REVIEW']),
  notes: z.string().max(500).optional(),
})

// GET — listar inspecciones de una propiedad
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const propertyId = params.id
    try {
      await assertPropertyAccess(propertyId, session.user.id, session.user.role)
    } catch {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const inspections = await prisma.propertyInspection.findMany({
      where: { propertyId },
      orderBy: { scheduledAt: 'desc' },
    })

    return NextResponse.json({ inspections })
  } catch (error) {
    console.error('Error fetching inspections:', error)
    return NextResponse.json(
      { error: 'Error al obtener inspecciones' },
      { status: 500 }
    )
  }
}

// POST — crear nueva inspección
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const propertyId = params.id
    const body = await req.json()
    const data = inspectionSchema.parse(body)

    try {
      await assertPropertyAccess(propertyId, session.user.id, session.user.role)
    } catch {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, tenant: { select: { id: true } } },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const inspection = await prisma.propertyInspection.create({
      data: {
        propertyId,
        scheduledAt: new Date(data.scheduledAt),
        type: data.type as any,
        notes: data.notes,
        status: 'SCHEDULED',
      },
    })

    // Crear notificación si hay arrendatario
    if (property.tenant?.id) {
      await prisma.notification.create({
        data: {
          userId: property.tenant.id,
          type: 'SYSTEM',
          title: 'Inspección programada',
          message: `Se ha programado una inspección para el ${new Date(
            data.scheduledAt
          ).toLocaleDateString('es-CL')}`,
          link: `/mi-arriendo/inspecciones`,
        },
      })
    }

    return NextResponse.json({ inspection }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating inspection:', error)
    return NextResponse.json(
      { error: 'Error al crear inspección' },
      { status: 500 }
    )
  }
}
