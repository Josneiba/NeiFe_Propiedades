'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, Minus, Plus, Phone, Home, Handshake, DollarSign, FileText, Megaphone } from 'lucide-react'
import { VerlaufChart } from '@/components/broker/goals/verlauf-chart'
import { getCurrentMonth, getCurrentWeekNumber, getCurrentYear, getISOWeekRange } from '@/lib/goal-engine'
import type { GoalMetric, GoalPeriod } from '@prisma/client'

const METRIC_LABELS: Record<GoalMetric, string> = {
  CONTACTS: 'Contactos',
  VISITS: 'Visitas',
  DEALS_CLOSED: 'Cierres',
  COMMISSION_CLP: 'Comisión CLP',
  MANDATES: 'Mandatos',
  PROPERTIES_PUBLISHED: 'Propiedades publicadas',
}

const METRIC_ICONS: Record<GoalMetric, JSX.Element> = {
  CONTACTS: <Phone />,
  VISITS: <Home />,
  DEALS_CLOSED: <Handshake />,
  COMMISSION_CLP: <DollarSign />,
  MANDATES: <FileText />,
  PROPERTIES_PUBLISHED: <Megaphone />,
}

const ANALYSIS_SUPPORTED: GoalMetric[] = ['CONTACTS', 'VISITS', 'DEALS_CLOSED']

function getPeriodLabel(period: GoalPeriod) {
  return period === 'WEEKLY' ? 'Weekly' : period === 'MONTHLY' ? 'Monthly' : 'Daily'
}

function getWeekLabel(week: number, year: number) {
  const { start, end } = getISOWeekRange(week, year)
  const startLabel = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  const endLabel = new Date(end.getTime() - 1).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  return `${startLabel} – ${endLabel}`
}

function getMonthLabel(month: number, year: number) {
  return `Mes ${month} / ${year}`
}

function clamp(value: number) {
  return Math.max(0, Math.round(value))
}

function getMetricPath(metric: GoalMetric) {
  return `/broker/crm/goals/${metric}`
}

export function GoalEditPage({ metric }: { metric: GoalMetric }) {
  const router = useRouter()
  const [period, setPeriod] = useState<GoalPeriod>('WEEKLY')
  const [week, setWeek] = useState(() => getCurrentWeekNumber())
  const [month, setMonth] = useState(() => getCurrentMonth())
  const [year, setYear] = useState(() => getCurrentYear())
  const [target, setTarget] = useState(0)
  const [current, setCurrent] = useState(0)
  const [goalId, setGoalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [insight, setInsight] = useState<any>(null)
  const [saveTimer, setSaveTimer] = useState<number | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [progressItems, setProgressItems] = useState<any[]>([])

  const metricLabel = METRIC_LABELS[metric] ?? metric

  const rangeLabel = useMemo(() => {
    if (period === 'WEEKLY') return getWeekLabel(week, year)
    if (period === 'MONTHLY') return getMonthLabel(month, year)
    return 'Periodo'
  }, [period, week, month, year])

  const selectedGoal = useMemo(() => {
    return progressItems.find((item) => item.metric === metric && item.period === period)
  }, [progressItems, metric, period])

  useEffect(() => {
    if (!loading && selectedGoal) {
      setTarget(selectedGoal.target ?? 0)
      setCurrent(selectedGoal.current ?? 0)
      setGoalId(selectedGoal.id ?? null)
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
      setGoalId(null)
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
  }, [target, period, week, month, year, loading, isDirty])

  async function saveTarget(value: number) {
    setSaving(true)
    setMessage(null)

    try {
      const body: Record<string, unknown> = {
        metric,
        period,
        target: value,
        year,
      }

      if (period === 'WEEKLY') {
        body.week = week
      }
      if (period === 'MONTHLY') {
        body.month = month
      }

      const res = await fetch('/api/broker/goals/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}))
        const messageText = responseBody?.error ?? 'No se pudo guardar la meta'
        setMessage(messageText)
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

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="mx-auto max-w-5xl p-4 space-y-6 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Link href="/broker/crm/mi-dia" className="text-sm text-[#9C8578] hover:text-[#FAF6F2] flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Volver a Mi Día
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{METRIC_ICONS[metric]}</span>
              <div>
                <p className="text-3xl font-semibold text-[#FAF6F2]">{metricLabel}</p>
                <p className="text-sm text-[#9C8578]">Editar meta</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Rango</p>
            <p className="text-sm text-[#FAF6F2]">{rangeLabel}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <Card className="bg-[#152022] border border-[#2D3C3C]">
              <div className="flex items-center justify-between gap-4 border-b border-[#2D3C3C] p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Periodo</p>
                  <p className="text-lg font-semibold text-[#FAF6F2]">{getPeriodLabel(period)}</p>
                </div>
                <Tabs value={period} onValueChange={(value) => setPeriod(value as GoalPeriod)}>
                  <TabsList className="rounded-full bg-[#1C2828] p-1">
                    <TabsTrigger value="WEEKLY" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] rounded-full px-4 py-2 text-sm text-[#9C8578]">Weekly</TabsTrigger>
                    <TabsTrigger value="MONTHLY" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] rounded-full px-4 py-2 text-sm text-[#9C8578]">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="p-4 space-y-4">
                {period === 'WEEKLY' ? (
                  <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" size="sm" onClick={() => changeWeek(-1)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Semana</p>
                      <p className="text-lg font-semibold text-[#FAF6F2]">{week} / {year}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => changeWeek(1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Mes</p>
                      <p className="text-lg font-semibold text-[#FAF6F2]">{month} / {year}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="rounded-3xl border border-[#2D3C3C] bg-[#1A2929] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Meta</p>
                      <p className="text-4xl font-semibold text-[#FAF6F2]">{target}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTarget((value) => clamp(value - 1))
                          setIsDirty(true)
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTarget((value) => clamp(value + 1))
                          setIsDirty(true)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[#9C8578]">
                    <span>Actual</span>
                    <span>{current}</span>
                  </div>
                  <div className="mt-4 text-xs text-[#9C8578]">El cambio se guarda automáticamente después de unos instantes.</div>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-[#9C8578]">
                  <span>{saving ? 'Guardando...' : 'Autosave habilitado'}</span>
                  {message && <span className="text-[#5E8B8C]">{message}</span>}
                </div>
              </div>
            </Card>

            <Card className="bg-[#152022] border border-[#2D3C3C]">
              <div className="border-b border-[#2D3C3C] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Potential</p>
                <p className="text-lg font-semibold text-[#FAF6F2]">Oportunidades</p>
              </div>
              <div className="p-4 space-y-4">
                {ANALYSIS_SUPPORTED.includes(metric) ? (
                  !insight ? (
                    <div className="text-sm text-[#9C8578]">Cargando potencial...</div>
                  ) : insight[metric] ? (
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-[#2D3C3C] bg-[#1A2929] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Meta</p>
                            <p className="text-2xl font-semibold text-[#FAF6F2]">{insight[metric].target}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Actual</p>
                            <p className="text-2xl font-semibold text-[#5E8B8C]">{insight[metric].current}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-[#9C8578]">{insight[metric].insight}</p>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(
                          (insight[metric].breakdown ?? {}) as Record<string, { count: number }>,
                        ).map(([key, value], index) => (
                          <button
                            key={`${key}-${index}`}
                            type="button"
                            className="flex w-full items-center justify-between rounded-3xl border border-[#2D3C3C] bg-[#162121] p-3 text-left text-sm text-[#FAF6F2] hover:bg-[#223333]"
                          >
                            <span>{key}</span>
                            <span className="text-[#9C8578]">{value.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[#9C8578]">No hay datos de desglose disponibles para este indicador.</div>
                  )
                ) : (
                  <div className="rounded-3xl border border-[#2D3C3C] bg-[#1A2929] p-4 text-sm text-[#9C8578]">
                    Desglose no disponible para este indicador aún.
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-[#152022] border border-[#2D3C3C]">
              <div className="border-b border-[#2D3C3C] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#9C8578]">Historial</p>
                <p className="text-lg font-semibold text-[#FAF6F2]">{metricLabel}</p>
              </div>
              <div className="p-4">
                <VerlaufChart metric={metric} metricLabel={metricLabel} />
              </div>
            </Card>

            <div className="rounded-3xl border border-[#2D3C3C] bg-[#1A2929] p-4 text-sm text-[#9C8578]">
              <p className="font-semibold text-[#FAF6F2]">Notas</p>
              <p className="mt-2">Esta pantalla permite editar la meta directamente y usar el pipeline real cuando esté disponible. Si no existe una meta para el período actual, se creará automáticamente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
