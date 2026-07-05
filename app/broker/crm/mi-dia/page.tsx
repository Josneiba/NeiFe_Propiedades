'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { TaskQueue } from '@/components/broker/crm/task-queue'
import { DealDrawer } from '@/components/broker/crm/deal-drawer'
import { OpenTasksBadges } from '@/components/broker/crm/open-tasks-badges'
import { ContactsWithProgress } from '@/components/broker/crm/contacts-with-progress'
import { ActionItemsGrid } from '@/components/broker/crm/action-items-grid'
import { ResourcesSection } from '@/components/broker/crm/resources-section'
import { SavedViewsWidget } from '@/components/broker/crm/saved-views-widget'
import { GroupsSection } from '@/components/broker/crm/groups-section'
import { UrgentActionsSection } from '@/components/broker/crm/urgent-actions-section'
import { KpiWeeklyPanel } from '@/components/broker/goals/kpi-weekly-panel'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, AlertTriangle, Calendar, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TaskSuggestion } from '@/lib/task-engine'
import type { DealCardData } from '@/components/broker/crm/kanban-card'

interface DayData {
  suggestions: TaskSuggestion[]
  todayActivities: number
  totalDeals: number
}

export default function MiDiaPage() {
  const [dayData, setDayData] = useState<DayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<DealCardData | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const tasksRes = await fetch('/api/crm/tasks')
      if (tasksRes.ok) {
        setDayData(await tasksRes.json())
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

  async function handleComplete(suggestion: TaskSuggestion) {
    try {
      const type = suggestion.channel === 'WHATSAPP' ? 'WHATSAPP' : suggestion.taskType || 'SEGUIMIENTO'
      await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: suggestion.title,
          description: suggestion.description,
          dealId: suggestion.dealId,
          isDone: true,
        }),
      })
      toast.success('Tarea completada')
      await loadAll()
    } catch (error) {
      console.error('Error completing task suggestion:', error)
      toast.error('Error al completar tarea')
    }
  }

  const urgent = dayData?.suggestions.filter((s) => s.urgencyScore >= 70) ?? []
  const normal = dayData?.suggestions.filter((s) => s.urgencyScore < 70) ?? []

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="mx-auto w-full max-w-7xl p-4 space-y-5 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Mi Día</h1>
            <p className="text-xs text-[#9C8578] mt-0.5 capitalize">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        <UrgentActionsSection />

        <section id="indicadores-clave">
          <KpiWeeklyPanel />
        </section>


        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-5">
            <section id="seguimiento-clientes">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-sm font-semibold text-[#FAF6F2]">Seguimiento de Clientes</p>
                <Link href="/broker/crm/contactos" className="text-xs text-[#C27F79] hover:underline">Ver todos</Link>
              </div>
              <ContactsWithProgress />
            </section>

            <section id="captacion" className="rounded-2xl border border-[#2D3C3C] bg-[#1a2a2a] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#FAF6F2]">Captación</p>
                <Link href="/broker/crm/workspace" className="text-xs text-[#C27F79] hover:underline">Abrir workspace</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#2D3C3C] bg-[#152022] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#9C8578]">Oportunidades</p>
                  <p className="mt-2 text-lg font-semibold text-[#FAF6F2]">Prioriza los próximos avances</p>
                </div>
                <div className="rounded-xl border border-[#2D3C3C] bg-[#152022] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#9C8578]">Seguimiento</p>
                  <p className="mt-2 text-lg font-semibold text-[#FAF6F2]">Mantén el foco semanal limpio</p>
                </div>
              </div>
            </section>

            <section>
              <p className="text-sm font-semibold text-[#FAF6F2] mb-2.5">Tareas y pagos vencidos</p>
              <OpenTasksBadges />
            </section>

            <ActionItemsGrid />
          </div>

          <div className="space-y-5">
            <ResourcesSection />
            <SavedViewsWidget />
            <GroupsSection />
          </div>
        </div>

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
          <div className="rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] py-16 text-center text-[#D5C3B6]/70">
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
