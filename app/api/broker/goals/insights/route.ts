import { auth } from '@/lib/auth-session'
import { NextResponse } from 'next/server'
import { getBrokerGoalInsights, getBrokerGoals, getCurrentMonth, getCurrentWeekNumber, getCurrentYear } from '@/lib/goal-engine'
import type { GoalMetric } from '@prisma/client'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const now = new Date()
  const week = getCurrentWeekNumber(now)
  const month = getCurrentMonth(now)
  const year = getCurrentYear(now)
  const goals = await getBrokerGoals(brokerId)
  const activeGoals = goals.filter((goal) => {
    if (goal.year !== year) return false
    if (goal.period === 'DAILY') return true
    if (goal.period === 'WEEKLY') return goal.week === week
    if (goal.period === 'MONTHLY') return goal.month === month
    return false
  })
  const targets = activeGoals.reduce<Partial<Record<GoalMetric, number>>>((acc, goal) => {
    acc[goal.metric] = Number(goal.target)
    return acc
  }, {})
  const insights = await getBrokerGoalInsights(brokerId, targets)

  return NextResponse.json({ insights, targets })
}
