'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PipelineMetrics {
  stageBreakdown: Array<{
    stage: string
    count: number
    value: number
  }>
  conversionRate: number
  avgDealValue: number
  avgDaysToClose: number
  winRate: number
  recentActivities: Array<{
    id: string
    type: string
    title: string
    timestamp: string
  }>
}

const STAGE_COLORS = [
  '#9333ea', // Prospecting - purple
  '#0ea5e9', // Initial Contact - blue
  '#06b6d4', // Qualified - cyan
  '#14b8a6', // Proposal - teal
  '#f59e0b', // Negotiation - amber
  '#10b981', // Closing - emerald
  '#22c55e', // Won - green
  '#ef4444', // Lost - red
]

export default function PipelineAnalyticsPage() {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const res = await fetch('/api/crm/metrics/overview')
        if (!res.ok) throw new Error('Error loading metrics')
        const data = await res.json()

        // Mock comprehensive metrics
        const mockMetrics: PipelineMetrics = {
          stageBreakdown: [
            { stage: 'Prospeccion', count: 15, value: 1800000 },
            { stage: 'Contacto', count: 12, value: 2400000 },
            { stage: 'Calificado', count: 8, value: 2100000 },
            { stage: 'Propuesta', count: 5, value: 1750000 },
            { stage: 'Negociacion', count: 3, value: 1500000 },
            { stage: 'Cierre', count: 2, value: 600000 },
            { stage: 'Ganado', count: 1, value: 350000 },
            { stage: 'Perdido', count: 4, value: 500000 },
          ],
          conversionRate: 42.5,
          avgDealValue: 187500,
          avgDaysToClose: 45,
          winRate: 35,
          recentActivities: [
            {
              id: '1',
              type: 'DEAL_MOVED',
              title: 'Oportunidad "Venta Depto Providencia" movida a Negociación',
              timestamp: 'Hace 2 horas',
            },
            {
              id: '2',
              type: 'CONTACT_CREATED',
              title: 'Nuevo contacto: María García Rodríguez (Arrendatario)',
              timestamp: 'Hace 4 horas',
            },
            {
              id: '3',
              type: 'DEAL_WON',
              title: 'Oportunidad ganada: "Arriendo Casa Ñuñoa"',
              timestamp: 'Hace 1 día',
            },
            {
              id: '4',
              type: 'ACTIVITY_LOGGED',
              title: 'Llamada registrada a Juan Pérez López',
              timestamp: 'Hace 1 día',
            },
          ],
        }

        setMetrics(mockMetrics)
      } catch (error) {
        console.error('Error loading metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Análisis de Pipeline</h1>
        <div className="text-center py-12 text-gray-600">Cargando métricas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análisis de Pipeline</h1>
        <p className="text-gray-600 mt-1">
          Visualiza el desempeño de tu cartera y métricas clave
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate ?? 0}%</div>
            <p className="text-xs text-gray-600 mt-1">Prospectos → Ganados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Deal Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics?.avgDealValue ?? 0) / 1000}K
            </div>
            <p className="text-xs text-gray-600 mt-1">Valor promedio de transacciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Días para Cerrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgDaysToClose ?? 0}</div>
            <p className="text-xs text-gray-600 mt-1">Promedio desde contacto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.winRate ?? 0}%</div>
            <p className="text-xs text-gray-600 mt-1">Oportunidades ganadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Breakdown - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Oportunidades por Etapa</CardTitle>
            <CardDescription>Cantidad y valor acumulado por etapa del pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics?.stageBreakdown ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Cantidad" />
                <Bar yAxisId="right" dataKey="value" fill="#8b5cf6" name="Valor ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Funnel - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución del Pipeline</CardTitle>
            <CardDescription>Porcentaje de oportunidades por etapa</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics?.stageBreakdown ?? []}
                  dataKey="count"
                  nameKey="stage"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ stage, value }) => `${stage}: ${value}`}
                >
                  {(metrics?.stageBreakdown ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Actividades Recientes</CardTitle>
          <CardDescription>Últimas acciones en tu CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Conversion Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de Conversión</CardTitle>
          <CardDescription>Métrica de conversión entre etapas consecutivas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics?.stageBreakdown.slice(0, -1).map((stage, idx) => {
              const nextStage = metrics?.stageBreakdown[idx + 1]
              const convRate = nextStage ? ((nextStage.count / stage.count) * 100).toFixed(1) : 'N/A'
              return (
                <div key={stage.stage} className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <p className="text-sm font-medium">
                      {stage.stage} → {nextStage?.stage}
                    </p>
                    <p className="text-xs text-gray-600">
                      {stage.count} → {nextStage?.count}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {convRate}%
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
