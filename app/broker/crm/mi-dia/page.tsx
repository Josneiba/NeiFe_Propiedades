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
import { KpiWeeklyPanel } from '@/components/broker/goals/kpi-weekly-panel'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Calendar, Users, ClipboardList, Building2, Handshake, NotebookPen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FabSpeedDial } from '@/components/broker/crm/fab-speed-dial'
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
  const router = useRouter()

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
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold">Mi Día</h1>
          <p className="mt-0.5 text-xs capitalize text-[#9C8578]">
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="lg:hidden">
            <h1 className="text-2xl font-bold">Mi Día</h1>
            <p className="mt-0.5 text-xs capitalize text-[#9C8578]">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadAll} disabled={loading} className="text-[#9C8578] hover:text-[#FAF6F2]">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <section id="indicadores-clave">
          <KpiWeeklyPanel />
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-5">
            <section id="seguimiento-clientes">
              <div className="mb-2.5 flex items-center justify-between border-b border-[#2D3C3C] pb-2">
                <h2 className="text-base font-semibold text-[#FAF6F2]">Seguimiento de Clientes</h2>
                <Link href="/broker/crm/contactos" className="text-xs text-[#C27F79] hover:underline">Ver todos</Link>
              </div>
              <ContactsWithProgress />
            </section>

            <section>
              <div className="mb-2.5 border-b border-[#2D3C3C] pb-2">
                <h2 className="text-base font-semibold text-[#FAF6F2]">Tareas y Pagos Vencidos</h2>
              </div>
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
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Urgente ({urgent.length})</p>
            </div>
            <TaskQueue suggestions={urgent} onComplete={handleComplete} onOpenDeal={handleOpenDeal} />
          </section>
        )}

        {normal.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#5E8B8C]" />
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

      <FabSpeedDial
        actions={[
          { key: 'contact', label: 'Nuevo contacto', icon: Users, onClick: () => router.push('/broker/crm/contactos?new=1'), colorClass: 'bg-[#5E8B8C]' },
          { key: 'task', label: 'Nueva tarea', icon: ClipboardList, onClick: () => router.push('/broker/crm/mi-dia?newTask=1'), colorClass: 'bg-[#C27F79]' },
          { key: 'deal', label: 'Nuevo lead', icon: Handshake, onClick: () => router.push('/broker/crm/workspace?new=1'), colorClass: 'bg-[#E8A559]' },
          { key: 'property', label: 'Nueva propiedad', icon: Building2, onClick: () => router.push('/broker/propiedades/nueva'), colorClass: 'bg-[#7FB8B9]' },
          { key: 'note', label: 'Nota rápida', icon: NotebookPen, onClick: () => router.push('/broker/crm/workspace?quickNote=1'), colorClass: 'bg-[#8FBF8A]' },
        ]}
      />
    </div>
  )
}
