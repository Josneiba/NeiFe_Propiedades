'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { BarChart3, ChevronRight } from 'lucide-react'
import type { BrokerGoalProgress } from '@/lib/goal-engine'

function metricLabel(metric: string) {
  switch (metric) {
    case 'CONTACTS':
      return 'Contactos'
    case 'VISITS':
      return 'Visitas'
    case 'DEALS_CLOSED':
      return 'Cierres'
    case 'COMMISSION_CLP':
      return 'Comisión CLP'
    case 'MANDATES':
      return 'Mandatos'
    case 'PROPERTIES_PUBLISHED':
      return 'Propiedades publicadas'
    default:
      return metric
  }
}

function periodLabel(period: string) {
  switch (period) {
    case 'DAILY':
      return 'Hoy'
    case 'WEEKLY':
      return 'Semana'
    case 'MONTHLY':
      return 'Mes'
    default:
      return period
  }
}

interface GoalDashboardProps {
  progress: BrokerGoalProgress[]
}

const breakdownLabels: Record<string, string> = {
  PORTAL: 'Portal',
  REFERIDO: 'Referidos',
  RRSS: 'Redes sociales',
  LLAMADA_DIRECTA: 'Llamada directa',
  LETRERO: 'Letrero',
  OTRO: 'Otros',
  scheduled: 'Visitas agendadas',
  leadsWithoutVisit: 'Leads sin visita',
  clientsNoRecent: 'Clientes sin seguimiento',
  readyForSignature: 'Listos para firma',
  waitingDocs: 'Esperando documentos',
  waitingApproval: 'Esperando aprobación',
  negotiating: 'Negociaciones',
  closedThisWeek: 'Cerrados esta semana',
}

export function GoalDashboard({ progress }: GoalDashboardProps) {
  const [insights, setInsights] = useState<any>(null)
  const [insightError, setInsightError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [drillResults, setDrillResults] = useState<any[]>([])
  const [drillTitle, setDrillTitle] = useState<string | null>(null)
  const [loadingDrill, setLoadingDrill] = useState(false)
  const grouped = useMemo(() => {
    return progress.reduce<Record<string, BrokerGoalProgress[]>>((acc, item) => {
      const key = item.period
      acc[key] = [...(acc[key] ?? []), item]
      return acc
    }, {})
  }, [progress])

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await fetch('/api/broker/goals/insights')
        if (!res.ok) throw new Error('No se pudo cargar insights')
        const data = await res.json()
        setInsights(data.insights?.insights ?? null)
      } catch (error) {
        setInsightError(error instanceof Error ? error.message : 'No se pudo cargar insights')
      }
    }
    void loadInsights()
  }, [])

  async function executeBreakdown(label: string, savedViewQuery: any) {
    setLoadingDrill(true)
    setDrillTitle(label)
    try {
      const res = await fetch('/api/crm/saved-views/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedViewQuery),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDrillResults(data.results ?? [])
    } finally {
      setLoadingDrill(false)
    }
  }

  const selectedInsight = selectedMetric ? insights?.[selectedMetric] : null

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(grouped).map(([period, items]) => (
          <section key={period} className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-[#D5C3B6]/70 uppercase tracking-[0.18em]">{periodLabel(period)}</p>
              <p className="text-lg font-semibold text-[#FAF6F2]">Progreso</p>
            </div>
            <div className="rounded-full bg-[#253336] p-2">
              <BarChart3 className="w-5 h-5 text-[#5E8B8C]" />
            </div>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg bg-[#152022] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#FAF6F2]">{metricLabel(item.metric)}</p>
                    <p className="text-xs text-[#D5C3B6]/70">{item.rangeLabel}</p>
                  </div>
                  <Badge variant={item.completed ? 'secondary' : 'default'}>
                    {item.completed ? 'Alcanzado' : `${item.progressPercent}%`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3 mb-2 text-sm text-[#D5C3B6]/80">
                  <span>{item.current} / {item.target} {item.unit}</span>
                  {item.commitment && <span className="truncate">{item.commitment}</span>}
                </div>
                <Progress value={item.progressPercent} className="h-2 rounded-full bg-[#0f1b1b]" />
                {['CONTACTS', 'VISITS', 'DEALS_CLOSED'].includes(String(item.metric)) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedMetric(String(item.metric))}
                    className="mt-3 h-8 px-0 text-[#5E8B8C] hover:bg-transparent hover:text-[#D8F0EE]"
                  >
                    Ver desglose
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
        ))}
      </div>

      <Sheet open={Boolean(selectedMetric)} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-[#2D3C3C] bg-[#1C2828] text-[#FAF6F2] sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-[#FAF6F2]">{selectedMetric ? metricLabel(selectedMetric) : 'Desglose'}</SheetTitle>
          </SheetHeader>
          {insightError ? (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{insightError}</div>
          ) : !selectedInsight ? (
            <div className="mt-6 rounded-lg border border-[#2D3C3C] bg-[#152022] p-4 text-sm text-[#9C8578]">Cargando desglose...</div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-[#2D3C3C] bg-[#152022] p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>Meta: {selectedInsight.target}</span>
                  <span>Actual: {selectedInsight.current}</span>
                </div>
                {selectedInsight.insufficientHistory ? (
                  <Badge variant="outline" className="mt-3 border-[#D5C3B6]/20 text-[#D5C3B6]">{selectedInsight.message}</Badge>
                ) : (
                  <p className="mt-3 text-sm text-[#D5C3B6]">Predicción: {selectedInsight.probability}%</p>
                )}
                <p className="mt-3 text-sm text-[#FAF6F2]">{selectedInsight.insight}</p>
              </div>

              <div className="space-y-2">
                {Object.entries(selectedInsight.breakdown ?? {}).map(([key, value]: [string, any]) => (
                  <button
                    key={key}
                    onClick={() => void executeBreakdown(breakdownLabels[key] ?? key, value.savedViewQuery)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#2D3C3C] bg-[#152022] p-3 text-left hover:bg-[#223333]"
                  >
                    <span className="text-sm text-[#FAF6F2]">{breakdownLabels[key] ?? key}</span>
                    <span className="flex items-center gap-2 text-sm text-[#D5C3B6]">{value.count}<ChevronRight className="h-4 w-4" /></span>
                  </button>
                ))}
              </div>

              {drillTitle && (
                <section className="rounded-lg border border-[#2D3C3C] bg-[#152022]">
                  <div className="border-b border-[#2D3C3C] p-3">
                    <p className="text-sm font-semibold text-[#FAF6F2]">{drillTitle}</p>
                  </div>
                  {loadingDrill ? <p className="p-3 text-sm text-[#9C8578]">Cargando registros...</p> : drillResults.length === 0 ? <p className="p-3 text-sm text-[#9C8578]">Sin registros.</p> : (
                    <div className="divide-y divide-[#2D3C3C]">
                      {drillResults.slice(0, 12).map((record) => (
                        <div key={record.id} className="p-3 text-sm">
                          <p className="font-semibold text-[#FAF6F2]">{record.title ?? record.name ?? record.code}</p>
                          <p className="mt-1 text-xs text-[#9C8578]">{record.client?.name ?? record.source ?? record.stage ?? record.status ?? 'Registro filtrado'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
