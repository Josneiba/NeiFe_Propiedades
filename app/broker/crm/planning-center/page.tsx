import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PlanningCenter } from '@/components/broker/crm/planning-center'

export const metadata = {
  title: 'Centro de Planificación Comercial | NeiFe',
  description: 'Gestiona tu pipeline, estrategias y KPIs comerciales',
}

export default async function PlanningCenterPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0F1818] p-4 md:p-6">
      <div className="mx-auto max-w-[1400px]">
        <PlanningCenter />
      </div>
    </div>
  )
}
