import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addMonths } from 'date-fns'
import { assertPropertyAccess } from '@/lib/permissions'

const ipcAdjustmentSchema = z.object({
  ipcRate: z.number().min(0).max(50),
  scheduledDate: z.string().datetime(),
})

const applyIpcSchema = z.object({
  ipcRate: z.number().min(0).max(50),
})

// GET — listar reajustes IPC de una propiedad
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id: propertyId } = await params
    try {
      await assertPropertyAccess(propertyId, session.user.id, session.user.role)
    } catch {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const adjustments = await prisma.ipcAdjustment.findMany({
      where: { propertyId },
      orderBy: { scheduledDate: 'desc' },
    })

    return NextResponse.json({ adjustments })
  } catch (error) {
    console.error('Error fetching IPC adjustments:', error)
    return NextResponse.json(
      { error: 'Error al obtener reajustes IPC' },
      { status: 500 }
    )
  }
}

// POST — aplicar reajuste IPC
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id: propertyId } = await params
    const body = await req.json()
    const { ipcRate } = applyIpcSchema.parse(body)

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
      select: {
        id: true,
        monthlyRentCLP: true,
        ipcAdjustmentMonths: true,
        tenant: { select: { id: true } },
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    if (!property.monthlyRentCLP) {
      return NextResponse.json(
        { error: 'La propiedad no tiene arriendo definido' },
        { status: 400 }
      )
    }

    // Calcular nuevo arriendo
    const previousRentCLP = property.monthlyRentCLP
    const newRentCLP = Math.round(previousRentCLP * (1 + ipcRate / 100))

    // Crear ajuste IPC
    const adjustment = await prisma.ipcAdjustment.create({
      data: {
        propertyId,
        scheduledDate: new Date(),
        ipcRate,
        previousRentCLP,
        newRentCLP,
        status: 'APPLIED' as any,
        appliedAt: new Date(),
      },
    })

    // Actualizar arriendo en la propiedad
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        monthlyRentCLP: newRentCLP,
        lastIpcRate: ipcRate,
        nextIpcDate: property.ipcAdjustmentMonths
          ? addMonths(new Date(), property.ipcAdjustmentMonths)
          : undefined,
      },
    })

    // Crear notificación para el arrendatario
    if (property.tenant?.id) {
      await prisma.notification.create({
        data: {
          userId: property.tenant.id,
          type: 'SYSTEM',
          title: 'Reajuste IPC aplicado',
          message: `Tu arriendo ha sido reajustado según IPC (${ipcRate}%). Nuevo monto: $${newRentCLP.toLocaleString(
            'es-CL'
          )}`,
          link: `/mi-arriendo/pagos`,
        },
      })
    }

    return NextResponse.json({ adjustment, property: updatedProperty }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error applying IPC adjustment:', error)
    return NextResponse.json(
      { error: 'Error al aplicar reajuste IPC' },
      { status: 500 }
    )
  }
}
