import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { getCronSecretConfigError, hasSafeCronSecret } from '@/lib/cron-secret'
import { getResendFrom } from '@/lib/resend-from'
import { buildBrandedEmailHtml, escapeHtml } from '@/lib/email-composer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

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

  if (!resend) {
    return NextResponse.json({ skipped: 'No RESEND_API_KEY configured' })
  }

  const now = new Date()
  const reportMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const reportYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || req.nextUrl.origin

  const landlords = await prisma.user.findMany({
    where: {
      role: { in: ['LANDLORD', 'OWNER'] },
      isActive: true,
      emailVerified: { not: null },
      ownedProperties: { some: { isActive: true } },
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
          tenant: { select: { name: true } },
          payments: {
            where: { month: reportMonth, year: reportYear },
            select: { status: true, amountCLP: true, paidAt: true },
          },
          maintenance: {
            where: { status: { in: ['REQUESTED', 'REVIEWING', 'IN_PROGRESS'] } },
            select: { id: true },
          },
        },
      },
    },
  })

  let emailsSent = 0

  for (const landlord of landlords) {
    const props = landlord.ownedProperties
    if (props.length === 0) continue

    const paidCount = props.filter((p) => p.payments[0]?.status === 'PAID').length
    const overdueCount = props.filter((p) => p.payments[0]?.status === 'OVERDUE').length
    const totalMaintenance = props.reduce((sum, p) => sum + p.maintenance.length, 0)
    const propertyRows = props
      .map((p) => {
        const payment = p.payments[0]
        const statusLabel = !payment
          ? 'Sin registrar'
          : payment.status === 'PAID'
            ? 'Pagado'
            : payment.status === 'OVERDUE'
              ? 'Atrasado'
              : 'Pendiente'
        const statusColor = !payment
          ? '#9C8578'
          : payment.status === 'PAID'
            ? '#5E8B8C'
            : payment.status === 'OVERDUE'
              ? '#C27F79'
              : '#F2C94C'

        return `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid rgba(213,195,182,0.16);color:#1C1917;font-size:14px;">${p.address}</td>
            <td style="padding:10px 14px;border-bottom:1px solid rgba(213,195,182,0.16);color:#5A5048;font-size:14px;">${p.tenant?.name || 'Sin arrendatario'}</td>
            <td style="padding:10px 14px;border-bottom:1px solid rgba(213,195,182,0.16);color:#3C3530;font-size:14px;">$${(p.monthlyRentCLP || 0).toLocaleString('es-CL')}</td>
            <td style="padding:10px 14px;border-bottom:1px solid rgba(213,195,182,0.16);color:${statusColor};font-size:14px;font-weight:600;">${statusLabel}</td>
          </tr>
        `
      })
      .join('')

    try {
      const summaryTable = `
        <div style="overflow:hidden;border:1px solid rgba(213,195,182,0.18);border-radius:18px;background:#F8F2EC;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr style="background:#EFE8E1;">
              <th style="text-align:left;padding:12px 14px;color:#9C8578;font-size:11px;font-weight:600;text-transform:uppercase;">Propiedad</th>
              <th style="text-align:left;padding:12px 14px;color:#9C8578;font-size:11px;font-weight:600;text-transform:uppercase;">Arrendatario</th>
              <th style="text-align:left;padding:12px 14px;color:#9C8578;font-size:11px;font-weight:600;text-transform:uppercase;">Renta</th>
              <th style="text-align:left;padding:12px 14px;color:#9C8578;font-size:11px;font-weight:600;text-transform:uppercase;">Estado</th>
            </tr>
            ${propertyRows}
          </table>
        </div>
      `

      const result = await resend.emails.send({
        from: getResendFrom(),
        to: landlord.email,
        subject: `Resumen ${monthNames[reportMonth]} ${reportYear} — NeiFe`,
        html: buildBrandedEmailHtml({
          preview: `Resumen mensual de ${monthNames[reportMonth]} ${reportYear}`,
          title: `Resumen de ${monthNames[reportMonth]} ${reportYear}`,
          greeting: `Hola ${escapeHtml((landlord.name || 'arrendador').split(' ')[0])},`,
          intro: [
            'Aquí tienes un resumen ejecutivo del último mes para que revises rápidamente el estado de tu cartera.',
          ],
          infoRows: [
            { label: 'Propiedades activas', value: String(props.length) },
            { label: 'Pagos registrados', value: String(paidCount) },
            { label: 'Pagos atrasados', value: String(overdueCount) },
            { label: 'Mantenciones abiertas', value: String(totalMaintenance) },
          ],
          customContent: summaryTable,
          cta: {
            label: 'Ver dashboard completo',
            url: `${baseUrl}/dashboard`,
          },
          closing: [
            'Si quieres revisar cada propiedad en detalle, entra a tu panel y verás pagos, mantenciones y contratos en un solo lugar.',
          ],
        }),
      })

      if (!result.error) {
        emailsSent++
      } else {
        console.error(`Error sending summary to ${landlord.email}:`, result.error)
      }
    } catch (error) {
      console.error(`Error sending summary to ${landlord.email}:`, error)
    }
  }

  return NextResponse.json({ success: true, emailsSent })
}
