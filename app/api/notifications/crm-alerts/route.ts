import { auth } from '@/lib/auth-session'
import { NextResponse } from 'next/server'
import { calcBrokerAlerts } from '@/lib/alert-calculator'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER')
    return NextResponse.json({ totalAlerts: 0, coldDeals: [], overdueTasks: 0, expiringContracts: 0 })

  const alerts = await calcBrokerAlerts(session.user.id)
  return NextResponse.json(alerts)
}
