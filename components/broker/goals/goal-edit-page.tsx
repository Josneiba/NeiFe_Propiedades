'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Minus,
  Plus,
  Info,
  LayoutList,
  Phone,
  Home,
  Handshake,
  DollarSign,
  FileText,
  Megaphone,
} from 'lucide-react'
import { VerlaufChart } from '@/components/broker/goals/verlauf-chart'
import { getCurrentMonth, getCurrentWeekNumber, getCurrentYear, getISOWeekRange } from '@/lib/goal-engine'
import type { GoalMetric, GoalPeriod } from '@prisma/client'

const METRIC_LABELS: Record<GoalMetric, string> = {
  CONTACTS: 'Nuevos leads',
  VISITS: 'Visitas realizadas',
  DEALS_CLOSED: 'Cierres',
  COMMISSION_CLP: 'Negociaciones activas',
  MANDATES: 'Contratos firmados',
  PROPERTIES_PUBLISHED: 'Propiedades captadas',
}

const METRIC_ICONS: Record<GoalMetric, JSX.Element> = {
  CONTACTS: <Phone className="h-5 w-5" />,
  VISITS: <Home className="h-5 w-5" />,
  DEALS_CLOSED: <Handshake className="h-5 w-5" />,
  COMMISSION_CLP: <DollarSign className="h-5 w-5" />,
  MANDATES: <FileText className="h-5 w-5" />,
  PROPERTIES_PUBLISHED: <Megaphone className="h-5 w-5" />,
}

const METRIC_TIPS: Record<GoalMetric, string> = {
  CONTACTS: 'Responder a un lead nuevo dentro de la primera hora aumenta notablemente las probabilidades de agendar una visita.',
  VISITS: 'Confirmar la visita el mismo día reduce las inasistencias.',
  PROPERTIES_PUBLISHED: 'Publicar con fotos profesionales genera más contactos por publicación.',
  COMMISSION_CLP: 'Revisa el pipeline de negociaciones activas para proyectar este monto con más precisión.',
  MANDATES: 'Un mandato en exclusiva suele avanzar más rápido que uno compartido.',
  DEALS_CLOSED: 'Pedir referidos justo después de un cierre exitoso es cuando más dispuesto está el cliente.',
}

const ANALYSIS_SUPPORTED: GoalMetric[] = ['CONTACTS', 'VISITS', 'DEALS_CLOSED']

type PeriodTab = 'WEEKLY' | 'MONTHLY'

const PERIOD_TABS: { key: PeriodTab; label: string }[] = [
  { key: 'WEEKLY', label: 'Semanal' },
  { key: 'MONTHLY', label: 'Mensual' },
]

function getWeekLabel(week: number, year: number) {
  const { start, end } = getISOWeekRange(week, year)
  const startLabel = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  const endLabel = new Date(end.getTime() - 1).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startLabel} – ${endLabel}`
}

function getMonthLabel(month: number, year: number) {
  const date = new Date(year, month - 1, 1)
  const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function clamp(value: number) {
  return Math.max(0, Math.round(value))
}

export function GoalEditPage({ metric, initialPeriod }: { metric: GoalMetric; initialPeriod?: GoalPeriod }) {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodTab>(initialPeriod === 'MONTHLY' ? 'MONTHLY' : 'WEEKLY')
  const [week, setWeek] = useState(() => getCurrentWeekNumber())
  const [month, setMonth] = useState(() => getCurrentMonth())
  const [year, setYear] = useState(() => getCurrentYear())
  const [target, setTarget] = useState(0)
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [insight, setInsight] = useState<any>(null)
  const [saveTimer, setSaveTimer] = useState<number | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [progressItems, setProgressItems] = useState<any[]>([])
  const [expandedBreakdown, setExpandedBreakdown] = useState<Set<string>>(new Set())

  const metricLabel = METRIC_LABELS[metric] ?? metric

  const rangeLabel = useMemo(() => {
    return period === 'WEEKLY' ? getWeekLabel(week, year) : getMonthLabel(month, year)
  }, [period, week, month, year])

  const selectedGoal = useMemo(() => {
    return progressItems.find((item) => item.metric === metric && item.period === period)
  }, [progressItems, metric, period])

  useEffect(() => {
    if (!loading && selectedGoal) {
      setTarget(selectedGoal.target ?? 0)
      setCurrent(selectedGoal.current ?? 0)
      setIsDirty(false)
    }
  }, [selectedGoal, loading])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [goalsRes, insightsRes] = await Promise.all([
          fetch('/api/broker/goals'),
          fetch('/api/broker/goals/insights'),
        ])

        if (goalsRes.ok) {
          const goalsData = await goalsRes.json()
          setProgressItems(Array.isArray(goalsData.progress) ? goalsData.progress : [])
        }

        if (insightsRes.ok) {
          const insightsData = await insightsRes.json()
          setInsight(insightsData.insights?.insights ?? null)
        }
      } catch (error) {
        console.error('Error loading goal edit data', error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [metric])

  useEffect(() => {
    if (!loading && !selectedGoal) {
      setTarget(0)
      setCurrent(0)
    }
  }, [selectedGoal, loading])

  useEffect(() => {
    if (loading || !isDirty) {
      return
    }

    if (saveTimer !== null) {
      window.clearTimeout(saveTimer)
    }

    const timer = window.setTimeout(() => {
      void saveTarget(target)
    }, 500)
    setSaveTimer(timer)
    return () => {
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, period, week, month, year, loading, isDirty])

  async function saveTarget(value: number) {
    setSaving(true)
    setMessage(null)

    try {
      const body: Record<string, unknown> = { metric, period, target: value, year }
      if (period === 'WEEKLY') body.week = week
      if (period === 'MONTHLY') body.month = month

      const res = await fetch('/api/broker/goals/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}))
        setMessage(responseBody?.error ?? 'No se pudo guardar la meta')
        return
      }

      setMessage('Meta guardada')
      router.refresh()
    } catch (error) {
      console.error('Save target error', error)
      setMessage('Error al guardar meta')
    } finally {
      setSaving(false)
    }
  }

  function changeWeek(direction: -1 | 1) {
    setWeek((currentWeek) => {
      const nextWeek = currentWeek + direction
      if (nextWeek < 1) {
        setYear((y) => y - 1)
        return 52
      }
      if (nextWeek > 52) {
        setYear((y) => y + 1)
        return 1
      }
      return nextWeek
    })
  }

  function changeMonth(direction: -1 | 1) {
    setMonth((currentMonth) => {
      const nextMonth = currentMonth + direction
      if (nextMonth < 1) {
        setYear((y) => y - 1)
        return 12
      }
      if (nextMonth > 12) {
        setYear((y) => y + 1)
        return 1
      }
      return nextMonth
    })
  }

  const breakdownEntries = insight?.[metric]?.breakdown
    ? Object.entries(insight[metric].breakdown as Record<string, { count: number }>)
    : []

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="mx-auto w-full max-w-xl space-y-6 p-4 pb-16">
        <Link href="/broker/crm/mi-dia" className="flex items-center gap-1.5 text-sm text-[#9C8578] hover:text-[#FAF6F2]">
          <ChevronLeft className="h-4 w-4" /> Editar meta
        </Link>

        <div className="flex items-center border-b border-[#2D3C3C]">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPeriod(tab.key)}
              className={`flex-1 border-b-2 pb-3 text-center text-sm font-medium transition ${
                period === tab.key
                  ? 'border-[#C27F79] text-[#FAF6F2]'
                  : 'border-transparent text-[#9C8578] hover:text-[#D5C3B6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (period === 'WEEKLY' ? changeWeek(-1) : changeMonth(-1))}
            className="text-[#9C8578] hover:text-[#FAF6F2]"
            aria-label="Periodo anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-[#FAF6F2]">
            <Calendar className="h-4 w-4 text-[#C27F79]" />
            {rangeLabel}
          </div>
          <button
            type="button"
            onClick={() => (period === 'WEEKLY' ? changeWeek(1) : changeMonth(1))}
            className="text-[#9C8578] hover:text-[#FAF6F2]"
            aria-label="Periodo siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h1 className="text-[28px] font-bold leading-tight text-[#FAF6F2]">{metricLabel}</h1>

        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-2xl border border-[#2D3C3C] bg-[#152022] px-4 py-3">
            <p className="text-xs text-[#9C8578]">Meta</p>
            <div className="mt-1 flex items-center gap-2 text-[#FAF6F2]">
              {METRIC_ICONS[metric]}
              <span className="text-3xl font-semibold">{target}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setTarget((value) => clamp(value - 1))
              setIsDirty(true)
            }}
            aria-label="Bajar meta"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#2D3C3C] text-[#FAF6F2] hover:bg-[#152022]"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setTarget((value) => clamp(value + 1))
              setIsDirty(true)
            }}
            aria-label="Subir meta"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C27F79] text-[#1C2828] hover:bg-[#C27F79]/85"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-[#D5C3B6]">
          <Info className="h-4 w-4 text-[#C27F79]" />
          Actual: {current}
        </div>

        <div className="rounded-2xl border border-[#2D3C3C] bg-[#152022] p-4">
          <p className="text-sm leading-relaxed text-[#D5C3B6]">{METRIC_TIPS[metric]}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#9C8578]">
          <span>{saving ? 'Guardando...' : 'Los cambios se guardan solos'}</span>
          {message && <span className="text-[#5E8B8C]">{message}</span>}
        </div>

        <div className="border-t border-[#2D3C3C] pt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#FAF6F2]">Potencial</h2>
            <LayoutList className="h-4 w-4 text-[#9C8578]" aria-hidden="true" />
          </div>
          {!ANALYSIS_SUPPORTED.includes(metric) ? (
            <p className="text-sm text-[#9C8578]">Desglose no disponible todavía para este indicador.</p>
          ) : !insight ? (
            <p className="text-sm text-[#9C8578]">Cargando desglose...</p>
          ) : breakdownEntries.length === 0 ? (
            <p className="text-sm text-[#9C8578]">Sin datos de desglose por ahora.</p>
          ) : (
            <div className="space-y-2">
              {insight[metric]?.insight && (
                <p className="mb-1 text-xs text-[#9C8578]">{insight[metric].insight}</p>
              )}
              {breakdownEntries.map(([key, value], index) => {
                const rowKey = `${key}-${index}`
                const isOpen = expandedBreakdown.has(rowKey)
                return (
                  <div key={rowKey} className="rounded-xl bg-[#2D3C3C] px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBreakdown((prev) => {
                          const next = new Set(prev)
                          if (next.has(rowKey)) {
                            next.delete(rowKey)
                          } else {
                            next.add(rowKey)
                          }
                          return next
                        })
                      }
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span className="text-sm font-medium text-[#FAF6F2]">
                        {key} {value.count > 0 ? `(${value.count})` : ''}
                      </span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-[#D5C3B6] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-sm text-[#9C8578]">
                        {value.count > 0
                          ? `${value.count} contacto${value.count === 1 ? '' : 's'} en esta categoría.`
                          : 'No se encontraron contactos en esta categoría por ahora.'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-[#2D3C3C] pt-5">
          <h2 className="mb-3 text-sm font-semibold text-[#FAF6F2]">Historial</h2>
          <VerlaufChart metric={metric} metricLabel={metricLabel} />
        </div>
      </div>
    </div>
  )
}

