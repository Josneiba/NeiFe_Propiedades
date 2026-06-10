// app/api/cron/crm-scoring/route.ts
import { prisma } from '@/lib/prisma'
import { recalculateAllScores } from '@/lib/crm-scoring'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Verify CRON_SECRET header
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active brokers
    const brokers = await prisma.user.findMany({
      where: { role: 'BROKER', isActive: true },
      select: { id: true },
    })

    let processed = 0
    const errors = []

    // Recalculate scores for each broker
    for (const broker of brokers) {
      try {
        await recalculateAllScores(broker.id)
        processed++
      } catch (error) {
        errors.push({ brokerId: broker.id, error: String(error) })
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in CRM scoring cron:', error)
    return NextResponse.json(
      { error: 'Error procesando scoring de CRM' },
      { status: 500 }
    )
  }
}
