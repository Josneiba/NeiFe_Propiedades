'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, MapPin, User, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Mandate {
  id: string
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  startsAt?: string
  expiresAt?: string
  property: {
    name: string | null
    address: string
    commune: string
  }
  owner: {
    name: string | null
    email: string
  }
}

const statusConfig: Record<string, { label: string; badge: string; color: string }> = {
  PENDING: { 
    label: 'Esperando firma del propietario',
    badge: 'bg-[#F2C94C] text-[#1C1917]',
    color: 'text-[#F2C94C]'
  },
  ACTIVE: { 
    label: 'Activo',
    badge: 'bg-[#5E8B8C] text-[#FAF6F2]',
    color: 'text-[#5E8B8C]'
  },
  REVOKED: { 
    label: 'Revocado',
    badge: 'bg-[#C27F79] text-[#FAF6F2]',
    color: 'text-[#C27F79]'
  },
  EXPIRED: { 
    label: 'Expirado',
    badge: 'bg-[#9C8578] text-[#FAF6F2]',
    color: 'text-[#9C8578]'
  },
}

function formatDate(date: string | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BrokerMandatosPage() {
  const [mandates, setMandates] = useState<Mandate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMandates = async () => {
      try {
        const response = await fetch('/api/mandates')
        if (!response.ok) throw new Error('Error al cargar mandatos')
        const data = await response.json()
        setMandates(data.mandates || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchMandates()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-[#9C8578]">Cargando mandatos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FAF6F2]">Mandatos</h1>
          <p className="text-[#9C8578]">Solicitudes de administración de propiedades</p>
        </div>
        <Link href="/broker/mandatos/nuevo">
          <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-600/10 border-red-600/30">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Mandates List */}
      <div className="grid gap-4">
        {mandates.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-[#9C8578] mx-auto mb-3 opacity-50" />
              <p className="text-[#9C8578] mb-4">
                No tienes mandatos aún
              </p>
              <Link href="/broker/mandatos/nuevo">
                <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Solicitud
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          mandates.map((mandate) => {
            const status = statusConfig[mandate.status]
            return (
              <Card key={mandate.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Property Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#FAF6F2]">
                          {mandate.property.name || mandate.property.address}
                        </h3>
                        <div className="flex items-center gap-2 text-[#9C8578] text-sm mt-1">
                          <MapPin className="h-4 w-4" />
                          {mandate.property.commune}
                        </div>
                      </div>

                      {/* Owner Info */}
                      <div className="flex items-center gap-2 text-sm text-[#9C8578]">
                        <User className="h-4 w-4" />
                        <span>{mandate.owner.name || mandate.owner.email}</span>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[#9C8578]">Solicitud</p>
                          <div className="flex items-center gap-1 text-[#FAF6F2] mt-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(mandate.createdAt)}
                          </div>
                        </div>
                        {mandate.status === 'ACTIVE' && (
                          <div>
                            <p className="text-[#9C8578]">Activado desde</p>
                            <div className="flex items-center gap-1 text-[#FAF6F2] mt-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(mandate.startsAt)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <Badge className={status.badge}>
                        {status.label}
                      </Badge>

                      {mandate.status === 'ACTIVE' && (
                        <Link href={`/broker/propiedades/${mandate.property.id}`}>
                          <Button 
                            variant="outline"
                            className="text-[#FAF6F2] border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/10"
                          >
                            Ver Detalles
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
