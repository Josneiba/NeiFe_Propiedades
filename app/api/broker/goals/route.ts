import { auth } from '@/lib/auth-session'
import { NextResponse } from 'next/server'
import { getBrokerGoals, getBrokerGoalProgress, getBrokerGoalHistory, getBrokerWeekPlan, upsertBrokerWeekPlan } from '@/lib/goal-engine'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const [goals, progress, weekPlan, history] = await Promise.all([
    getBrokerGoals(brokerId),
    getBrokerGoalProgress(brokerId),
    getBrokerWeekPlan(brokerId),
    getBrokerGoalHistory(brokerId),
  ])

  return NextResponse.json({ goals, progress, weekPlan, history })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { planText, workDays, dailyCommitments } = body

  const weekPlan = await upsertBrokerWeekPlan(session.user.id, {
    planText: typeof planText === 'string' ? planText : null,
    workDays: typeof workDays === 'object' && workDays !== null ? workDays : {},
    dailyCommitments: typeof dailyCommitments === 'object' && dailyCommitments !== null ? dailyCommitments : {},
  })

  return NextResponse.json(weekPlan, { status: 201 })
}
