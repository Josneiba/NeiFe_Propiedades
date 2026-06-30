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
    return <div className="h-48 rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] animate-pulse" />
  }

  if (data.length === 0 || data.every((row) => row.real === 0 && row.target === 0)) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-[#2D3C3C] bg-[#1a2a2a] text-sm text-[#9C8578]">
        Sin historial suficiente para {metricLabel}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] p-4">
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#9C8578]">Verlauf — {metricLabel}</p>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3C3C" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9C8578' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9C8578' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1C2828', border: '1px solid #2D3C3C', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#FAF6F2' }}
            formatter={(value: number, name: string) => [value, name === 'target' ? 'Meta' : 'Real']}
          />
          <Bar dataKey="target" fill="#2D3C3C" radius={[4, 4, 0, 0]} maxBarSize={32} name="Meta" />
          <Line
            type="monotone"
            dataKey="real"
            stroke="#B8965A"
            strokeWidth={2}
            dot={{ fill: '#B8965A', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#B8965A' }}
            name="Real"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
