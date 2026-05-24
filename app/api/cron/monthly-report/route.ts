import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getCronSecretConfigError, hasSafeCronSecret } from '@/lib/cron-secret'
import { getResendFrom } from '@/lib/resend-from'
import { buildBrandedEmailHtml } from '@/lib/email-composer'
import { generateMonthlyReportPDF, MonthlyReportData } from '@/lib/pdf/monthly-report-template'
import { differenceInDays } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const MONTH_NAMES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !hasSafeCronSecret()) {
    return NextResponse.json({ error: getCronSecretConfigError() }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!resend) {
    return NextResponse.json({ skipped: 'No RESEND_API_KEY configured' })
  }

  const now = new Date()
  const reportMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const reportYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || req.nextUrl.origin
  const next60Days = new Date(now)
  next60Days.setDate(next60Days.getDate() + 60)

  const landlords = await prisma.user.findMany({
    where: {
      role: { in: ['LANDLORD', 'OWNER'] },
      isActive: true,
      ownedProperties: { some: { isActive: true } },
      emailVerified: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      ownedProperties: {
        where: { isActive: true },
        select: {
          id: true,
          address: true,
          commune: true,
          monthlyRentCLP: true,
          contractEnd: true,
          tenant: { select: { name: true } },
          payments: {
            where: { month: reportMonth, year: reportYear },
            select: { status: true, amountCLP: true },
            take: 1,
          },
          maintenance: {
            where: {
              status: { in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'] },
            },
            select: { description: true, status: true, category: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  let sent = 0
  let errors = 0

  for (const landlord of landlords) {
    try {
      const props = landlord.ownedProperties
      if (props.length === 0 || !landlord.email) {
        continue
      }

      const reportData: MonthlyReportData = {
        landlordName: landlord.name || landlord.email || 'Landlord',
        month: reportMonth,
        year: reportYear,
        generatedAt: new Date(),
        summary: {
          totalCollectedCLP: props.reduce(
            (sum, property) => sum + (property.payments[0]?.status === 'PAID' ? property.payments[0]?.amountCLP || 0 : 0),
            0,
          ),
          occupancyRate:
            props.length > 0
              ? Math.round((props.filter((property) => property.tenant != null).length / props.length) * 100)
              : 0,
          collectionRate:
            props.filter((property) => property.tenant != null).length > 0
              ? Math.round(
                  (props.filter(
                    (property) => property.tenant != null && property.payments[0]?.status === 'PAID',
                  ).length /
                    props.filter((property) => property.tenant != null).length) *
                    100,
                )
              : 0,
          totalProperties: props.length,
          rentedProperties: props.filter((property) => property.tenant != null).length,
        },
        properties: props.map((property) => {
          const hasTenant = !!property.tenant
          return {
            address: property.address,
            commune: property.commune,
            tenantName: property.tenant?.name ?? null,
            amountCLP: property.monthlyRentCLP || 0,
            paymentStatus: hasTenant
              ? property.payments[0]?.status === 'PAID'
                ? 'PAID'
                : property.payments[0]?.status === 'OVERDUE'
                ? 'OVERDUE'
                : 'PENDING'
              : 'NO_TENANT',
            contractEndDate: property.contractEnd ?? null,
            daysUntilExpiry: property.contractEnd ? differenceInDays(property.contractEnd, now) : null,
          }
        }),
        activeMaintenance: props
          .flatMap((property) =>
            property.maintenance.map((maintenance) => ({
              propertyAddress: property.address,
              description: maintenance.description,
              status: maintenance.status,
              category: maintenance.category,
            })),
          )
          .slice(0, 20),
        expiringContracts: props
          .filter(
            (property) =>
              property.contractEnd && property.contractEnd >= now && property.contractEnd <= next60Days,
          )
          .map((property) => ({
            propertyAddress: `${property.address} · ${property.commune}`,
            daysUntilExpiry: property.contractEnd ? differenceInDays(property.contractEnd, now) : 0,
            tenantName: property.tenant?.name ?? null,
          })),
        projectedNextMonthCLP: props.reduce(
          (sum, property) =>
            property.tenant && property.monthlyRentCLP ? sum + property.monthlyRentCLP : sum,
          0,
        ),
      }

      const pdfBuffer = await generateMonthlyReportPDF(reportData)

      const emailHtml = buildBrandedEmailHtml({
        preview: `Tu resumen de ${MONTH_NAMES[reportMonth]} ${reportYear}`,
        title: `Resumen de ${MONTH_NAMES[reportMonth]} ${reportYear}`,
        greeting: `Hola ${landlord.name?.split(' ')[0] || 'arrendador'},`,
        intro: [
          'Adjuntamos tu resumen mensual con los principales indicadores, pagos y contratos próximos a vencer.',
        ],
        infoRows: [
          { label: 'Propiedades activas', value: String(props.length) },
          { label: 'Pagos registrados', value: String(props.filter((property) => property.payments[0]?.status === 'PAID').length) },
          { label: 'Pagos atrasados', value: String(props.filter((property) => property.payments[0]?.status === 'OVERDUE').length) },
          { label: 'Mantenciones abiertas', value: String(props.flatMap((property) => property.maintenance).length) },
        ],
        cta: {
          label: 'Ver dashboard completo',
          url: `${baseUrl}/dashboard`,
        },
        closing: [
          'Si quieres revisar cada propiedad en detalle, ingresa a tu panel de control.',
        ],
      })

      const result = await resend.emails.send({
        from: getResendFrom(),
        to: landlord.email,
        subject: `Tu resumen de ${MONTH_NAMES[reportMonth]} ${reportYear} — NeiFe`,
        html: emailHtml,
        attachments: [
          {
            filename: `neife-resumen-${reportMonth}-${reportYear}.pdf`,
            content: pdfBuffer.toString('base64'),
            contentType: 'application/pdf',
          },
        ],
      })

      if (!('error' in result) || !result.error) {
        sent += 1
      } else {
        errors += 1
        console.error(`Error sending monthly report to ${landlord.email}:`, result.error)
      }
    } catch (error) {
      errors += 1
      console.error('Error processing landlord report:', error)
    }
  }

  return NextResponse.json({ sent, errors })
}
