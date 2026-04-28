import { NextRequest, NextResponse } from 'next/server'
import { generateMonthlyPaymentsForPeriod } from '@/lib/monthly-payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

  try {
    const result = await generateMonthlyPaymentsForPeriod()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error creating monthly payments:', error)
    return NextResponse.json(
      { error: 'Error al crear pagos mensuales' },
      { status: 500 }
    )
  }
}
