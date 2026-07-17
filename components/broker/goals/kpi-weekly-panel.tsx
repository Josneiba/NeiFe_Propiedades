'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, Home, Handshake, DollarSign, FileText, Megaphone, BarChart3 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { getCurrentMonth, getCurrentWeekNumber, getCurrentYear } from '@/lib/goal-engine'

const METRIC_ICONS: Record<string, JSX.Element> = {
  CONTACTS: <Phone className="h-4 w-4" />,
  VISITS: <Home className="h-4 w-4" />,
  DEALS_CLOSED: <Handshake className="h-4 w-4" />,
  COMMISSION_CLP: <DollarSign className="h-4 w-4" />,
  MANDATES: <FileText className="h-4 w-4" />,
  PROPERTIES_PUBLISHED: <Megaphone className="h-4 w-4" />,
}

const CORE_METRICS = [
  'CONTACTS',
  'VISITS',
  'PROPERTIES_PUBLISHED',
  'COMMISSION_CLP',
  'MANDATES',
  'DEALS_CLOSED',
] as const

const METRIC_ACCENTS: Record<string, { iconClassName: string; textClassName: string; trackClassName: string; indicatorClassName: string }> = {
  CONTACTS: {
    iconClassName: 'bg-[#12353A] text-[#7FB8B9]',
    textClassName: 'text-[#7FB8B9]',
    trackClassName: 'bg-[#12353A]',
    indicatorClassName: 'bg-[#7FB8B9]',
  },
  VISITS: {
    iconClassName: 'bg-[#3C2A15] text-[#E8A559]',
    textClassName: 'text-[#E8A559]',
    trackClassName: 'bg-[#3C2A15]',
    indicatorClassName: 'bg-[#E8A559]',
  },
  PROPERTIES_PUBLISHED: {
    iconClassName: 'bg-[#3A1D1D] text-[#C27F79]',
    textClassName: 'text-[#C27F79]',
    trackClassName: 'bg-[#3A1D1D]',
    indicatorClassName: 'bg-[#C27F79]',
  },
  COMMISSION_CLP: {
    iconClassName: 'bg-[#233A21] text-[#8FBF8A]',
    textClassName: 'text-[#8FBF8A]',
    trackClassName: 'bg-[#233A21]',
    indicatorClassName: 'bg-[#8FBF8A]',
  },
  MANDATES: {
    iconClassName: 'bg-[#2B2640] text-[#A58DDC]',
    textClassName: 'text-[#A58DDC]',
    trackClassName: 'bg-[#2B2640]',
    indicatorClassName: 'bg-[#A58DDC]',
  },
  DEALS_CLOSED: {
    iconClassName: 'bg-[#2D2A24] text-[#D5C3B6]',
    textClassName: 'text-[#D5C3B6]',
    trackClassName: 'bg-[#2D2A24]',
    indicatorClassName: 'bg-[#D5C3B6]',
  },
}

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

function KpiCard({
  metric,
  item,
  span,
}: {
  metric: string
  item: WeeklyCompareItem | undefined
  span: 'full' | 'half'
}) {
  const current = item?.currentValue ?? 0
  const target = item?.target ?? 0
  const progress = item?.progress ?? 0
  const accent = METRIC_ACCENTS[metric] ?? METRIC_ACCENTS.CONTACTS

  return (
    <Link
      href={`/broker/crm/goals/${metric}`}
      className={`group block rounded-xl border border-[#2D3C3C] bg-[#1E2E2E] p-3 transition hover:border-[#5E8B8C] ${
        span === 'full' ? 'col-span-2' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.iconClassName}`}>
            {METRIC_ICONS[metric] ?? <BarChart3 className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-[#9C8578]">{metricLabel(metric)}</p>
            <p className="mt-0.5 text-lg font-semibold leading-none text-[#FAF6F2]">
              {current}/{target}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] ${accent.textClassName}`}>
          {progress}%
        </span>
      </div>
      <div className="mt-2.5">
        <Progress
          value={Math.min(100, progress)}
          className={`h-1.5 rounded-full ${accent.trackClassName}`}
          indicatorClassName={accent.indicatorClassName}
        />
      </div>
    </Link>
  )
}

export function KpiWeeklyPanel() {
  const [data, setData] = useState<WeeklyCompareResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const week = getCurrentWeekNumber()
        const year = getCurrentYear()
        const month = getCurrentMonth()
        const monthYear = getCurrentYear()
        const res = await fetch(`/api/broker/goals/weekly-compare?week=${week}&year=${year}&month=${month}&monthYear=${monthYear}`)
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

  const items = (data?.weeklyCompare ?? []).filter((it) => CORE_METRICS.includes(it.metric as never))
  const itemsByMetric = Object.fromEntries(items.map((it) => [it.metric, it])) as Record<string, WeeklyCompareItem | undefined>
  const metrics = CORE_METRICS

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#FAF6F2]">Indicadores Clave</p>
          <p className="text-xs text-[#9C8578]">Seguimiento semanal de tus metas</p>
        </div>
        <Link
          href="/broker/crm/planning-week?tab=indicadores"
          className="shrink-0 text-xs font-medium text-[#C27F79] hover:underline"
        >
          Ver todos
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[74px] animate-pulse rounded-xl bg-[#1E2E2E]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {metrics.map((metric, index) => {
            const isEdge = index === 0 || index === metrics.length - 1
            return (
              <KpiCard
                key={metric}
                metric={metric}
                item={itemsByMetric[metric]}
                span={isEdge ? 'full' : 'half'}
              />
            )
          })}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Link
          href="/broker/crm/planning-week"
          className="inline-flex items-center rounded-full border border-[#2D3C3C] bg-[#152022] px-5 py-2 text-xs font-medium text-[#D5C3B6] hover:bg-[#223333]"
        >
          Planificación semanal
        </Link>
      </div>
    </div>
  )
}
