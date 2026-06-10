'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Briefcase, TrendingUp, Activity } from 'lucide-react'

interface CrmMetrics {
  totalContacts: number
  activeDeals: number
  thisMonthActivity: number
  avgScore: number
}

export default function CrmPage() {
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const res = await fetch('/api/crm/metrics/overview')
        if (!res.ok) throw new Error('Error loading metrics')
        const data = await res.json()
        setMetrics(data)
      } catch (error) {
        console.error('Error loading metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Centro CRM</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu cartera de clientes y oportunidades de negocio
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-24" />
              </Card>
            ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contactos Totales</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalContacts ?? 0}</div>
                <p className="text-xs text-gray-600 mt-1">Contactos en el sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Oportunidades Activas</CardTitle>
                <Briefcase className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeDeals ?? 0}</div>
                <p className="text-xs text-gray-600 mt-1">Negocios en progreso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actividad Este Mes</CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.thisMonthActivity ?? 0}</div>
                <p className="text-xs text-gray-600 mt-1">Interacciones registradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Puntuación Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.avgScore?.toFixed(0) ?? 0}</div>
                <p className="text-xs text-gray-600 mt-1">Escala 0-100</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contactos
            </CardTitle>
            <CardDescription>
              Gestiona tu base de contactos, propietarios, arrendatarios y compradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/broker/crm/contactos">Ir a Contactos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Oportunidades (Kanban)
            </CardTitle>
            <CardDescription>
              Visualiza tus oportunidades en un tablero Kanban interactivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/broker/crm/workspace">Ir al Workspace</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análisis
            </CardTitle>
            <CardDescription>
              Reportes, métricas y análisis del desempeño de tu cartera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline" disabled>
              <span>Próximamente</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
