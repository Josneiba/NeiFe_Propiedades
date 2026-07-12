'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts'

interface WeekPoint {
  label: string
  target: number
  real: number
}

interface VerlaufChartProps {
  metric: string
  metricLabel: string
}

// Gráfico "Verlauf" de PME: barras = meta de cada semana, línea = lo
// realmente logrado, con el valor siempre visible sobre cada punto (no solo
// al hacer hover) y una leyenda simple debajo — igual a como se ve en PME.
// Sin card ni borde propio: la pantalla que lo usa ya pone el encabezado
// "Historial" arriba, así que este componente es solo el área del gráfico.
export function VerlaufChart({ metric, metricLabel }: VerlaufChartProps) {
  const [data, setData] = useState<WeekPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    fetch(`/api/broker/goals/verlauf?metric=${encodeURIComponent(metric)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => setData(Array.isArray(json) ? json : []))
      .catch((error) => {
        console.error(error)
      })
      .finally(() => setLoading(false))
  }, [metric])

  if (loading) {
    return <div className="h-52 rounded-xl bg-[#1a2a2a] animate-pulse" />
  }

  if (data.length === 0 || data.every((row) => row.real === 0 && row.target === 0)) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-[#2D3C3C] text-sm text-[#9C8578]">
        Sin historial suficiente para {metricLabel}
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3C3C" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9C8578' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9C8578' }} axisLine={false} tickLine={false} width={24} />
          <Tooltip
            contentStyle={{ background: '#1C2828', border: '1px solid #2D3C3C', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#FAF6F2' }}
            formatter={(value: number, name: string) => [value, name === 'target' ? 'Meta' : 'Logrado']}
          />
          <Bar dataKey="target" fill="#2D3C3C" radius={[4, 4, 0, 0]} maxBarSize={32} name="Meta" />
          <Line
            type="monotone"
            dataKey="real"
            stroke="#E8A559"
            strokeWidth={2}
            dot={{ fill: '#E8A559', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#E8A559' }}
            name="Logrado"
          >
            <LabelList dataKey="real" position="top" fill="#E8A559" fontSize={11} offset={8} />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-[#9C8578]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E8A559]" /> Logrado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#2D3C3C]" /> Meta
        </span>
      </div>
    </div>
  )
}
