'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Users,
  Building2,
  MessageSquareText,
  FileStack,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { IndicatorsList } from '@/components/broker/goals/indicators-list'
import { WeeklyPlanCard } from '@/components/broker/crm/weekly-plan-card'

type TabKey = 'clientes' | 'buscar' | 'indicadores'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'clientes', label: 'Clientes' },
  { key: 'buscar', label: 'Buscar Clientes' },
  { key: 'indicadores', label: 'Indicadores' },
]

interface Segment {
  id: string
  title: string
  href: string
  total: number
  withOpenTask: number
}

const PROSPECTING_TOOLS = [
  { title: 'Nuevo contacto', href: '/broker/crm/workspace?new=1', icon: Users, color: 'text-[#7FB8B9]' },
  { title: 'Publicar propiedad', href: '/broker/propiedades/nueva', icon: Building2, color: 'text-[#E8A5A0]' },
  { title: 'Enviar mensaje', href: '/broker/avisos', icon: MessageSquareText, color: 'text-[#E8A559]' },
  { title: 'Plantillas', href: '/broker/crm/plantillas', icon: FileStack, color: 'text-[#7FB8B9]' },
  { title: 'Referidos', href: '/broker/crm/contactos?source=REFERIDO', icon: Sparkles, color: 'text-[#E8A5A0]' },
  { title: 'Analíticas', href: '/broker/crm/analytics', icon: BarChart3, color: 'text-[#8FBF8A]' },
]

interface PlanningWeekViewProps {
  initialTab?: TabKey
  initialPlanText: string | null
  initialWorkDays?: Record<string, string>
  initialDailyCommitments?: Record<string, string>
}

export function PlanningWeekView({
  initialTab = 'clientes',
  initialPlanText,
  initialWorkDays,
  initialDailyCommitments,
}: PlanningWeekViewProps) {
  const [tab, setTab] = useState<TabKey>(initialTab)
  const [segments, setSegments] = useState<Segment[]>([])
  const [loadingSegments, setLoadingSegments] = useState(true)

  useEffect(() => {
    async function loadSegments() {
      setLoadingSegments(true)
      try {
        const res = await fetch('/api/broker/crm/segments')
        if (res.ok) {
          const json = await res.json()
          setSegments(Array.isArray(json.segments) ? json.segments : [])
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingSegments(false)
      }
    }
    if (tab === 'clientes') {
      void loadSegments()
    }
  }, [tab])

  async function handleSavePlan(payload: {
    planText: string | null
    workDays: Record<string, string>
    dailyCommitments: Record<string, string>
  }) {
    await fetch('/api/broker/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 lg:px-6">
        <div>
          <Link
            href="/broker/crm/mi-dia"
            className="flex items-center gap-1.5 text-sm text-[#9C8578] hover:text-[#FAF6F2]"
          >
            <ChevronLeft className="h-4 w-4" /> Volver a Mi Día
          </Link>
          <h1 className="mt-3 text-2xl font-bold">Planificación semanal</h1>
        </div>

        <div className="flex items-center border-b border-[#2D3C3C]">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 border-b-2 pb-3 text-center text-sm font-medium transition ${
                tab === t.key
                  ? 'border-[#C27F79] text-[#FAF6F2]'
                  : 'border-transparent text-[#9C8578] hover:text-[#D5C3B6]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'clientes' &&
          (loadingSegments ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 rounded-xl bg-[#1E2E2E] animate-pulse" />
              ))}
            </div>
          ) : (
            <div>
              {segments.map((segment) => (
                <Link
                  key={segment.id}
                  href={segment.href}
                  className="-mx-2 flex items-center justify-between gap-4 rounded-lg border-b border-[#2D3C3C] px-2 py-4 transition hover:bg-[#152022]/60"
                >
                  <div>
                    <p className="text-[15px] text-[#FAF6F2]">{segment.title}</p>
                    <p className="mt-0.5 text-xs text-[#9C8578]">
                      {segment.total === 0
                        ? 'Sin contactos'
                        : `${segment.withOpenTask} de ${segment.total} con seguimiento activo`}
                    </p>
                  </div>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-[#9C8578]" />
                </Link>
              ))}
            </div>
          ))}

        {tab === 'buscar' && (
          <div className="grid grid-cols-4 gap-x-3 gap-y-6">
            {PROSPECTING_TOOLS.map(({ title, href, icon: Icon, color }) => (
              <Link key={title} href={href} className="group flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2D3C3C]/80 transition group-hover:border-[#5E8B8C]/60">
                  <Icon className={`h-6 w-6 ${color}`} strokeWidth={1.75} />
                </div>
                <p className="line-clamp-2 text-[11px] font-medium leading-tight text-[#FAF6F2]">{title}</p>
              </Link>
            ))}
          </div>
        )}

        {tab === 'indicadores' && <IndicatorsList />}

        <div className="pt-2">
          <WeeklyPlanCard
            initialPlanText={initialPlanText}
            initialWorkDays={initialWorkDays}
            initialDailyCommitments={initialDailyCommitments}
            onSave={handleSavePlan}
          />
        </div>
      </div>
    </div>
  )
}
