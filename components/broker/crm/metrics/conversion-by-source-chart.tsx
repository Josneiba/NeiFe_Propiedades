'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConversionMetric } from '@/lib/crm-metrics-enhanced'

interface ConversionBySouuceProps {
  data: ConversionMetric[]
}

export function ConversionBySourceChart({ data }: ConversionBySouuceProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] text-lg">📊 Conversión por fuente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#9C8578]">Sin datos de conversión</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
      <CardHeader>
        <CardTitle className="text-[#FAF6F2] text-lg">📊 Conversión por fuente</CardTitle>
        <p className="text-xs text-[#9C8578] mt-1">Tasa de conversión por canal de adquisición</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-[#D5C3B6]/10">
              <tr>
                <th className="text-left py-2 px-2 text-[#9C8578] font-semibold">Fuente</th>
                <th className="text-center py-2 px-2 text-[#9C8578] font-semibold">Total</th>
                <th className="text-center py-2 px-2 text-[#9C8578] font-semibold">Ganados</th>
                <th className="text-center py-2 px-2 text-[#9C8578] font-semibold">Perdidos</th>
                <th className="text-center py-2 px-2 text-[#9C8578] font-semibold">Tasa</th>
              </tr>
            </thead>
            <tbody>
              {data.map((metric) => (
                <tr key={metric.source} className="border-b border-[#D5C3B6]/10 hover:bg-[#1C1917]">
                  <td className="py-2 px-2 text-[#D5C3B6]">{metric.source}</td>
                  <td className="py-2 px-2 text-center text-[#FAF6F2] font-semibold">{metric.total}</td>
                  <td className="py-2 px-2 text-center text-[#5E8B8C]">{metric.won}</td>
                  <td className="py-2 px-2 text-center text-[#C27F79]">{metric.lost}</td>
                  <td className="py-2 px-2 text-center">
                    <Badge
                      className={`text-[9px] font-semibold ${
                        metric.rate >= 50
                          ? 'bg-[#5E8B8C]/20 text-[#5E8B8C] border border-[#5E8B8C]/30'
                          : metric.rate >= 25
                            ? 'bg-[#B8965A]/20 text-[#B8965A] border border-[#B8965A]/30'
                            : 'bg-[#C27F79]/20 text-[#C27F79] border border-[#C27F79]/30'
                      }`}
                    >
                      {metric.rate}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
