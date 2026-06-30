'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { TaskQueue } from '@/components/broker/crm/task-queue'
import { DailyProgress } from '@/components/broker/crm/daily-progress'
import { DealDrawer } from '@/components/broker/crm/deal-drawer'
import { GoalDashboard } from '@/components/broker/crm/goal-dashboard'
import { WeeklyPlanCard } from '@/components/broker/crm/weekly-plan-card'
import { OpenTasksBadges } from '@/components/broker/crm/open-tasks-badges'
import { ContactsWithProgress } from '@/components/broker/crm/contacts-with-progress'
import { KpiWeeklyPanel } from '@/components/broker/goals/kpi-weekly-panel'
import { VerlaufChart } from '@/components/broker/goals/verlauf-chart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plus, AlertTriangle, Calendar, Settings2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { TaskSuggestion } from '@/lib/task-engine'
import type { DealCardData } from '@/components/broker/crm/kanban-card'
import type { BrokerGoalProgress } from '@/lib/goal-engine'

interface DayData {
  manualTasks: any[]
  suggestions: TaskSuggestion[]
  todayActivities: number
  totalDeals: number
}

interface WeekPlanData {
  planText?: string | null
  workDays?: Record<string, string>
  dailyCommitments?: Record<string, string>
}

interface GoalsData {
  progress: BrokerGoalProgress[]
  weekPlan: WeekPlanData | null
}

const METRIC_LABELS: Record<string, string> = {
  CONTACTS: 'Contactos',
  VISITS: 'Visitas',
  DEALS_CLOSED: 'Cierres',
  COMMISSION_CLP: 'Comisión',
  MANDATES: 'Mandatos',
  PROPERTIES_PUBLISHED: 'Prop. publicadas',
}

export default function MiDiaPage() {
  const [dayData, setDayData] = useState<DayData | null>(null)
  const [goalsData, setGoalsData] = useState<GoalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<DealCardData | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, goalsRes] = await Promise.all([
        fetch('/api/crm/tasks'),
        fetch('/api/broker/goals'),
      ])

      if (tasksRes.ok) {
        setDayData(await tasksRes.json())
      }

      if (goalsRes.ok) {
        const goalsJson = await goalsRes.json()
        setGoalsData({ progress: goalsJson.progress ?? [], weekPlan: goalsJson.weekPlan ?? null })
      }
    } catch (error) {
      console.error(error)
      toast.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  async function handleOpenDeal(dealId: string) {
    try {
      const res = await fetch(`/api/crm/deals/${dealId}`)
      if (res.ok) {
        setSelectedDeal(await res.json())
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar deal')
    }
  }

  async function handleComplete(dealId: string, taskType: string) {
    try {
      await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType === 'SEGUIMIENTO' ? 'NOTA' : taskType,
          title: 'Tarea completada desde Mi Día',
          dealId,
          isDone: true,
        }),
      })
      toast.success('Tarea completada')
      await loadAll()
    } catch {
      toast.error('Error al completar tarea')
    }
  }

  const urgent = dayData?.suggestions.filter((s) => s.urgencyScore >= 70) ?? []
  const normal = dayData?.suggestions.filter((s) => s.urgencyScore < 70) ?? []
  const weeklyMetrics = goalsData?.progress.filter((g) => g.period === 'WEEKLY') ?? []

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Mi Día</h1>
            <p className="text-xs text-[#9C8578] mt-0.5 capitalize">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/broker/crm/goals">
              <Button variant="ghost" size="sm" className="text-[#9C8578] hover:text-[#FAF6F2] gap-1.5">
                <Settings2 className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Metas</span>
              </Button>
            </Link>
            <Link href="/broker/crm/workspace">
              <Button size="sm" className="bg-[#C27F79] hover:bg-[#C27F79]/80 text-white rounded-full h-9 w-9 p-0 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={loadAll} disabled={loading} className="text-[#9C8578] hover:text-[#FAF6F2]">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-semibold text-[#FAF6F2]">Indicadores semanales</p>
            <Link href="/broker/crm/goals" className="text-xs text-[#C27F79] hover:underline">Ver todos</Link>
          </div>
          <KpiWeeklyPanel />
        </section>

        <section className="space-y-4">
          {weeklyMetrics.map((metric) => (
            <VerlaufChart key={metric.metric} metric={metric.metric} metricLabel={METRIC_LABELS[metric.metric] ?? metric.metric} />
          ))}
        </section>

        <Link
          href="/broker/crm/goals"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] py-3 text-sm font-medium text-[#D5C3B6] transition hover:border-[#5E8B8C]/50 hover:bg-[#1b2f2d] hover:text-[#FAF6F2]"
        >
          <Calendar className="w-4 h-4 text-[#5E8B8C]" />
          Planificación semanal
        </Link>

        <section>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-semibold text-[#FAF6F2]">Contactos con progreso</p>
            <Link href="/broker/crm/contactos" className="text-xs text-[#C27F79] hover:underline">Ver todos</Link>
          </div>
          <ContactsWithProgress />
        </section>

        <section>
          <p className="text-sm font-semibold text-[#FAF6F2] mb-2.5">Vencimientos abiertos</p>
          <OpenTasksBadges />
        </section>

        {urgent.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Urgente ({urgent.length})</p>
            </div>
            <TaskQueue suggestions={urgent} onComplete={handleComplete} onOpenDeal={handleOpenDeal} />
          </section>
        )}

        {normal.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#5E8B8C]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9C8578]">Pendientes ({normal.length})</p>
            </div>
            <TaskQueue suggestions={normal} onComplete={handleComplete} onOpenDeal={handleOpenDeal} />
          </section>
        )}

        {!loading && dayData?.suggestions.length === 0 && (
          <div className="rounded-3xl border border-[#2D3C3C] bg-[#1a2a2a] py-16 text-center text-[#D5C3B6]/70">
            <p>No hay tareas pendientes. Excelente trabajo!</p>
          </div>
        )}
      </div>

      {selectedDeal && (
        <DealDrawer deal={selectedDeal} open={!!selectedDeal} onClose={() => setSelectedDeal(null)} onUpdate={loadAll} />
      )}
    </div>
  )
}
