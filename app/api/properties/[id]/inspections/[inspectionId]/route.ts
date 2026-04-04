import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateInspectionSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  scheduledAt: z.string().datetime().optional(),
  reportUrl: z.string().url().optional(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
})

// PATCH — actualizar estado de inspección
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; inspectionId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id: propertyId, inspectionId } = params
    const body = await req.json()
    const data = updateInspectionSchema.parse(body)

    // Verificar que la propiedad pertenece al usuario
    const property = await prisma.property.findFirst({
      where: { id: propertyId, landlordId: session.user.id },
      select: { id: true, tenant: { select: { id: true } } },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // Obtener inspección actual
    const inspection = await prisma.propertyInspection.findUnique({
      where: { id: inspectionId },
    })

    if (!inspection || inspection.propertyId !== propertyId) {
      return NextResponse.json(
        { error: 'Inspección no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar inspección
    const updated = await prisma.propertyInspection.update({
      where: { id: inspectionId },
      data: {
        status: data.status as any,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        reportUrl: data.reportUrl,
        notes: data.notes,
      },
    })

    // Crear notificación si cambia a CONFIRMED
    if (data.status === 'CONFIRMED' && inspection.status !== 'CONFIRMED' && property.tenant?.id) {
      await prisma.notification.create({
        data: {
          userId: property.tenant.id,
          type: 'INSPECTION_CONFIRMED',
          title: 'Inspección confirmada',
          message: `Tu inspección para el ${new Date(
            inspection.scheduledAt
          ).toLocaleDateString('es-CL')} ha sido confirmada`,
        },
      })
    }

    // Crear notificación si se completa
    if (data.status === 'COMPLETED' && inspection.status !== 'COMPLETED' && property.tenant?.id) {
      await prisma.notification.create({
        data: {
          userId: property.tenant.id,
          type: 'SYSTEM',
          title: 'Inspección completada',
          message: 'La inspección ha sido completada',
        },
      })
    }

    return NextResponse.json({ inspection: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating inspection:', error)
    return NextResponse.json(
      { error: 'Error al actualizar inspección' },
      { status: 500 }
    )
  }
}

// DELETE — eliminar inspección
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; inspectionId: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id: propertyId, inspectionId } = params

    // Verificar que la propiedad pertenece al usuario
    const property = await prisma.property.findFirst({
      where: { id: propertyId, landlordId: session.user.id },
      select: { id: true },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const inspection = await prisma.propertyInspection.findUnique({
      where: { id: inspectionId },
    })

    if (!inspection || inspection.propertyId !== propertyId) {
      return NextResponse.json(
        { error: 'Inspección no encontrada' },
        { status: 404 }
      )
    }

    await prisma.propertyInspection.delete({
      where: { id: inspectionId },
    })

    return NextResponse.json({ message: 'Inspección eliminada' })
  } catch (error) {
    console.error('Error deleting inspection:', error)
    return NextResponse.json(
      { error: 'Error al eliminar inspección' },
      { status: 500 }
    )
  }
}
