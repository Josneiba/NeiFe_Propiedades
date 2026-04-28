import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

const applySchema = z.object({
  ipcRate: z.coerce.number().gt(0).max(50),
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { ipcRate, notes } = applySchema.parse(body)

    const property = await prisma.property.findFirst({
      where: {
        id,
        OR: [
          { landlordId: session.user.id },
          { mandates: { some: { brokerId: session.user.id, status: 'ACTIVE' } } },
        ],
      },
      include: {
        tenant: { select: { id: true, name: true } },
      },
    })

    if (!property || !property.monthlyRentCLP) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o sin renta configurada' },
        { status: 404 }
      )
    }

    const previousCLP = property.monthlyRentCLP
    const newCLP = Math.round(previousCLP * (1 + ipcRate / 100))

    const adjustment = await prisma.ipcAdjustment.create({
      data: {
        propertyId: id,
        scheduledDate: new Date(),
        ipcRate,
        previousRentCLP: previousCLP,
        newRentCLP: newCLP,
        status: 'APPLIED',
        appliedAt: new Date(),
        notes,
      },
    })

    await prisma.property.update({
      where: { id },
      data: {
        monthlyRentCLP: newCLP,
        lastIpcRate: ipcRate,
        nextIpcDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      },
    })

    if (property.tenant) {
      await createNotification(
        property.tenant.id,
        'SYSTEM',
        'Reajuste de renta aplicado',
        `Tu renta fue reajustada según IPC (${ipcRate}%). Nueva renta: $${newCLP.toLocaleString('es-CL')} CLP a partir del próximo mes.`,
        '/mi-arriendo/contrato'
      )
    }

    return NextResponse.json({
      adjustment,
      previousCLP,
      newCLP,
      difference: newCLP - previousCLP,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Tasa IPC inválida' },
        { status: 400 }
      )
    }
    console.error('Error applying IPC adjustment:', error)
    return NextResponse.json(
      { error: 'Error al aplicar reajuste IPC' },
      { status: 500 }
    )
  }
}
