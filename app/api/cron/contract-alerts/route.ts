import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY_IN_MS = 24 * 60 * 60 * 1000
const ALERT_DAY_VALUES = [30, 15, 7] as const
const ALERT_DAY_SET = new Set<number>(ALERT_DAY_VALUES)
const MIN_ALERT_DAY = Math.min(...ALERT_DAY_VALUES)
const MAX_ALERT_DAY = Math.max(...ALERT_DAY_VALUES)

const shortDateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const longDateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function endOfUtcDay(date: Date) {
  return new Date(startOfUtcDay(date).getTime() + DAY_IN_MS - 1)
}

function addUtcDays(date: Date, days: number) {
  const next = startOfUtcDay(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function getUtcCalendarDayDifference(targetDate: Date, fromDate: Date) {
  return Math.round(
    (startOfUtcDay(targetDate).getTime() - startOfUtcDay(fromDate).getTime()) /
      DAY_IN_MS
  )
}

function getDashboardUrl(req: NextRequest, propertyId: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const baseUrl = configuredOrigin || req.nextUrl.origin
  return `${baseUrl}/dashboard/contratos?property=${propertyId}`
}

function getContractAlertEmailHtml(params: {
  landlordName: string
  propertyAddress: string
  daysUntilExpiry: number
  formattedDate: string
  dashboardUrl: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#1C1917;padding:32px;border-radius:12px;">
      <h2 style="color:#FAF6F2;margin:0 0 8px;">Contrato proximo a vencer</h2>
      <p style="color:#9C8578;margin:0 0 24px;">Hola ${params.landlordName}, te avisamos con anticipacion para que puedas renovar o coordinar el cierre del contrato.</p>
      <div style="background:#2D3C3C;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:#FAF6F2;margin:0;font-weight:600;">${params.propertyAddress}</p>
        <p style="color:#9C8578;margin:4px 0 0;font-size:14px;">Vence en ${params.daysUntilExpiry} dias</p>
        <p style="color:#9C8578;margin:4px 0 0;font-size:14px;">Fecha de termino: ${params.formattedDate}</p>
      </div>
      <a href="${params.dashboardUrl}" style="display:inline-block;background:#5E8B8C;color:#FAF6F2;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;">
        Ver contrato
      </a>
      <p style="color:#9C8578;font-size:12px;margin-top:24px;">NeiFe · Gestion de Arriendos</p>
    </div>
  `
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET no está configurado' },
      { status: 500 }
    )
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStart = startOfUtcDay(now)
  const todayEnd = endOfUtcDay(now)
  const rangeStart = addUtcDays(now, MIN_ALERT_DAY)
  const rangeEnd = endOfUtcDay(addUtcDays(now, MAX_ALERT_DAY))

  const expiringProperties = await prisma.property.findMany({
    where: {
      isActive: true,
      tenantId: { not: null },
      contractEnd: {
        not: null,
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    select: {
      id: true,
      address: true,
      contractEnd: true,
      landlordId: true,
      landlord: {
        select: {
          email: true,
          name: true,
          notificationPreferences: {
            select: {
              notifyContractExpiring: true,
            },
          },
        },
      },
    },
  })

  let propertiesMatched = 0
  let notificationsCreated = 0
  let emailsSent = 0
  let skippedExisting = 0
  let skippedDisabled = 0

  for (const property of expiringProperties) {
    if (!property.contractEnd) continue

    const daysUntilExpiry = getUtcCalendarDayDifference(property.contractEnd, now)
    if (!ALERT_DAY_SET.has(daysUntilExpiry)) continue

    propertiesMatched++

    if (property.landlord.notificationPreferences?.notifyContractExpiring === false) {
      skippedDisabled++
      continue
    }

    const title = `Contrato vence en ${daysUntilExpiry} días`
    const formattedShortDate = shortDateFormatter.format(property.contractEnd)
    const formattedLongDate = longDateFormatter.format(property.contractEnd)
    const link = `/dashboard/contratos?property=${property.id}`
    const dashboardUrl = getDashboardUrl(req, property.id)

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: property.landlordId,
        type: 'CONTRACT_EXPIRING',
        title,
        link,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: { id: true },
    })

    if (existingNotification) {
      skippedExisting++
      continue
    }

    await prisma.notification.create({
      data: {
        userId: property.landlordId,
        type: 'CONTRACT_EXPIRING',
        title,
        message: `El contrato de ${property.address} vence el ${formattedShortDate}.`,
        link,
      },
    })

    notificationsCreated++

    if (resend && property.landlord.email) {
      try {
        const result = await resend.emails.send({
          from: getResendFrom(),
          to: property.landlord.email,
          subject: `Tu contrato vence en ${daysUntilExpiry} dias - ${property.address}`,
          html: getContractAlertEmailHtml({
            landlordName: property.landlord.name,
            propertyAddress: property.address,
            daysUntilExpiry,
            formattedDate: formattedLongDate,
            dashboardUrl,
          }),
        })

        if (result.error) {
          console.error('Error sending contract alert email:', result.error)
        } else {
          emailsSent++
        }
      } catch (error) {
        console.error('Error sending contract alert email:', error)
      }
    }
  }

  return NextResponse.json({
    success: true,
    alertDays: ALERT_DAY_VALUES,
    propertiesMatched,
    notificationsCreated,
    emailsSent,
    skippedExisting,
    skippedDisabled,
  })
}
