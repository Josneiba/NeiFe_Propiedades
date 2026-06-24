'use client'

import { useEffect, useState, useCallback } from 'react'
import { TaskQueue } from '@/components/broker/crm/task-queue'
import { DailyProgress } from '@/components/broker/crm/daily-progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Calendar, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { TaskSuggestion } from '@/lib/task-engine'

interface DayData {
  manualTasks: any[]
  suggestions: TaskSuggestion[]
  todayActivities: number
  totalDeals: number
}

export default function MiDiaPage() {
  const [data, setData] = useState<DayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)

  const load = useCallback(async () => {
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

  useEffect(() => {
    load()
  }, [load])

  async function handleComplete(dealId: string, taskType: string) {
    await fetch(`/api/crm/tasks/auto/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, taskType }),
    })
    await load()
  }

  const urgent = data?.suggestions.filter((s) => s.urgencyScore >= 70) ?? []
  const normal = data?.suggestions.filter((s) => s.urgencyScore < 70) ?? []

  return (
    <div className="min-h-screen bg-[#1a2424] text-[#FAF6F2]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#FAF6F2]">Mi Día</h1>
            <p className="text-sm text-[#D5C3B6]/60">
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
            onClick={load}
            disabled={loading}
            className="text-[#D5C3B6]/60 hover:text-[#FAF6F2]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* KPIs */}
        {data && (
          <div className="grid grid-cols-3 gap-3">
            <DailyProgress completed={data.todayActivities} goal={10} />
            <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4 flex flex-col justify-center">
              <span className="text-xs text-[#D5C3B6]/60">Deals activos</span>
              <span className="text-2xl font-bold text-[#FAF6F2]">{data.totalDeals}</span>
            </div>
            <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4 flex flex-col justify-center">
              <span className="text-xs text-[#D5C3B6]/60">Tareas pendientes</span>
              <span className="text-2xl font-bold text-[#C27F79]">{data.suggestions.length}</span>
            </div>
          </div>
        )}

        {/* Urgentes */}
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
              onOpenDeal={setSelectedDealId}
            />
          </section>
        )}

        {/* Pendientes normales */}
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
              onOpenDeal={setSelectedDealId}
            />
          </section>
        )}

        {!loading && data?.suggestions.length === 0 && (
          <div className="text-center py-20 text-[#D5C3B6]/40">
            <TrendingUp className="w-12 h-12 mx-auto mb-3" />
            <p>No hay tareas pendientes. ¡Excelente trabajo!</p>
          </div>
        )}
      </div>
    </div>
  )
}
