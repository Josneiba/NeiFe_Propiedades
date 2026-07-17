'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCurrentMonth, getCurrentWeekNumber, getCurrentYear, getISOWeekRange } from '@/lib/goal-engine'

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
  const href = `/broker/crm/goals/${metric.toLowerCase()}?period=${period.toLowerCase()}`

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
  const [week, setWeek] = useState(() => getCurrentWeekNumber())
  const [year, setYear] = useState(() => getCurrentYear())
  const [month, setMonth] = useState(() => getCurrentMonth())
  const [monthYear, setMonthYear] = useState(() => getCurrentYear())

  const weekRangeLabel = useMemo(() => {
    const { start, end } = getISOWeekRange(week, year)
    const endDate = new Date(end.getTime() - 1)
    const startLabel = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    const endLabel = endDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startLabel} – ${endLabel}`
  }, [week, year])

  const monthRangeLabel = useMemo(() => {
    const start = new Date(monthYear, month - 1, 1)
    const end = new Date(monthYear, month, 1)
    return `${start.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}`
  }, [month, monthYear])

  function changeWeek(direction: -1 | 1) {
    setWeek((currentWeek) => {
      const nextWeek = currentWeek + direction
      if (nextWeek < 1) {
        setYear((currentYear) => currentYear - 1)
        return 52
      }
      if (nextWeek > 52) {
        setYear((currentYear) => currentYear + 1)
        return 1
      }
      return nextWeek
    })
  }

  function changeMonth(direction: -1 | 1) {
    setMonth((currentMonth) => {
      const nextMonth = currentMonth + direction
      if (nextMonth < 1) {
        setMonthYear((currentYear) => currentYear - 1)
        return 12
      }
      if (nextMonth > 12) {
        setMonthYear((currentYear) => currentYear + 1)
        return 1
      }
      return nextMonth
    })
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/broker/goals?week=${week}&year=${year}&month=${month}&monthYear=${monthYear}`)
        if (!res.ok) throw new Error()
        const json = await res.json()
        setProgress(Array.isArray(json.progress) ? json.progress : [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [month, monthYear, week, year])

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
          <div key={index} className="h-14 animate-pulse rounded-xl bg-[#1E2E2E]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#2D3C3C] bg-[#152022] px-3 py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-[#FAF6F2]">
            <Calendar className="h-4 w-4 text-[#C27F79]" />
            <span>Semana</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#2D3C3C] p-1">
            <button type="button" onClick={() => changeWeek(-1)} className="rounded-full p-1 text-[#9C8578] hover:bg-[#223333] hover:text-[#FAF6F2]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[90px] text-center text-sm text-[#FAF6F2]">{weekRangeLabel}</span>
            <button type="button" onClick={() => changeWeek(1)} className="rounded-full p-1 text-[#9C8578] hover:bg-[#223333] hover:text-[#FAF6F2]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-[#FAF6F2]">
            <Calendar className="h-4 w-4 text-[#7FB8B9]" />
            <span>Mes</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#2D3C3C] p-1">
            <button type="button" onClick={() => changeMonth(-1)} className="rounded-full p-1 text-[#9C8578] hover:bg-[#223333] hover:text-[#FAF6F2]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[110px] text-center text-sm text-[#FAF6F2]">{monthRangeLabel}</span>
            <button type="button" onClick={() => changeMonth(1)} className="rounded-full p-1 text-[#9C8578] hover:bg-[#223333] hover:text-[#FAF6F2]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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
