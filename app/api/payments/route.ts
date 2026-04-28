import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity, logUnauthorizedAccess } from '@/lib/activity'
import { buildServiceChargeItems, getServiceChargesTotal } from '@/lib/service-charges'
import { z } from 'zod'

const createSchema = z.object({
  propertyId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  amountUF: z.number(),
  amountCLP: z.number().positive(),
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

    if (session.user.role === 'BROKER' && !isTenantRequest) {
      logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
      return NextResponse.json(
        { error: 'Los corredores no acceden al módulo de pagos del arrendador' },
        { status: 403 }
      )
    }

    // Tenant: devolver pagos de su propiedad con cargos de servicios y garantía
    if (isTenantRequest) {
      const property = await prisma.property.findFirst({
        where: { tenantId: session.user.id },
        select: {
          id: true,
          monthlyRentCLP: true,
          securityDeposit: {
            select: {
              amountCLP: true,
              status: true,
              receivedAt: true,
              returnedAt: true,
              returnedAmountCLP: true,
              deductionsCLP: true,
              deductionNotes: true,
            },
          },
        },
      })

      if (!property) {
        return NextResponse.json({ payments: [], summary: null, securityDeposit: null })
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
        const serviceItems = buildServiceChargeItems(svc)
        const serviceTotalCLP = getServiceChargesTotal(svc)
        const water = svc?.water ?? 0
        const electricity = svc?.electricity ?? 0
        const gas = svc?.gas ?? 0

        return {
          ...payment,
          amountCLP: payment.amountCLP,
          serviceItems,
          serviceTotalCLP,
          totalCLP: payment.amountCLP + serviceTotalCLP,
          water,
          electricity,
          gas,
          garbage: svc?.garbage ?? 0,
          commonExpenses: svc?.commonExpenses ?? 0,
          other: svc?.other ?? 0,
          otherLabel: svc?.otherLabel ?? null,
        }
      })

      const payableStatuses = new Set(['PENDING', 'OVERDUE'])
      const processingStatuses = new Set(['PROCESSING'])
      const payablePayments = enriched.filter((payment) =>
        payableStatuses.has(payment.status)
      )
      const processingPayments = enriched.filter((payment) =>
        processingStatuses.has(payment.status)
      )
      const nextPayment = payablePayments[0] ?? null

      const summary = {
        currentMonthDueCLP: nextPayment?.totalCLP ?? 0,
        currentMonthLabel: nextPayment
          ? `${nextPayment.month}/${nextPayment.year}`
          : null,
        totalOutstandingCLP: payablePayments.reduce(
          (sum, payment) => sum + payment.totalCLP,
          0
        ),
        overdueBalanceCLP: enriched
          .filter((payment) => payment.status === 'OVERDUE')
          .reduce((sum, payment) => sum + payment.totalCLP, 0),
        paymentsPendingCount: payablePayments.length,
        paymentsProcessingCount: processingPayments.length,
      }

      return NextResponse.json({
        payments: enriched,
        summary,
        securityDeposit: property.securityDeposit,
      })
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

  if (session.user.role === 'TENANT') {
    logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        OR: [
          { landlordId: session.user.id },
          {
            mandates: {
              some: {
                brokerId: session.user.id,
                status: 'ACTIVE',
              },
            },
          },
        ],
      },
      select: { id: true },
    })

    if (!property) {
      logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
      return NextResponse.json(
        { error: 'Sin acceso a esta propiedad' },
        { status: 403 }
      )
    }

    const payment = await prisma.payment.create({
      data,
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return specific error messages for each field
      const firstError = error.errors[0]
      if (firstError.path.includes('amountCLP')) {
        return NextResponse.json({ error: "El monto debe ser un número positivo" }, { status: 400 })
      }
      if (firstError.path.includes('month')) {
        return NextResponse.json({ error: "El mes debe estar entre 1 y 12" }, { status: 400 })
      }
      if (firstError.path.includes('year')) {
        return NextResponse.json({ error: "El año debe estar entre 2020 y 2030" }, { status: 400 })
      }
      const messages = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      return NextResponse.json({ error: messages }, { status: 400 })
    }
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Error al crear pago' },
      { status: 500 }
    )
  }
}
