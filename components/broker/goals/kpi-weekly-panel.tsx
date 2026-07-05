'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Phone, Home, Handshake, DollarSign, FileText, Megaphone, BarChart3 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const METRIC_ICONS: Record<string, JSX.Element> = {
  CONTACTS: <Phone />,
  VISITS: <Home />,
  DEALS_CLOSED: <Handshake />,
  COMMISSION_CLP: <DollarSign />,
  MANDATES: <FileText />,
  PROPERTIES_PUBLISHED: <Megaphone />,
}

const CORE_METRICS = [
  'CONTACTS',
  'VISITS',
  'PROPERTIES_PUBLISHED',
  'COMMISSION_CLP',
  'MANDATES',
  'DEALS_CLOSED',
] as const

interface WeeklyCompareItem {
  metric: string
  label: string
  currentValue: number
  previousValue: number
  target: number
  previousTarget: number
  progress: number
}

interface WeeklyCompareResponse {
  week: number
  year: number
  weeklyCompare: WeeklyCompareItem[]
}

function metricLabel(metric: string) {
  switch (metric) {
    case 'CONTACTS':
      return 'Nuevos leads'
    case 'VISITS':
      return 'Visitas realizadas'
    case 'PROPERTIES_PUBLISHED':
      return 'Propiedades captadas'
    case 'COMMISSION_CLP':
      return 'Negociaciones activas'
    case 'MANDATES':
      return 'Contratos firmados'
    case 'DEALS_CLOSED':
      return 'Cierres'
    default:
      return metric
  }
}

export function KpiWeeklyPanel() {
  const [data, setData] = useState<WeeklyCompareResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/goals/weekly-compare')
        if (!res.ok) throw new Error()
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])
  // compute items and summaries
  const items = (data?.weeklyCompare ?? []).filter((it) => CORE_METRICS.includes(it.metric as any))
  const itemsByMetric = Object.fromEntries(items.map((it) => [it.metric, it])) as Record<string, WeeklyCompareItem | undefined>
  const totalCurrent = items.reduce((sum, item) => sum + (item.currentValue ?? 0), 0)
  const totalTarget = items.reduce((sum, item) => sum + (item.target ?? 0), 0)

  const metrics = CORE_METRICS

  return (
    <div className="rounded-3xl border border-[#2D3C3C] bg-[#152022] p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#FAF6F2]">Indicadores Clave</p>
          <p className="text-xs text-[#9C8578]">Seguimiento semanal de las metas del equipo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/broker/crm/goals/new"
            className="inline-flex items-center gap-2 rounded-full border border-[#2D3C3C] bg-[#223333] px-3 py-2 text-sm text-[#FAF6F2] hover:bg-[#2D3C3C]"
          >
            <Plus className="h-4 w-4" />
            Nueva meta
          </Link>
          <Link
            href="/broker/crm/planning-week"
            className="inline-flex items-center rounded-full border border-[#2D3C3C] bg-[#152022] px-3 py-2 text-sm text-[#D5C3B6] hover:bg-[#223333]"
          >
            Planificación semanal
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const item = itemsByMetric[metric] ?? { metric, currentValue: 0, target: 0, progress: 0 }
          return (
            <Link
              key={metric}
              href={`/broker/crm/goals/${metric}`}
              className="group block rounded-3xl border border-[#2D3C3C] bg-[#1E2E2E] p-4 transition hover:border-[#5E8B8C]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f1b1b] text-xl text-[#FAF6F2]">
                    {METRIC_ICONS[metric] ?? <BarChart3 />}
                  </span>
                  <div>
                    <p className="text-sm text-[#9C8578]">{metricLabel(metric)}</p>
                    <p className="mt-2 text-2xl font-semibold text-[#FAF6F2]">{item.currentValue}/{item.target}</p>
                  </div>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">
                  {item.progress}%
                </div>
              </div>
              <div className="mt-4">
                <Progress value={Math.min(100, item.progress)} className="h-2 rounded-full bg-[#152022]" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
