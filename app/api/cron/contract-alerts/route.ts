import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { getCronSecretConfigError, hasSafeCronSecret } from '@/lib/cron-secret'
import { getResendFrom } from '@/lib/resend-from'
import { buildBrandedEmailHtml, escapeHtml } from '@/lib/email-composer'

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
  return buildBrandedEmailHtml({
    preview: `Contrato próximo a vencer en ${escapeHtml(params.propertyAddress)}`,
    title: 'Contrato próximo a vencer',
    greeting: `Hola ${escapeHtml(params.landlordName)},`,
    intro: [
      'Te avisamos con anticipación para que puedas renovar o coordinar el cierre del contrato a tiempo.',
    ],
    infoRows: [
      { label: 'Propiedad', value: escapeHtml(params.propertyAddress) },
      { label: 'Vence en', value: `${params.daysUntilExpiry} días` },
      { label: 'Fecha de término', value: escapeHtml(params.formattedDate) },
    ],
    cta: {
      label: 'Revisar contrato',
      url: params.dashboardUrl,
    },
    closing: [
      'Si ya estás coordinando la renovación o el cierre, puedes usar este aviso solo como recordatorio.',
    ],
  })
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !hasSafeCronSecret()) {
    return NextResponse.json(
      { error: getCronSecretConfigError() },
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
          subject: `Contrato por vencer en ${daysUntilExpiry} días · NeiFe`,
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
