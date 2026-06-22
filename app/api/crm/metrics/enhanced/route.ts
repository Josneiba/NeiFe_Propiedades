import { auth } from '@/lib/auth-session'
import { getMetricsOverview } from '@/lib/crm-metrics-enhanced'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await getMetricsOverview(session.user.id)
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
