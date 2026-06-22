'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { StageVelocity } from '@/lib/crm-metrics-enhanced'

interface StageVelocityChartProps {
  data: StageVelocity[]
}

export function StageVelocityChart({ data }: StageVelocityChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] text-lg">⏱ Velocidad de etapas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#9C8578]">Sin datos de historial disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
      <CardHeader>
        <CardTitle className="text-[#FAF6F2] text-lg">⏱ Velocidad de etapas</CardTitle>
        <p className="text-xs text-[#9C8578] mt-1">Días promedio que los deals gastan en cada etapa</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((stage) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#D5C3B6]">{stage.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#FAF6F2]">{stage.avgDays}d</span>
                  <Badge variant="outline" className="text-[9px] border-[#D5C3B6]/20 text-[#9C8578]">
                    {stage.percentage}%
                  </Badge>
                </div>
              </div>
              <div className="w-full h-2 bg-[#1C1917] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5E8B8C] to-[#B8965A] rounded-full"
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
