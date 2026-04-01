'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type ConsumoChartRow = {
  month: string
  water: number
  electricity: number
}

type Props = {
  data: ConsumoChartRow[]
}

export function ConsumoServiciosChart({ data }: Props) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d5c3b6" />
          <XAxis
            dataKey="month"
            stroke="#9c8578"
            tick={{ fill: '#9c8578' }}
          />
          <YAxis
            stroke="#9c8578"
            tick={{ fill: '#9c8578' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#faf6f2',
              border: '1px solid #d5c3b6',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#1c1917' }}
            formatter={(value: number) => `$${value.toLocaleString('es-CL')}`}
          />
          <Legend />
          <Bar
            dataKey="water"
            name="Agua"
            fill="#60a5fa"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="electricity"
            name="Luz"
            fill="#facc15"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
