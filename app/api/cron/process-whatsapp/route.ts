import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret') || url.searchParams.get('cron_secret')
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const pending = await prisma.whatsAppMessage.findMany({
      where: { status: 'PENDING' },
      take: 50,
    })

    const results: Array<{ id: string; status: string; error?: string }> = []

    for (const msg of pending) {
      try {
        // If an external WhatsApp API is configured, call it
        if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) {
          const res = await fetch(process.env.WHATSAPP_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            },
            body: JSON.stringify({ to: msg.phoneNumber, message: msg.message }),
          })

          if (!res.ok) {
            const text = await res.text()
            await prisma.whatsAppMessage.update({ where: { id: msg.id }, data: { status: 'FAILED', messageId: null } })
            results.push({ id: msg.id, status: 'FAILED', error: `remote=${res.status}` })
            continue
          }

          const payload = await res.json()
          const messageId = payload?.id || payload?.messageId || null
          await prisma.whatsAppMessage.update({ where: { id: msg.id }, data: { status: 'SENT', messageId } })
          results.push({ id: msg.id, status: 'SENT' })
        } else {
          // Local mode: mark as SENT with local id
          await prisma.whatsAppMessage.update({ where: { id: msg.id }, data: { status: 'SENT', messageId: `LOCAL-${msg.id}` } })
          results.push({ id: msg.id, status: 'SENT' })
        }
      } catch (e: any) {
        console.error('Error processing WhatsApp message', msg.id, e)
        await prisma.whatsAppMessage.update({ where: { id: msg.id }, data: { status: 'FAILED' } })
        results.push({ id: msg.id, status: 'FAILED', error: String(e?.message ?? e) })
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
