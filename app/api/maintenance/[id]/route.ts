import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum([
    'REQUESTED',
    'REVIEWING',
    'APPROVED',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
  ]),
  note: z.string().optional(),
  providerId: z.string().optional(),
  invoiceAmount: z.number().optional(),
  invoiceUrl: z.string().optional(),
  rejectionReason: z.string().optional(),
})

// PATCH — actualizar estado de mantención
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const maintenance = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: true,
        requester: true,
      },
    })

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Mantención no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos — solo el arrendador puede actualizar
    if (maintenance.property.landlordId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tiene permisos para actualizar esta mantención' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    const updateData: any = {
      status: data.status,
      providerId: data.providerId,
      invoiceUrl: data.invoiceUrl,
      invoiceAmount: data.invoiceAmount,
    }

    if (data.status === 'REJECTED') {
      updateData.rejectionReason = data.rejectionReason
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        ...updateData,
        timeline: {
          create: {
            status: data.status,
            note: data.note,
          },
        },
      },
      include: {
        timeline: { orderBy: { createdAt: 'desc' } },
        provider: true,
      },
    })

    // Notificar al arrendatario sobre cambio de estado
    const statusMessages: Record<string, string> = {
      REVIEWING: 'Tu solicitud está en revisión',
      APPROVED: 'Tu solicitud ha sido aprobada',
      IN_PROGRESS: 'El trabajo ha comenzado',
      COMPLETED: 'El trabajo ha sido completado',
      REJECTED: `Solicitud rechazada: ${data.rejectionReason || 'Sin especificar'}`,
    }

    if (statusMessages[data.status]) {
      await createNotification(
        maintenance.requesterId,
        'MAINTENANCE_UPDATE',
        `Mantención: ${data.status}`,
        statusMessages[data.status],
        '/mi-arriendo/mantenciones'
      )
    }

    await logActivity(
      session.user.id,
      'MAINTENANCE_STATUS_UPDATED',
      `Estado actualizado a: ${data.status}`,
      maintenance.propertyId
    )

    return NextResponse.json({ maintenance: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating maintenance:', error)
    return NextResponse.json(
      { error: 'Error al actualizar mantención' },
      { status: 500 }
    )
  }
}
