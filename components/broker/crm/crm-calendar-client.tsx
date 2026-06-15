'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { STAGE_COLUMNS } from '@/lib/crm-stage-utils'

interface ScheduledDeal {
  id: string
  code: string
  title: string
  stage: string
  value: number | null
  dueDate: Date
  property?: { address: string }
}

interface GroupedDeals {
  month: string
  deals: ScheduledDeal[]
}

export function CrmCalendarClient({ initialDeals }: { initialDeals: ScheduledDeal[] }) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [groupedDeals, setGroupedDeals] = useState<GroupedDeals[]>([])
  const [selectedDeal, setSelectedDeal] = useState<ScheduledDeal | null>(null)

  useEffect(() => {
    // Agrupar deals por mes/año
    const grouped: Record<string, ScheduledDeal[]> = {}
    
    initialDeals.forEach((deal) => {
      const dueDate = new Date(deal.dueDate)
      const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(deal)
    })

    // Convertir a array ordenado
    const sorted = Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, deals]) => ({
        month: monthKey,
        deals: deals.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      }))

    setGroupedDeals(sorted)
  }, [initialDeals])

  function formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  }

  function isOverdue(dueDate: Date): boolean {
    return new Date(dueDate) < new Date()
  }

  function daysUntilDue(dueDate: Date): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  function getUrgencyColor(dueDate: Date): string {
    const days = daysUntilDue(dueDate)
    if (days < 0) return 'bg-red-900/40 text-red-400'
    if (days <= 3) return 'bg-red-900/30 text-red-300'
    if (days <= 7) return 'bg-yellow-900/30 text-yellow-500'
    return 'bg-[#2D3C3C] text-[#9C8578]'
  }

  const getStageColor = (stage: string) => {
    return STAGE_COLUMNS.find(s => s.stage === stage)?.color || '#5E8B8C'
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-[#1C2828] border-b border-[#D5C3B6]/10 pb-4">
        <h2 className="text-lg font-semibold text-[#FAF6F2] flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-[#5E8B8C]" />
          Calendario de Objetivos
        </h2>
        {groupedDeals.length === 0 && (
          <p className="text-sm text-[#9C8578]">No hay deals con fecha objetivo</p>
        )}
      </div>

      {groupedDeals.map(({ month, deals }) => (
        <div key={month}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9C8578] mb-3">
            {formatMonth(month)}
          </h3>
          <div className="space-y-2">
            {deals.map((deal) => {
              const stageConfig = STAGE_COLUMNS.find(s => s.stage === deal.stage)
              const overdue = isOverdue(deal.dueDate)
              const daysLeft = daysUntilDue(deal.dueDate)

              return (
                <Card
                  key={deal.id}
                  className="p-3 bg-[#2D3C3C]/60 border border-[#D5C3B6]/10 hover:border-[#5E8B8C]/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[#B8965A] flex-shrink-0">
                          {deal.code}
                        </span>
                        <span className="text-xs font-medium text-[#D5C3B6] truncate group-hover:text-[#FAF6F2]">
                          {deal.title}
                        </span>
                      </div>
                      {deal.property?.address && (
                        <p className="text-[10px] text-[#9C8578] truncate mb-2">
                          📍 {deal.property.address}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px]">
                        <Badge
                          className="text-[9px]"
                          style={{
                            backgroundColor: stageConfig?.color + '22',
                            color: stageConfig?.color,
                            border: `1px solid ${stageConfig?.color}33`,
                          }}
                        >
                          ● {stageConfig?.label}
                        </Badge>
                        {deal.value && (
                          <span className="text-[#9C8578]">
                            ${Number(deal.value).toLocaleString('es-CL')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge className={`text-[9px] px-2 py-1 ${getUrgencyColor(deal.dueDate)}`}>
                        {overdue ? '⚠ Vencida' : daysLeft === 0 ? '📌 Hoy' : `${daysLeft}d`}
                      </Badge>
                      <span className="text-[10px] text-[#9C8578]">
                        {new Date(deal.dueDate).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
