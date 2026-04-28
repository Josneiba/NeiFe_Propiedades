import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { createNotification } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  propertyId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  water: z.number().default(0),
  waterBillUrl: z.string().url().optional(),
  electricity: z.number().default(0),
  lightBillUrl: z.string().url().optional(),
  gas: z.number().default(0),
  gasBillUrl: z.string().url().optional(),
  garbage: z.number().default(0),
  garbageBillUrl: z.string().url().optional(),
  commonExpenses: z.number().default(0),
  commonBillUrl: z.string().url().optional(),
  extraItems: z.array(
    z.object({
      label: z.string().max(50),
      amount: z.number().min(0),
      billUrl: z.string().url().optional(),
    })
  ).max(5).optional(),
  notes: z.string().max(500).optional(),
  // Legacy fields para compatibilidad
  other: z.number().default(0),
  otherLabel: z.string().optional(),
})

function getServicePropertyWhere(userId: string, role: string) {
  if (role === 'BROKER') {
    return {
      isActive: true,
      OR: [
        { managedBy: userId },
        {
          mandates: {
            some: {
              brokerId: userId,
              status: 'ACTIVE' as const,
            },
          },
        },
      ],
    }
  }

  return {
    landlordId: userId,
    isActive: true,
  }
}

// GET — listar servicios con filtros
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (
    session.user.role !== 'LANDLORD' &&
    session.user.role !== 'OWNER' &&
    session.user.role !== 'BROKER'
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const propertyId = searchParams.get('propertyId')
    const year = searchParams.get('year')

    const where: any = {
      property: getServicePropertyWhere(session.user.id, session.user.role),
    }

    if (propertyId) where.propertyId = propertyId
    if (year) where.year = parseInt(year)

    const services = await prisma.monthlyService.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, tenantId: true },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
      { status: 500 }
    )
  }
}

// POST — crear servicios del mes
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    if (
      session.user.role !== 'LANDLORD' &&
      session.user.role !== 'OWNER' &&
      session.user.role !== 'BROKER'
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar acceso a la propiedad
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        ...getServicePropertyWhere(session.user.id, session.user.role),
      },
      select: { tenantId: true },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const service = await prisma.monthlyService.upsert({
      where: {
        propertyId_month_year: {
          propertyId: data.propertyId,
          month: data.month,
          year: data.year,
        },
      },
      update: data,
      create: data,
    })

    if (property.tenantId) {
      await createNotification(
        property.tenantId,
        'SYSTEM',
        'Servicios del mes actualizados',
        `Ya puedes revisar los cargos y boletas de ${data.month}/${data.year} en tu panel.`,
        '/mi-arriendo/servicios'
      )
    }

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Error al crear servicios' },
      { status: 500 }
    )
  }
}
