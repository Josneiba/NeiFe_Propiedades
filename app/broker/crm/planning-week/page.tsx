import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getBrokerWeekPlan } from '@/lib/goal-engine'
import { PlanningWeekView } from '@/components/broker/crm/planning-week-view'

const VALID_TABS = ['clientes', 'buscar', 'indicadores'] as const
type TabKey = (typeof VALID_TABS)[number]

function isTabKey(value: string | undefined): value is TabKey {
  return !!value && (VALID_TABS as readonly string[]).includes(value)
}

export default async function PlanningWeekPage({
  searchParams,
}: {
  searchParams?: { tab?: string } | Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedSearchParams = await (searchParams as any)
  const requestedTab = resolvedSearchParams?.tab
  const initialTab: TabKey = isTabKey(requestedTab) ? requestedTab : 'clientes'

  const plan = await getBrokerWeekPlan(session.user.id)

  return (
    <PlanningWeekView
      initialTab={initialTab}
      initialPlanText={plan?.planText ?? null}
      initialWorkDays={(plan?.workDays as Record<string, string> | null) ?? undefined}
      initialDailyCommitments={(plan?.dailyCommitments as Record<string, string> | null) ?? undefined}
    />
  )
}
