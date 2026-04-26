import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { assertPropertyAccess } from '@/lib/permissions'

const schema = z.object({
  newCLP: z.number().positive(),
  newUF: z.number().positive().optional(),
  reason: z.string().trim().min(1).max(100),
  ipcRate: z.number().min(0).max(50).optional(),
  effectiveDate: z.string(),
  notes: z.string().trim().max(500).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    try {
      await assertPropertyAccess(id, session.user.id, session.user.role)
    } catch {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const adjustments = await prisma.rentAdjustment.findMany({
      where: { propertyId: id },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ adjustments })
  } catch (error) {
    console.error('Error fetching rent adjustments:', error)
    return NextResponse.json(
      { error: 'Error al obtener historial de renta' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role === 'TENANT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    try {
      await assertPropertyAccess(id, session.user.id, session.user.role)
    } catch {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const body = await req.json()
    const data = schema.parse(body)

    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        monthlyRentCLP: true,
        monthlyRentUF: true,
        tenantId: true,
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const previousCLP = property.monthlyRentCLP || 0

    const [adjustment] = await prisma.$transaction([
      prisma.rentAdjustment.create({
        data: {
          propertyId: id,
          previousCLP,
          newCLP: data.newCLP,
          previousUF: property.monthlyRentUF,
          newUF: data.newUF,
          reason: data.reason,
          ipcRate: data.ipcRate,
          effectiveDate: new Date(data.effectiveDate),
          createdBy: session.user.id,
          notes: data.notes || null,
        },
      }),
      prisma.property.update({
        where: { id },
        data: {
          monthlyRentCLP: data.newCLP,
          ...(data.newUF ? { monthlyRentUF: data.newUF } : {}),
          ...(data.ipcRate !== undefined ? { lastIpcRate: data.ipcRate } : {}),
        },
      }),
      ...(property.tenantId
        ? [
            prisma.notification.create({
              data: {
                userId: property.tenantId,
                type: 'SYSTEM',
                title: 'Renta actualizada',
                message: `La renta de tu propiedad fue ajustada a $${data.newCLP.toLocaleString('es-CL')} CLP. Motivo: ${data.reason}.`,
                link: '/mi-arriendo/pagos',
              },
            }),
          ]
        : []),
    ])

    return NextResponse.json({ adjustment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    console.error('Error creating rent adjustment:', error)
    return NextResponse.json(
      { error: 'Error al registrar ajuste de renta' },
      { status: 500 }
    )
  }
}
