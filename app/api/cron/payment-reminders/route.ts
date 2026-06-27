import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildWhatsAppUrl } from '@/lib/template-engine'
import { processPendingWhatsAppMessages } from '@/lib/whatsapp-integration'

// Simple cron-protected endpoint. Set CRON_SECRET env var to secure.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret') || url.searchParams.get('cron_secret')
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const msPerDay = 24 * 60 * 60 * 1000

    // Fetch pending payments with property + tenant + landlord
    const payments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            tenant: { select: { id: true, name: true, phone: true } },
            landlordId: true,
            agentId: true,
            managedBy: true,
          },
        },
      },
    })

    let sent = 0
    let skipped = 0
    const createdMessages: any[] = []

    for (const p of payments) {
      const property = p.property
      if (!property) { skipped++; continue }

      // landlord preferences
      const prefs = await prisma.notificationPreferences.findUnique({ where: { userId: property.landlordId } })
      const notify = prefs?.notifyPaymentReminder ?? true
      const days = prefs?.paymentReminderDays ?? 5
      if (!notify) { skipped++; continue }

      // compute payment due date (assume due on 1st of month)
      const dueDate = new Date(p.year, p.month - 1, 1)
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay)

      if (diffDays !== days) { skipped++; continue }

      // tenant phone
      const tenant = property.tenant
      if (!tenant || !tenant.phone) { skipped++; continue }

      const amountText = p.amountCLP ? `${p.amountCLP} CLP` : `${p.amountUF} UF`
      const message = `Hola ${tenant.name || ''}. Te recordamos que el pago de arriendo para la propiedad ${property.address} corresponde a ${amountText} para ${p.month}/${p.year}. Por favor realiza el pago antes de la fecha. Si ya pagaste, ignora este mensaje. Gracias.`

      const waUrl = buildWhatsAppUrl(tenant.phone, message)

      // Store a WhatsAppMessage record for processing or sending via external worker
      try {
        const brokerId = property.managedBy || property.agentId || property.landlordId
        const created = await prisma.whatsAppMessage.create({
          data: {
            brokerId,
            phoneNumber: tenant.phone,
            message,
            status: 'PENDING',
          },
        })
        createdMessages.push(created)
        sent++
      } catch (e) {
        console.error('Error creating WhatsAppMessage', e)
        skipped++
        continue
      }

      // Additionally create a Notification for the broker/landlord to show activity in-app
      try {
        await prisma.notification.create({
          data: {
            userId: property.landlordId,
            type: 'PAYMENT_DUE',
            title: 'Recordatorio de pago programado',
            message: `Se ha programado un recordatorio por WhatsApp al inquilino (${tenant.name}) para el pago ${p.month}/${p.year}`,
            link: waUrl,
          },
        })
      } catch (e) {
        console.error('Error creating Notification', e)
      }
    }

    const processed = await processPendingWhatsAppMessages(100)

    return NextResponse.json({ ok: true, sent, skipped, created: createdMessages.length, processed: processed.length })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
