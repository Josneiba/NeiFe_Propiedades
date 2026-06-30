'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const METRIC_OPTIONS = [
  { value: 'CONTACTS', label: 'Contactos' },
  { value: 'VISITS', label: 'Visitas' },
  { value: 'DEALS_CLOSED', label: 'Cierres' },
  { value: 'COMMISSION_CLP', label: 'Comisión' },
  { value: 'MANDATES', label: 'Mandatos' },
  { value: 'PROPERTIES_PUBLISHED', label: 'Propiedades' },
] as const

type MetricOption = (typeof METRIC_OPTIONS)[number]['value']

interface VerlaufRow {
  label: string
  actual: number
  target: number
}

interface VerlaufResponse {
  metric: MetricOption
  metricLabel: string
  data: VerlaufRow[]
}

export function VerlaufChart() {
  const [metric, setMetric] = useState<MetricOption>('CONTACTS')
  const [data, setData] = useState<VerlaufRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/broker/goals/verlauf?metric=${metric}`)
        if (!res.ok) throw new Error()
        const result: VerlaufResponse = await res.json()
        setData(result.data ?? [])
      } catch (error) {
        console.error(error)
        toast.error('No se pudo cargar la evolución semanal')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [metric])

  const metricLabel = useMemo(
    () => METRIC_OPTIONS.find((option) => option.value === metric)?.label ?? metric,
    [metric],
  )

  return (
    <Card className="bg-[#1a2a2a] border-[#2D3C3C]">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Evolución semanal</CardTitle>
        <div className="flex items-center gap-3">
          <label htmlFor="metric" className="text-xs text-[#D5C3B6] uppercase tracking-[0.18em] hidden sm:inline-block">
            Métrica
          </label>
          <select
            id="metric"
            value={metric}
            onChange={(event) => setMetric(event.target.value as MetricOption)}
            className="rounded-xl border border-[#2D3C3C] bg-[#132023] px-3 py-2 text-sm text-[#FAF6F2] outline-none focus:border-[#5E8B8C]"
          >
            {METRIC_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#1a2424] text-[#FAF6F2]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="h-[340px]">
        {loading ? (
          <p className="text-sm text-[#D5C3B6]">Cargando evolución...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-[#D5C3B6]">Sin datos para la evolución.</p>
        ) : (
          <div className="h-full">
            <div className="flex items-center justify-between gap-3 mb-4 text-sm text-[#D5C3B6]">
              <span>{metricLabel}</span>
              <span>Meta semanal: {data[data.length - 1]?.target ?? 0}</span>
            </div>
            <ResponsiveContainer width="100%" height="calc(100% - 32px)">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#2D3C3C" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: '#D5C3B6' }} />
                <YAxis tick={{ fill: '#D5C3B6' }} />
                <Tooltip
                  cursor={{ stroke: '#5E8B8C', strokeWidth: 1 }}
                  wrapperStyle={{ backgroundColor: '#1a2424', border: '1px solid #2D3C3C' }}
                  formatter={(value: number, name: string) => [value, name === 'actual' ? 'Real' : 'Meta']}
                />
                <Bar dataKey="actual" fill="#5E8B8C" name="Real" />
                <Line type="monotone" dataKey="target" stroke="#B8965A" strokeWidth={2} dot={false} name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
