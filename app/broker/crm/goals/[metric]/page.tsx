import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { GoalEditPage } from '@/components/broker/goals/goal-edit-page'
import type { GoalMetric, GoalPeriod } from '@prisma/client'

const ALLOWED_METRICS: GoalMetric[] = [
  'CONTACTS',
  'VISITS',
  'DEALS_CLOSED',
  'COMMISSION_CLP',
  'MANDATES',
  'PROPERTIES_PUBLISHED',
]

const ALLOWED_PERIODS: GoalPeriod[] = ['WEEKLY', 'MONTHLY']

function isMetric(value: string): value is GoalMetric {
  return ALLOWED_METRICS.includes(value as GoalMetric)
}

function isPeriod(value: string | undefined): value is GoalPeriod {
  return !!value && ALLOWED_PERIODS.includes(value as GoalPeriod)
}

export default async function GoalMetricPage({
  params,
  searchParams,
}: {
  params: { metric: string } | Promise<{ metric: string }>
  searchParams?: { period?: string } | Promise<{ period?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // `params` / `searchParams` pueden ser una Promise según la versión de Next.js —
  // se esperan de forma segura para funcionar en ambos casos (await sobre algo que
  // no es Promise es un no-op).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedParams = await (params as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedSearchParams = await (searchParams as any)

  const metric = String(resolvedParams?.metric ?? '').toUpperCase()
  if (!isMetric(metric)) {
    notFound()
  }

  const periodParam = String(resolvedSearchParams?.period ?? '').toUpperCase()
  const initialPeriod = isPeriod(periodParam) ? periodParam : undefined

  return <GoalEditPage metric={metric as GoalMetric} initialPeriod={initialPeriod} />
}
