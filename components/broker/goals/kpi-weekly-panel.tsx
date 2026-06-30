'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const METRIC_ICONS: Record<string, string> = {
  CONTACTS: '📞',
  VISITS: '🏠',
  DEALS_CLOSED: '🤝',
  COMMISSION_CLP: '💰',
  MANDATES: '📋',
  PROPERTIES_PUBLISHED: '📢',
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-24 rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] animate-pulse" />
        ))}
      </div>
    )
  }

  const items = data?.weeklyCompare ?? []
  const activeMetrics = items.filter((item) => item.target > 0)

  if (activeMetrics.length === 0) {
    return (
      <Link
        href="/broker/crm/goals"
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2D3C3C] bg-[#1a2a2a] px-4 py-8 text-center text-sm text-[#9C8578] transition hover:border-[#5E8B8C]/50 hover:text-[#D5C3B6]"
      >
        <Plus className="w-6 h-6" />
        <p className="font-semibold">Define tus indicadores semanales</p>
        <p className="text-xs opacity-70">Toca para configurar metas</p>
      </Link>
    )
  }

  const totalCurrent = activeMetrics.reduce((sum, item) => sum + item.currentValue, 0)
  const totalTarget = activeMetrics.reduce((sum, item) => sum + item.target, 0)

  return (
    <div className="space-y-4">
      {activeMetrics.map((item) => {
        const trend =
          item.currentValue > item.previousValue
            ? 'up'
            : item.currentValue < item.previousValue
            ? 'down'
            : 'same'
        const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
        const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[#9C8578]'

        return (
          <div key={item.metric} className="rounded-3xl border border-[#2D3C3C] bg-[#152022] overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[#2D3C3C] px-4 py-3">
              <span>{METRIC_ICONS[item.metric] ?? '📊'}</span>
              <span className="text-sm font-semibold text-[#FAF6F2]">{item.label}</span>
              <TrendIcon className={cn('w-4 h-4', trendColor)} />
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#2D3C3C] text-center text-xs uppercase text-[#D5C3B6]">
              <div className="px-4 py-3">
                <p className="text-[#9C8578]">Semana pasada</p>
                <p className="mt-2 text-2xl font-semibold text-[#9C8578]/80">
                  {item.previousValue}
                  <span className="ml-1 text-sm font-normal">/{item.previousTarget || item.target}</span>
                </p>
              </div>
              <div className="bg-[#1e322f] px-4 py-3">
                <p className="text-[#5E8B8C]">Esta semana</p>
                <p className="mt-2 text-2xl font-semibold text-[#FAF6F2]">
                  {item.currentValue}
                  <span className="ml-1 text-sm font-normal text-[#9C8578]">/{item.target}</span>
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[#9C8578]">Próxima</p>
                <p className="mt-2 text-2xl font-semibold text-[#9C8578]/80">
                  0<span className="ml-1 text-sm font-normal">/{item.target}</span>
                </p>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-xs text-[#D5C3B6]">
                <span>Progreso</span>
                <span>{item.progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#0f1b1b]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${item.progress}%`,
                    backgroundColor: item.progress >= 100 ? '#22c55e' : item.progress >= 60 ? '#5E8B8C' : '#C27F79',
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}

      <div className="rounded-3xl border border-[#2D3C3C] bg-[#152022] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#9C8578] uppercase tracking-[0.18em]">Total semanal</p>
          <p className="text-lg font-semibold text-[#FAF6F2]">{totalCurrent} / {totalTarget}</p>
        </div>
      </div>
    </div>
  )
}
