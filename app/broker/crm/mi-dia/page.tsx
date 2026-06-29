'use client'

import { useEffect, useState, useCallback } from 'react'
import { TaskQueue } from '@/components/broker/crm/task-queue'
import { DailyProgress } from '@/components/broker/crm/daily-progress'
import { DealDrawer } from '@/components/broker/crm/deal-drawer'
import { GoalDashboard } from '@/components/broker/crm/goal-dashboard'
import { WeeklyPlanCard } from '@/components/broker/crm/weekly-plan-card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Calendar, TrendingUp } from 'lucide-react'
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

export default function MiDiaPage() {
  const [data, setData] = useState<DayData | null>(null)
  const [goalsData, setGoalsData] = useState<GoalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<DealCardData | null>(null)
  const [dailyGoal, setDailyGoal] = useState(10)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/crm/tasks')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error('Error cargando tareas del día')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadGoals = useCallback(async () => {
    setGoalsLoading(true)
    try {
      const res = await fetch('/api/broker/goals')
      if (!res.ok) throw new Error()
      setGoalsData(await res.json())
    } catch {
      toast.error('Error cargando metas y plan semanal')
    } finally {
      setGoalsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    loadGoals()
  }, [loadTasks, loadGoals])

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const res = await fetch('/api/broker/settings')
        if (res.ok) {
          const settings = await res.json()
          setDailyGoal(settings.dailyContactGoal || 10)
        }
      } catch (e) {
        console.error('Error fetching broker settings:', e)
      }
    }
    fetchGoal()
  }, [])

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
      await loadTasks()
      await loadGoals()
    } catch {
      toast.error('Error al completar tarea')
    }
  }

  async function handleOpenDeal(dealId: string) {
    try {
      const res = await fetch(`/api/crm/deals/${dealId}`)
      if (res.ok) {
        setSelectedDeal(await res.json())
      }
    } catch {
      toast.error('Error al cargar deal')
    }
  }

  async function handleSaveWeekPlan(payload: WeekPlanData) {
    try {
      const res = await fetch('/api/broker/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success('Plan semanal actualizado')
      await loadGoals()
    } catch {
      toast.error('Error al guardar el plan semanal')
    }
  }

  const urgent = data?.suggestions.filter((s) => s.urgencyScore >= 70) ?? []
  const normal = data?.suggestions.filter((s) => s.urgencyScore < 70) ?? []

  return (
    <div className="min-h-screen bg-[#1a2424] text-[#FAF6F2]">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#FAF6F2]">Mi Día</h1>
            <p className="text-sm text-[#D5C3B6]/60 mt-1">
              {new Date().toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              loadTasks()
              loadGoals()
            }}
            disabled={loading || goalsLoading}
            className="text-[#D5C3B6]/60 hover:text-[#FAF6F2]"
          >
            <RefreshCw className={`w-4 h-4 ${loading || goalsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <DailyProgress completed={data?.todayActivities ?? 0} goal={dailyGoal} />
          <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4 flex flex-col justify-center">
            <span className="text-xs text-[#D5C3B6]/60">Deals activos</span>
            <span className="text-2xl font-bold text-[#FAF6F2]">{data?.totalDeals ?? 0}</span>
          </div>
          <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4 flex flex-col justify-center">
            <span className="text-xs text-[#D5C3B6]/60">Tareas pendientes</span>
            <span className="text-2xl font-bold text-[#C27F79]">{data?.suggestions.length ?? 0}</span>
          </div>
        </div>

        {goalsLoading && (
          <div className="rounded-3xl border border-[#2D3C3C] bg-[#1a2a2a] p-6 text-[#D5C3B6]">
            Cargando metas y plan semanal...
          </div>
        )}

        {!goalsLoading && goalsData && (
          <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-6">
              <GoalDashboard progress={goalsData.progress} />
            </div>
            <WeeklyPlanCard
              initialPlanText={goalsData.weekPlan?.planText ?? null}
              initialWorkDays={goalsData.weekPlan?.workDays ?? {}}
              initialDailyCommitments={goalsData.weekPlan?.dailyCommitments ?? {}}
              onSave={handleSaveWeekPlan}
            />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            {urgent.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
                    Urgente ({urgent.length})
                  </h2>
                </div>
                <TaskQueue
                  suggestions={urgent}
                  onComplete={handleComplete}
                  onOpenDeal={handleOpenDeal}
                />
              </section>
            )}

            {normal.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#5E8B8C]" />
                  <h2 className="text-sm font-semibold text-[#D5C3B6]/70 uppercase tracking-wide">
                    Pendientes ({normal.length})
                  </h2>
                </div>
                <TaskQueue
                  suggestions={normal}
                  onComplete={handleComplete}
                  onOpenDeal={handleOpenDeal}
                />
              </section>
            )}

            {!loading && data?.suggestions.length === 0 && (
              <div className="text-center py-20 text-[#D5C3B6]/40">
                <TrendingUp className="w-12 h-12 mx-auto mb-3" />
                <p>No hay tareas pendientes. Excelente trabajo!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDeal && (
        <DealDrawer
          deal={selectedDeal}
          open={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdate={loadTasks}
        />
      )}
    </div>
  )
}
