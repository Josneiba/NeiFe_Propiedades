import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { GoalEditPage } from '@/components/broker/goals/goal-edit-page'
import type { GoalMetric } from '@prisma/client'

const ALLOWED_METRICS: GoalMetric[] = [
  'CONTACTS',
  'VISITS',
  'DEALS_CLOSED',
  'COMMISSION_CLP',
  'MANDATES',
  'PROPERTIES_PUBLISHED',
]

function isMetric(value: string): value is GoalMetric {
  return ALLOWED_METRICS.includes(value as GoalMetric)
}

export default async function GoalMetricPage({ params }: { params: { metric: string } } | { params: Promise<{ metric: string }> }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // `params` may be a Promise in some Next.js configurations — await it to access properties safely
  // Awaiting a non-promise is a no-op, so this works in both cases.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedParams = await (params as any)
  const metric = String(resolvedParams?.metric ?? '').toUpperCase()
  if (!isMetric(metric)) {
    notFound()
  }

  return <GoalEditPage metric={metric as GoalMetric} />
}
