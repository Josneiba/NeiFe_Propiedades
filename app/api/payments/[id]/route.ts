import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PROCESSING', 'CANCELLED']),
  method: z.string().optional(),
  receipt: z.string().optional(),
  notes: z.string().optional(),
})

// PATCH — actualizar estado de pago
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        property: {
          select: { landlordId: true, tenantId: true },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    if (payment.property.landlordId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tiene permisos para actualizar este pago' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    const updateData: any = {
      status: data.status,
      method: data.method,
      notes: data.notes,
    }

    if (data.status === 'PAID') {
      updateData.paidAt = new Date()
      if (data.receipt) updateData.receipt = data.receipt
    }

    const updated = await prisma.payment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            landlordId: true,
            tenantId: true,
          },
        },
      },
    })

    // Crear notificaciones y logs según el status
    if (data.status === 'PAID' && payment.property.tenantId) {
      await createNotification(
        payment.property.tenantId,
        'PAYMENT_RECEIVED',
        'Pago confirmado',
        `Tu pago de ${updated.month}/${updated.year} ha sido confirmado`,
        '/mi-arriendo/pagos'
      )

      await logActivity(
        session.user.id,
        'PAYMENT_CONFIRMED',
        `Pago de ${updated.month}/${updated.year} confirmado`,
        payment.property.id
      )
    }

    if (data.status === 'OVERDUE' && payment.property.tenantId) {
      await createNotification(
        payment.property.tenantId,
        'PAYMENT_OVERDUE',
        'Pago vencido',
        `Tu pago de ${updated.month}/${updated.year} está vencido`,
        '/mi-arriendo/pagos'
      )
    }

    return NextResponse.json({ payment: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Error al actualizar pago' },
      { status: 500 }
    )
  }
}
