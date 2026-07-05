import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { WeeklyPlanCard } from '@/components/broker/crm/weekly-plan-card'
import { getBrokerWeekPlan } from '@/lib/goal-engine'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function PlanningWeekPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const plan = await getBrokerWeekPlan(session.user.id)

  return (
    <div className="min-h-screen bg-[#0F1818] p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Planificación semanal</p>
            <h1 className="text-2xl font-semibold text-[#FAF6F2]">Organiza clientes, captación y metas para la semana</h1>
          </div>
          <Link href="/broker/crm/mi-dia">
            <Button variant="ghost" className="text-[#D5C3B6] hover:text-[#FAF6F2]">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver a Mi Día
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <WeeklyPlanCard
            initialPlanText={plan?.planText ?? null}
            initialWorkDays={(plan?.workDays as Record<string, string> | null) ?? undefined}
            initialDailyCommitments={(plan?.dailyCommitments as Record<string, string> | null) ?? undefined}
            onSave={async () => {}}
          />

          <div className="rounded-3xl border border-[#2D3C3C] bg-[#1a2a2a] p-4">
            <p className="text-sm font-semibold text-[#FAF6F2]">Herramientas de planificación</p>
            <div className="mt-4 space-y-3 text-sm text-[#9C8578]">
              <div className="rounded-2xl border border-[#2D3C3C] bg-[#152022] p-3">
                <p className="font-semibold text-[#FAF6F2]">Clientes</p>
                <p className="mt-1">Prioriza seguimiento, llamadas y próximos pasos con clientes activos.</p>
              </div>
              <div className="rounded-2xl border border-[#2D3C3C] bg-[#152022] p-3">
                <p className="font-semibold text-[#FAF6F2]">Captación</p>
                <p className="mt-1">Define acciones concretas para nuevos leads, visitas y oportunidades.</p>
              </div>
              <div className="rounded-2xl border border-[#2D3C3C] bg-[#152022] p-3">
                <p className="font-semibold text-[#FAF6F2]">Indicadores clave</p>
                <p className="mt-1">Ajusta el enfoque semanal según metas, avances y compromisos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
