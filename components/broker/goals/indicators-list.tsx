'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const METRICS = [
  'CONTACTS',
  'VISITS',
  'PROPERTIES_PUBLISHED',
  'COMMISSION_CLP',
  'MANDATES',
  'DEALS_CLOSED',
] as const

type Metric = (typeof METRICS)[number]
type Period = 'WEEKLY' | 'MONTHLY'

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

interface ProgressItem {
  id: string
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  metric: string
  target: number
  current: number
}

function IndicatorRow({
  metric,
  item,
  period,
}: {
  metric: Metric
  item: ProgressItem | undefined
  period: Period
}) {
  const href = `/broker/crm/goals/${metric}?period=${period}`

  return (
    <Link
      href={href}
      className="-mx-2 flex items-center justify-between gap-4 rounded-lg border-b border-[#2D3C3C] px-2 py-4 transition hover:bg-[#152022]/60"
    >
      <p className="max-w-[65%] text-[15px] text-[#FAF6F2]">{metricLabel(metric)}</p>
      {item ? (
        <span className="shrink-0 text-2xl font-semibold text-[#FAF6F2]">
          {item.current}/{item.target}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#C27F79]">
          Definir meta
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </Link>
  )
}

export function IndicatorsList() {
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/goals')
        if (!res.ok) throw new Error()
        const json = await res.json()
        setProgress(Array.isArray(json.progress) ? json.progress : [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const byPeriod = (period: Period) =>
    Object.fromEntries(
      progress.filter((p) => p.period === period).map((p) => [p.metric, p]),
    ) as Record<string, ProgressItem | undefined>

  const weekly = byPeriod('WEEKLY')
  const monthly = byPeriod('MONTHLY')

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 rounded-xl bg-[#1E2E2E] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Esta semana</p>
        <div>
          {METRICS.map((metric) => (
            <IndicatorRow key={metric} metric={metric} item={weekly[metric]} period="WEEKLY" />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Este mes</p>
        <div>
          {METRICS.map((metric) => (
            <IndicatorRow key={metric} metric={metric} item={monthly[metric]} period="MONTHLY" />
          ))}
        </div>
      </div>
    </div>
  )
}
