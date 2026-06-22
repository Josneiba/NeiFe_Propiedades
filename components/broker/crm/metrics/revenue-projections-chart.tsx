'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RevisionProjection } from '@/lib/crm-metrics-enhanced'

interface RevenueProjectionsProps {
  data: RevisionProjection[]
}

export function RevenueProjectionsChart({ data }: RevenueProjectionsProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] text-lg">💰 Proyecciones de ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#9C8578]">Sin datos de pipeline</p>
        </CardContent>
      </Card>
    )
  }

  function formatCLP(amount: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
      <CardHeader>
        <CardTitle className="text-[#FAF6F2] text-lg">💰 Proyecciones de ingresos</CardTitle>
        <p className="text-xs text-[#9C8578] mt-1">Estimaciones por fase del pipeline</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((projection) => (
            <div key={projection.phase} className="bg-[#1C1917] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase text-[#D5C3B6]">{projection.phase}</h4>
                <Badge variant="outline" className="text-[9px] border-[#D5C3B6]/20 text-[#9C8578]">
                  {projection.activeDeals} deals
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[#9C8578] mb-1">Valor promedio</p>
                  <p className="font-semibold text-[#B8965A]">{formatCLP(projection.avgValue)}</p>
                </div>
                <div>
                  <p className="text-[#9C8578] mb-1">Valor total</p>
                  <p className="font-semibold text-[#FAF6F2]">{formatCLP(projection.bestCase)}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#D5C3B6]/10">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#9C8578]">Proyección realista (70%)</span>
                    <span className="text-[10px] font-semibold text-[#5E8B8C]">
                      {formatCLP(projection.projectedRevenue)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2D3C3C] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5E8B8C]"
                      style={{ width: '70%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#9C8578]">Caso pesimista (60%)</span>
                    <span className="text-[10px] font-semibold text-[#C27F79]">
                      {formatCLP(projection.worstCase)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2D3C3C] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C27F79]"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
