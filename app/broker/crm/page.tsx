// app/broker/crm/page.tsx — Redirect to Planning Week
import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'

export default async function CrmDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Redirect to the new Planning Week page with Indicadores tab
  redirect('/broker/crm/planning-week?tab=indicadores')
}

