import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  propertyId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  water: z.number().default(0),
  electricity: z.number().default(0),
  gas: z.number().default(0),
  other: z.number().default(0),
  otherLabel: z.string().optional(),
  waterBillUrl: z.string().optional(),
  lightBillUrl: z.string().optional(),
  gasBillUrl: z.string().optional(),
})

// GET — listar servicios con filtros
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const propertyId = searchParams.get('propertyId')
    const year = searchParams.get('year')

    const where: any = {
      property: {
        landlordId: session.user.id,
      },
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

    // Verificar que el usuario es el propietario
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        landlordId: session.user.id,
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
