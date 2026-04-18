'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, MapPin, User, Calendar, Trash2, UserX } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Mandate {
  id: string
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  startsAt?: string
  expiresAt?: string
  property: {
    id: string
    name: string | null
    address: string
    commune: string
  }
  owner: {
    name: string | null
    email: string
  }
}

interface BrokerPermissionRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  landlord: {
    id: string
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

const permissionStatusConfig: Record<string, { label: string; badge: string }> = {
  PENDING: {
    label: 'Pendiente de revisión',
    badge: 'bg-[#F2C94C] text-[#1C1917]'
  },
  APPROVED: {
    label: 'Aprobado',
    badge: 'bg-[#5E8B8C] text-[#FAF6F2]'
  },
  REJECTED: {
    label: 'Rechazado',
    badge: 'bg-[#C27F79] text-[#FAF6F2]'
  }
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
  const { toast } = useToast()
  const [mandates, setMandates] = useState<Mandate[]>([])
  const [permissions, setPermissions] = useState<BrokerPermissionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingMandateId, setDeletingMandateId] = useState<string | null>(null)
  const [endingPartnershipId, setEndingPartnershipId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mandatesRes, permissionsRes] = await Promise.all([
          fetch('/api/mandates'),
          fetch('/api/broker-permissions/sent')
        ])
        
        if (!mandatesRes.ok) throw new Error('Error al cargar mandatos')
        if (!permissionsRes.ok) throw new Error('Error al cargar solicitudes')
        
        const mandatesData = await mandatesRes.json()
        const permissionsData = await permissionsRes.json()
        
        setMandates(mandatesData.mandates || [])
        setPermissions(permissionsData.permissions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud? No podrás recuperarla.')) {
      return
    }

    setDeletingId(permissionId)
    try {
      const response = await fetch(`/api/broker-permissions/${permissionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPermissions(permissions.filter(p => p.id !== permissionId))
        toast({
          title: 'Solicitud eliminada',
          description: 'La solicitud ha sido eliminada exitosamente.'
        })
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo eliminar la solicitud'
        })
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al eliminar la solicitud'
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleEndPartnership = async (landlordId: string, permissionRowId: string) => {
    if (
      !confirm(
        '¿Dejar de administrar todas las propiedades de este propietario? Se revocarán mandatos activos y solicitudes pendientes.'
      )
    ) {
      return
    }
    setEndingPartnershipId(permissionRowId)
    try {
      const response = await fetch('/api/broker-permissions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId }),
      })
      if (response.ok) {
        toast({
          title: 'Relación finalizada',
          description: 'Ya no administras las propiedades de este propietario.',
        })
        const [mandatesRes, permissionsRes] = await Promise.all([
          fetch('/api/mandates'),
          fetch('/api/broker-permissions/sent'),
        ])
        if (mandatesRes.ok) {
          const d = await mandatesRes.json()
          setMandates(d.mandates || [])
        }
        if (permissionsRes.ok) {
          const d = await permissionsRes.json()
          setPermissions(d.permissions || [])
        }
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo finalizar la relación',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión',
      })
    } finally {
      setEndingPartnershipId(null)
    }
  }

  const handleDeleteMandate = async (mandateId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud de mandato?')) {
      return
    }

    setDeletingMandateId(mandateId)
    try {
      const response = await fetch(`/api/mandates/${mandateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMandates(mandates.filter(m => m.id !== mandateId))
        toast({
          title: 'Solicitud eliminada',
          description: 'La solicitud de mandato fue eliminada.'
        })
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo eliminar la solicitud'
        })
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al eliminar la solicitud de mandato'
      })
    } finally {
      setDeletingMandateId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-[#9C8578]">Cargando mandatos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
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

      {/* Permiso general por propietario (antes de mandatos por propiedad) */}
      {permissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[#FAF6F2] mb-4">Permiso con propietarios</h2>
          <p className="text-sm text-[#9C8578] mb-4">
            El propietario debe aprobar este acceso general; luego puedes solicitar mandatos por cada propiedad en Nueva solicitud.
          </p>
          <div className="grid gap-4">
            {permissions.map((permission) => {
              const permStatus = permissionStatusConfig[permission.status]
              return (
                <Card key={permission.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#9C8578]" />
                          <h3 className="text-lg font-semibold text-[#FAF6F2]">
                            {permission.landlord.name || permission.landlord.email}
                          </h3>
                        </div>
                        <p className="text-sm text-[#9C8578]">{permission.landlord.email}</p>
                        <div className="flex items-center gap-2 text-sm text-[#9C8578] mt-2">
                          <Calendar className="w-4 h-4" />
                          Solicitado el {formatDate(permission.createdAt)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <Badge className={permStatus.badge}>
                          {permStatus.label}
                        </Badge>
                        {permission.status === 'PENDING' && (
                          <Button
                            onClick={() => handleDeletePermission(permission.id)}
                            disabled={deletingId === permission.id}
                            variant="outline"
                            size="sm"
                            className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deletingId === permission.id ? 'Eliminando...' : 'Eliminar solicitud'}
                          </Button>
                        )}
                        {permission.status === 'APPROVED' && (
                          <Button
                            onClick={() =>
                              handleEndPartnership(permission.landlord.id, permission.id)
                            }
                            disabled={endingPartnershipId === permission.id}
                            variant="outline"
                            size="sm"
                            className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {endingPartnershipId === permission.id
                              ? 'Finalizando...'
                              : 'Dejar de administrar'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Mandatos Activos */}
      <div>
        <h2 className="text-xl font-semibold text-[#FAF6F2] mb-4">Mandatos Activos</h2>
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
          <div className="grid gap-4">
            {mandates.map((mandate) => {
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

                        {mandate.status === 'PENDING' && (
                          <Button
                            onClick={() => handleDeleteMandate(mandate.id)}
                            disabled={deletingMandateId === mandate.id}
                            variant="outline"
                            className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deletingMandateId === mandate.id ? 'Eliminando...' : 'Eliminar solicitud'}
                          </Button>
                        )}

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
            })}
          </div>
        )}
      </div>
    </div>
  )
}
