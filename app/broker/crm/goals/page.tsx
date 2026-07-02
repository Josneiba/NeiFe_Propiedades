'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GoalDashboard } from '@/components/broker/crm/goal-dashboard'
import { WeeklyPlanCard } from '@/components/broker/crm/weekly-plan-card'
import { VerlaufChart } from '@/components/broker/goals/verlauf-chart'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { BrokerGoalProgress } from '@/lib/goal-engine'

const METRIC_LABELS: Record<string, string> = {
  CONTACTS: 'Contactos',
  VISITS: 'Visitas',
  DEALS_CLOSED: 'Cierres',
  COMMISSION_CLP: 'Comisión',
  MANDATES: 'Mandatos',
  PROPERTIES_PUBLISHED: 'Prop. publicadas',
}

export default function GoalsPage() {
  const [progress, setProgress] = useState<BrokerGoalProgress[]>([])
  const [weekPlan, setWeekPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/goals')
        if (res.ok) {
          const d = await res.json()
          setProgress(d.progress ?? [])
          setWeekPlan(d.weekPlan ?? null)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSaveWeekPlan(payload: any) {
    try {
      const res = await fetch('/api/broker/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success('Plan semanal actualizado')
      const updated = await fetch('/api/broker/goals')
      if (updated.ok) {
        const d = await updated.json()
        setWeekPlan(d.weekPlan ?? null)
      }
    } catch {
      toast.error('Error al guardar el plan semanal')
    }
  }

  const weeklyMetrics = progress.filter((g) => g.period === 'WEEKLY')

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/broker/crm/mi-dia">
            <button className="flex items-center gap-1.5 text-xs text-[#9C8578] hover:text-[#FAF6F2] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Mi Día
            </button>
          </Link>
          <h1 className="text-xl font-bold">Metas e Indicadores</h1>
        </div>

        {!loading && progress.length > 0 && <GoalDashboard progress={progress} />}

        {weeklyMetrics.length > 0 && (
          <section className="space-y-3">
            <p className="text-sm font-semibold text-[#FAF6F2]">Historial semanal</p>
            {weeklyMetrics.map((g) => (
              <VerlaufChart key={g.metric} metric={g.metric} metricLabel={METRIC_LABELS[g.metric] ?? g.metric} />
            ))}
          </section>
        )}

        {weekPlan !== null && (
          <WeeklyPlanCard
            initialPlanText={weekPlan?.planText ?? null}
            initialWorkDays={weekPlan?.workDays ?? {}}
            initialDailyCommitments={weekPlan?.dailyCommitments ?? {}}
            onSave={handleSaveWeekPlan}
          />
        )}
      </div>
    </div>
  )
}
