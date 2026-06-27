import { NextResponse } from 'next/server'
import { processPendingWhatsAppMessages } from '@/lib/whatsapp-integration'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret') || url.searchParams.get('cron_secret')
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const results = await processPendingWhatsAppMessages(50)
    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
