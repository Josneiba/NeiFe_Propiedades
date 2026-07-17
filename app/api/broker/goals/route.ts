import { auth } from '@/lib/auth-session'
import { NextResponse } from 'next/server'
import { getBrokerGoals, getBrokerGoalProgress, getBrokerGoalHistory, getBrokerWeekPlan, upsertBrokerWeekPlan } from '@/lib/goal-engine'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const week = Number(searchParams.get('week'))
  const year = Number(searchParams.get('year'))
  const month = Number(searchParams.get('month'))
  const monthYear = Number(searchParams.get('monthYear'))

  const brokerId = session.user.id

  try {
    const [goals, progress, weekPlan, history] = await Promise.all([
      getBrokerGoals(brokerId),
      getBrokerGoalProgress(brokerId, {
        week: Number.isNaN(week) ? undefined : week,
        year: Number.isNaN(year) ? undefined : year,
        month: Number.isNaN(month) ? undefined : month,
        monthYear: Number.isNaN(monthYear) ? undefined : monthYear,
      }),
      getBrokerWeekPlan(brokerId),
      getBrokerGoalHistory(brokerId),
    ])

    return NextResponse.json({ goals, progress, weekPlan, history })
  } catch (error) {
    console.error('Goals API error:', error)
    return NextResponse.json({ goals: [], progress: [], weekPlan: null, history: null })
  }
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
