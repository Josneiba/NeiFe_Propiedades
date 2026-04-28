import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

const managerUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PROCESSING', 'CANCELLED']),
  method: z.string().optional(),
  receipt: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.coerce.date().optional(),
})

const tenantReceiptSchema = z.object({
  receiptUrl: z.string().url().optional(),
  receipt: z.string().url().optional(),
  method: z.string().optional(),
  notes: z.string().optional(),
})

// PATCH — actualizar estado de pago
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
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            landlordId: true,
            tenantId: true,
            managedBy: true,
            mandates: {
              where: { status: 'ACTIVE' },
              select: { brokerId: true },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()

    if (session.user.role === 'TENANT') {
      if (payment.property.tenantId !== session.user.id) {
        return NextResponse.json(
          { error: 'No tiene permisos para actualizar este pago' },
          { status: 403 }
        )
      }

      const data = tenantReceiptSchema.parse(body)
      const receiptUrl = data.receiptUrl ?? data.receipt
      if (!receiptUrl) {
        return NextResponse.json(
          { error: 'URL de comprobante requerida' },
          { status: 400 }
        )
      }

      const updated = await prisma.payment.update({
        where: { id },
        data: {
          receipt: receiptUrl,
          method: data.method ?? payment.method ?? 'transfer',
          notes: data.notes ?? 'Comprobante de transferencia subido por arrendatario',
          status: 'PROCESSING',
        },
      })

      const notifyUserId =
        payment.property.managedBy ?? payment.property.landlordId
      const managerLink = payment.property.managedBy
        ? `/broker/pagos?status=PROCESSING&property=${payment.property.id}`
        : '/dashboard/pagos?status=PROCESSING'

      await createNotification(
        notifyUserId,
        'PAYMENT_RECEIVED',
        'Comprobante de pago recibido',
        `El arrendatario subió un comprobante para ${payment.property.address}. Verifica y confirma el pago.`,
        managerLink
      )

      return NextResponse.json({ payment: updated })
    }

    const hasActiveMandate = payment.property.mandates.some(
      (mandate) => mandate.brokerId === session.user.id
    )
    const canManagePayment =
      payment.property.landlordId === session.user.id ||
      payment.property.managedBy === session.user.id ||
      hasActiveMandate

    if (!canManagePayment) {
      return NextResponse.json(
        { error: 'No tiene permisos para actualizar este pago' },
        { status: 403 }
      )
    }

    const data = managerUpdateSchema.parse(body)

    const updateData: any = {
      status: data.status,
      method: data.method,
      notes: data.notes,
    }

    if (data.status === 'PAID') {
      updateData.paidAt = data.paidAt ?? new Date()
      if (data.receipt) updateData.receipt = data.receipt
    }

    const updated = await prisma.payment.update({
      where: { id },
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
        updated.property.id
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
