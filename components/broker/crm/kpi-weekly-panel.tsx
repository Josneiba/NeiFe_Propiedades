'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { toast } from 'sonner'

interface GoalComparison {
  metric: string
  label: string
  currentValue: number
  previousValue: number
  target: number
  progress: number
}

export function KpiWeeklyPanel() {
  const [items, setItems] = useState<GoalComparison[]>([])
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
    const totalPrevious = items.reduce((sum, item) => sum + item.previousValue, 0)
    return { totalCurrent, totalPrevious }
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
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.metric} className="rounded-3xl border border-[#2D3C3C] bg-[#152022] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#9C8578] uppercase tracking-[0.18em]">{item.label}</p>
                    <p className="text-lg font-semibold text-[#FAF6F2]">{item.currentValue}</p>
                  </div>
                  <div className="text-right text-sm text-[#D5C3B6]">
                    <p>{item.previousValue}</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {item.currentValue >= item.previousValue ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <span>{item.currentValue - item.previousValue}</span>
                    </div>
                  </div>
                </div>
                <Progress value={item.progress} className="mt-3 h-2 rounded-full bg-[#0f1b1b]" />
              </div>
            ))}
            <div className="rounded-3xl border border-[#2D3C3C] bg-[#152022] p-4">
              <p className="text-xs text-[#9C8578] uppercase tracking-[0.18em]">Total</p>
              <p className="text-2xl font-semibold text-[#FAF6F2]">{summary.totalCurrent}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
