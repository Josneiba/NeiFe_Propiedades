import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

const createSchema = z.object({
  propertyId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  amountUF: z.number(),
  amountCLP: z.number(),
  method: z.string().optional(),
  notes: z.string().optional(),
})

// GET — listar pagos con filtros
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const isTenantRequest =
      searchParams.get('tenant') === 'true' || session.user.role === 'TENANT'
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Tenant: devolver pagos de su propiedad con cargos de servicios
    if (isTenantRequest) {
      const property = await prisma.property.findFirst({
        where: { tenantId: session.user.id },
        select: { id: true, monthlyRentCLP: true },
      })

      if (!property) {
        return NextResponse.json([])
      }

      const [payments, services] = await Promise.all([
        prisma.payment.findMany({
          where: { propertyId: property.id },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        }),
        prisma.monthlyService.findMany({
          where: { propertyId: property.id },
        }),
      ])

      const enriched = payments.map((payment) => {
        const svc = services.find(
          (s) => s.month === payment.month && s.year === payment.year
        )
        const water = svc?.water ?? 0
        const electricity = svc?.electricity ?? 0
        const gas = svc?.gas ?? 0

        return {
          ...payment,
          amountCLP: payment.amountCLP,
          totalCLP: payment.amountCLP + water + electricity + gas,
          water,
          electricity,
          gas,
        }
      })

      return NextResponse.json(enriched)
    }

    const where: any = {
      property: {
        landlordId: session.user.id,
      },
    }

    if (propertyId) where.propertyId = propertyId
    if (status) where.status = status
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)

    const payments = await prisma.payment.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            tenant: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}

// POST — crear pago
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
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.create({
      data,
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Error al crear pago' },
      { status: 500 }
    )
  }
}
