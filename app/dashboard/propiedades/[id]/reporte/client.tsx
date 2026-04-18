'use client'

import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
// import ReportDownloadButton from '@/components/dashboard/report-download-button'
import { useEffect, useState } from 'react'

interface ReportPageClientProps {
  propertyId: string
  session: any
}

export default function ReportPageClient({ propertyId, session }: ReportPageClientProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()

        const response = await fetch(
          `/api/properties/${propertyId}/report?month=${currentMonth}&year=${currentYear}`
        )
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching report data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId])

  if (loading) {
    return <div className="text-center py-12">Cargando reporte...</div>
  }

  if (!data) {
    return <div className="text-center py-12">No se pudo cargar el reporte</div>
  }

  const statusConfig: Record<string, string> = {
    PAID: 'Pagado',
    PENDING: 'Pendiente',
    OVERDUE: 'Atrasado',
  }

  function formatCLP(amount: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const monthName = new Date(data.currentYear, data.currentMonth - 1).toLocaleDateString('es-CL', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/propiedades/${propertyId}`}>
          <button className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Reporte Mensual</h1>
          <p className="text-gray-600">{monthName}</p>
        </div>
      </div>

      {/* Download Button */}
      {/* <ReportDownloadButton data={data} /> */}
      <div className="text-sm text-gray-500 p-4 bg-gray-100 rounded">
        Reporte PDF deshabilitado temporalmente para build
      </div>

      {/* Property Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Propiedad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Propiedad</p>
              <p className="font-semibold">{data.property.name || data.property.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dirección</p>
              <p className="font-semibold">
                {data.property.address}, {data.property.commune}
              </p>
            </div>
            {data.property.tenant && (
              <div>
                <p className="text-sm text-gray-500">Arrendatario</p>
                <p className="font-semibold">{data.property.tenant.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Arriendo Mensual</p>
              <p className="font-semibold">
                {data.property.monthlyRentCLP ? formatCLP(data.property.monthlyRentCLP) : 'No especificado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      {data.currentPayment && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className="font-semibold">{statusConfig[data.currentPayment.status] || 'Desconocido'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monto</p>
              <p className="font-semibold">{formatCLP(data.currentPayment.amountCLP)}</p>
            </div>
            {data.currentPayment.paidDate && (
              <div>
                <p className="text-sm text-gray-500">Fecha de Pago</p>
                <p className="font-semibold">
                  {new Date(data.currentPayment.paidDate).toLocaleDateString('es-CL')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {data.services && data.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Servicios Consumidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.services.map((service: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    {service.consumo && (
                      <p className="text-sm text-gray-500">
                        {service.consumo} {service.unit}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">{formatCLP(service.amountCLP)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance */}
      {data.maintenance && data.maintenance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mantenciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.maintenance.map((maint: any, idx: number) => (
                <div key={idx} className="p-2 border-b">
                  <p className="font-medium">{maint.description || 'Sin descripción'}</p>
                  <p className="text-sm text-gray-500">Estado: {maint.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
