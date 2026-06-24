"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ProductivityChartProps {
  data: Array<{ type: string; count: number }>
}

export function ProductivityChart({ data }: ProductivityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9C8578]">
        <p>No hay datos de actividad para los últimos 30 días</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D5C3B6/10" />
        <XAxis 
          dataKey="type" 
          tick={{ fill: '#9C8578', fontSize: 12 }}
          axisLine={{ stroke: '#D5C3B6/10' }}
        />
        <YAxis 
          tick={{ fill: '#9C8578', fontSize: 12 }}
          axisLine={{ stroke: '#D5C3B6/10' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1C2828', 
            border: '1px solid #D5C3B6/20',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#FAF6F2' }}
        />
        <Bar dataKey="count" fill="#5E8B8C" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
