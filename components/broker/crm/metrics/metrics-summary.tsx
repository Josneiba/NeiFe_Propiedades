'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Check, X, Clock } from 'lucide-react'

interface MetricsSummaryProps {
  totalPipelineValue: number
  winRate: number
  lossRate: number
  avgClosingTime: number
}

export function MetricsSummary({
  totalPipelineValue,
  winRate,
  lossRate,
  avgClosingTime,
}: MetricsSummaryProps) {
  function formatCLP(amount: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const metrics = [
    {
      label: 'Pipeline total',
      value: formatCLP(totalPipelineValue),
      icon: <DollarSign className="h-5 w-5" />,
      color: '#B8965A',
    },
    {
      label: 'Tasa de ganancia',
      value: `${winRate}%`,
      icon: <Check className="h-5 w-5" />,
      color: '#5E8B8C',
    },
    {
      label: 'Tasa de pérdida',
      value: `${lossRate}%`,
      icon: <X className="h-5 w-5" />,
      color: '#C27F79',
    },
    {
      label: 'Tiempo promedio de cierre',
      value: `${avgClosingTime}d`,
      icon: <Clock className="h-5 w-5" />,
      color: '#D5C3B6',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9C8578]">
                {metric.label}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold font-mono" style={{ color: metric.color }}>
                  {metric.value}
                </p>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${metric.color}15` }}
                >
                  {metric.icon}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
