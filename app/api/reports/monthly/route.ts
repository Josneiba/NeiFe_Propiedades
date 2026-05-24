import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { differenceInDays } from 'date-fns'
import { generateMonthlyReportPDF, MonthlyReportData } from '@/lib/pdf/monthly-report-template'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseMonthYear(monthParam: string | null, yearParam: string | null) {
  const now = new Date()
  const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

  const month = monthParam ? Number(monthParam) : previousMonth
  const year = yearParam ? Number(yearParam) : previousYear

  if (Number.isNaN(month) || month < 1 || month > 12) {
    return { month: previousMonth, year: previousYear }
  }

  if (Number.isNaN(year) || year < 2000) {
    return { month: previousMonth, year: previousYear }
  }

  return { month, year }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!['LANDLORD', 'OWNER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const monthParam = req.nextUrl.searchParams.get('month')
  const yearParam = req.nextUrl.searchParams.get('year')
  const { month, year } = parseMonthYear(monthParam, yearParam)
  const today = new Date()
  const maxExpiry = new Date(today)
  maxExpiry.setDate(today.getDate() + 60)

  const properties = await prisma.property.findMany({
    where: { landlordId: session.user.id, isActive: true },
    include: {
      tenant: { select: { name: true } },
      payments: {
        where: { month, year },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const activeMaintenance = await prisma.maintenanceRequest.findMany({
    where: {
      property: { landlordId: session.user.id },
      status: {
        in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
      },
    },
    include: {
      property: { select: { address: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const expiringContracts = await prisma.property.findMany({
    where: {
      landlordId: session.user.id,
      isActive: true,
      contractEnd: {
        not: null,
        gte: today,
        lte: maxExpiry,
      },
    },
    select: {
      address: true,
      commune: true,
      tenant: { select: { name: true } },
      contractEnd: true,
    },
    orderBy: { contractEnd: 'asc' },
  })

  const summary = {
    totalCollectedCLP: properties.reduce(
      (sum, property) => sum + (property.payments[0]?.status === 'PAID' ? property.payments[0]?.amountCLP || 0 : 0),
      0,
    ),
    totalProperties: properties.length,
    rentedProperties: properties.filter((property) => property.tenant != null).length,
    occupancyRate:
      properties.length > 0
        ? Math.round((properties.filter((property) => property.tenant != null).length / properties.length) * 100)
        : 0,
    collectionRate:
      properties.filter((property) => property.tenant != null).length > 0
        ? Math.round(
            (properties.filter(
              (property) => property.tenant != null && property.payments[0]?.status === 'PAID',
            ).length /
              properties.filter((property) => property.tenant != null).length) *
              100,
          )
        : 0,
  }

  const reportData: MonthlyReportData = {
    landlordName: session.user.name || session.user.email || 'Landlord',
    month,
    year,
    generatedAt: new Date(),
    summary,
    properties: properties.map((property) => {
      const payment = property.payments[0]
      const hasTenant = !!property.tenant
      return {
        address: property.address,
        commune: property.commune,
        tenantName: property.tenant?.name ?? null,
        amountCLP: property.monthlyRentCLP || 0,
        paymentStatus: hasTenant
          ? payment?.status === 'PAID'
            ? 'PAID'
            : payment?.status === 'OVERDUE'
            ? 'OVERDUE'
            : 'PENDING'
          : 'NO_TENANT',
        contractEndDate: property.contractEnd ?? null,
        daysUntilExpiry: property.contractEnd ? differenceInDays(property.contractEnd, today) : null,
      }
    }),
    activeMaintenance: activeMaintenance.map((maintenance) => ({
      propertyAddress: maintenance.property.address,
      description: maintenance.description,
      status: maintenance.status,
      category: maintenance.category,
    })),
    expiringContracts: expiringContracts.map((property) => ({
      propertyAddress: `${property.address} · ${property.commune}`,
      daysUntilExpiry: property.contractEnd ? differenceInDays(property.contractEnd, today) : 0,
      tenantName: property.tenant?.name ?? null,
    })),
    projectedNextMonthCLP: properties.reduce(
      (sum, property) =>
        property.tenant && property.monthlyRentCLP ? sum + property.monthlyRentCLP : sum,
      0,
    ),
  }

  const pdfBuffer = await generateMonthlyReportPDF(reportData)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="neife-resumen-${year}-${month}.pdf"`,
    },
  })
}
