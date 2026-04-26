import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

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
            <td style="padding:10px 8px;border-bottom:1px solid rgba(213,195,182,0.08);color:#FAF6F2;font-size:14px;">${p.address}</td>
            <td style="padding:10px 8px;border-bottom:1px solid rgba(213,195,182,0.08);color:#9C8578;font-size:14px;">${p.tenant?.name || 'Sin arrendatario'}</td>
            <td style="padding:10px 8px;border-bottom:1px solid rgba(213,195,182,0.08);color:#D5C3B6;font-size:14px;">$${(p.monthlyRentCLP || 0).toLocaleString('es-CL')}</td>
            <td style="padding:10px 8px;border-bottom:1px solid rgba(213,195,182,0.08);color:${statusColor};font-size:14px;">${statusLabel}</td>
          </tr>
        `
      })
      .join('')

    try {
      const result = await resend.emails.send({
        from: getResendFrom(),
        to: landlord.email,
        subject: `Resumen ${monthNames[reportMonth]} ${reportYear} — NeiFe`,
        html: `
          <!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#1C1917;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C1917;padding:32px 16px;">
          <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
            <tr><td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:18px;font-weight:700;color:#D5C3B6;letter-spacing:0.08em;">NeiFe</span>
            </td></tr>
            <tr><td style="background:#2D3C3C;border:1px solid rgba(213,195,182,0.12);border-radius:16px;padding:32px;">
              <h1 style="color:#FAF6F2;margin:0 0 4px;font-size:22px;">Resumen de ${monthNames[reportMonth]}</h1>
              <p style="color:#9C8578;margin:0 0 28px;font-size:14px;">Hola ${landlord.name.split(' ')[0]}, aquí está tu resumen mensual.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="25%" style="text-align:center;background:#1C1917;border-radius:8px;padding:16px 8px;">
                    <div style="font-size:22px;font-weight:700;color:#FAF6F2;">${props.length}</div>
                    <div style="font-size:11px;color:#9C8578;margin-top:4px;">Propiedades</div>
                  </td>
                  <td width="4%"></td>
                  <td width="25%" style="text-align:center;background:#1C1917;border-radius:8px;padding:16px 8px;">
                    <div style="font-size:22px;font-weight:700;color:#5E8B8C;">${paidCount}</div>
                    <div style="font-size:11px;color:#9C8578;margin-top:4px;">Pagados</div>
                  </td>
                  <td width="4%"></td>
                  <td width="25%" style="text-align:center;background:#1C1917;border-radius:8px;padding:16px 8px;">
                    <div style="font-size:22px;font-weight:700;color:#C27F79;">${overdueCount}</div>
                    <div style="font-size:11px;color:#9C8578;margin-top:4px;">Atrasados</div>
                  </td>
                  <td width="4%"></td>
                  <td width="25%" style="text-align:center;background:#1C1917;border-radius:8px;padding:16px 8px;">
                    <div style="font-size:22px;font-weight:700;color:#B8965A;">${totalMaintenance}</div>
                    <div style="font-size:11px;color:#9C8578;margin-top:4px;">Mantenciones</div>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr style="background:#1C1917;">
                  <th style="text-align:left;padding:8px;color:#9C8578;font-size:11px;font-weight:600;text-transform:uppercase;">Propiedad</th>
                  <th style="text-align:left;padding:8px;color:#9C8578;font-size:11px;font-weight:600;text-transform:uppercase;">Arrendatario</th>
                  <th style="text-align:left;padding:8px;color:#9C8578;font-size:11px;font-weight:600;text-transform:uppercase;">Renta</th>
                  <th style="text-align:left;padding:8px;color:#9C8578;font-size:11px;font-weight:600;text-transform:uppercase;">Estado</th>
                </tr>
                ${propertyRows}
              </table>
              <div style="text-align:center;">
                <a href="${baseUrl}/dashboard" style="display:inline-block;background:#5E8B8C;color:#FAF6F2;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                  Ver dashboard completo →
                </a>
              </div>
            </td></tr>
          </table>
          </td></tr>
          </table>
          </body></html>
        `,
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
