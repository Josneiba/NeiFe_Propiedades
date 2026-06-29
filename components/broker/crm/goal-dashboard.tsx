'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, CalendarDays, CheckCircle2, BarChart3 } from 'lucide-react'
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

export function GoalDashboard({ progress }: GoalDashboardProps) {
  const grouped = useMemo(() => {
    return progress.reduce<Record<string, BrokerGoalProgress[]>>((acc, item) => {
      const key = item.period
      acc[key] = [...(acc[key] ?? []), item]
      return acc
    }, {})
  }, [progress])

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {Object.entries(grouped).map(([period, items]) => (
        <section key={period} className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-xl p-4">
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
              <div key={item.id} className="rounded-2xl bg-[#152022] p-4">
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
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
