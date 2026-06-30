'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface WeeklyCompareItem {
  metric: string
  label: string
  currentValue: number
  previousValue: number
  target: number
  progress: number
}

const METRIC_LABELS: Record<string, string> = {
  CONTACTS: 'Contactos',
  VISITS: 'Visitas',
  DEALS_CLOSED: 'Cierres',
  COMMISSION_CLP: 'Comisión',
  MANDATES: 'Mandatos',
  PROPERTIES_PUBLISHED: 'Propiedades',
}

export function KpiWeeklyPanel() {
  const [items, setItems] = useState<WeeklyCompareItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/goals/weekly-compare')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setItems(data.weeklyCompare ?? [])
      } catch (error) {
        console.error(error)
        toast.error('No se pudieron cargar los KPIs semanales')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const summary = useMemo(() => {
    const totalCurrent = items.reduce((sum, item) => sum + item.currentValue, 0)
    const totalTarget = items.reduce((sum, item) => sum + item.target, 0)
    return { totalCurrent, totalTarget }
  }, [items])

  return (
    <Card className="bg-[#1a2a2a] border-[#2D3C3C]">
      <CardHeader>
        <CardTitle>PME semanal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-[#D5C3B6]">Cargando indicadores...</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.metric} className="rounded-3xl border border-[#2D3C3C] bg-[#152022] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-[#9C8578] uppercase tracking-[0.18em]">{METRIC_LABELS[item.metric] ?? item.label}</p>
                    <p className="text-2xl font-semibold text-[#FAF6F2]">{item.currentValue}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full sm:w-auto text-center text-xs uppercase text-[#D5C3B6]">
                    <div className="rounded-2xl bg-[#132023] p-3">
                      <p>Actual</p>
                      <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{item.currentValue}</p>
                    </div>
                    <div className="rounded-2xl bg-[#132023] p-3">
                      <p>Anterior</p>
                      <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{item.previousValue}</p>
                    </div>
                    <div className="rounded-2xl bg-[#132023] p-3">
                      <p>Meta</p>
                      <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{item.target}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#D5C3B6]">
                    <span>Progreso</span>
                    <span>{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="mt-2 h-2 rounded-full bg-[#0f1b1b]" />
                </div>
              </div>
            ))}

            <div className="rounded-3xl border border-[#2D3C3C] bg-[#152022] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[#9C8578] uppercase tracking-[0.18em]">Total semanal</p>
                <p className="text-lg font-semibold text-[#FAF6F2]">{summary.totalCurrent} / {summary.totalTarget}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
