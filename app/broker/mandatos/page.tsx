'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, MapPin, User, Calendar, Trash2, UserX, ExternalLink, Download } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { mandateStatus } from '@/lib/broker-design'

interface Mandate {
  id: string
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  startsAt?: string
  expiresAt?: string
  commissionRate?: number | null
  commissionType?: 'MONTHLY' | 'ONE_TIME' | 'ANNUAL' | null
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

const mandateLabels: Record<string, string> = {
  PENDING: 'Esperando firma del propietario',
  ACTIVE: 'Activo',
  REVOKED: 'Revocado',
  EXPIRED: 'Expirado',
}

const permissionStatusConfig: Record<string, { label: string; badge: string }> = {
  PENDING: {
    label: 'Pendiente de revisión',
    badge: mandateStatus.PENDING.badge,
  },
  APPROVED: {
    label: 'Aprobado',
    badge: mandateStatus.ACTIVE.badge,
  },
  REJECTED: {
    label: 'Rechazado',
    badge: mandateStatus.REVOKED.badge,
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-[#2A2520] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[#2A2520] rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-[#2A2520] rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-[#1C1917] rounded animate-pulse" />
                  <div className="h-4 w-32 bg-[#1C1917] rounded animate-pulse" />
                  <div className="h-4 w-56 bg-[#1C1917] rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-[#1C1917] rounded-full animate-pulse" />
                  <div className="h-9 w-24 bg-[#1C1917] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Mandatos</h1>
          <p className="text-sm text-[#9C8578] mt-0.5">Solicitudes de administración y mandatos activos</p>
        </div>
        <Link href="/broker/mandatos/nuevo">
          <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo mandato
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
          <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">Solicitudes a propietarios</p>
          <p className="text-sm text-[#9C8578] mb-4">
            El propietario debe aprobar este acceso general; luego puedes solicitar mandatos por cada propiedad en Nuevo mandato.
          </p>
          <div className="grid gap-3">
            {permissions.map((permission) => {
              const permStatus = permissionStatusConfig[permission.status]
              return (
                <Card key={permission.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="flex items-center gap-2 font-semibold text-[#FAF6F2]">
                          <User className="h-4 w-4 shrink-0 text-[#9C8578]" />
                          <span className="truncate">{permission.landlord.name || permission.landlord.email}</span>
                        </span>
                        <span className="text-sm text-[#9C8578]">{permission.landlord.email}</span>
                        <Badge className={permStatus.badge}>{permStatus.label}</Badge>
                        <span className="flex items-center gap-1.5 text-xs text-[#9C8578]">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          Solicitado el {formatDate(permission.createdAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
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

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">Mandatos activos</p>
        {mandates.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#5E8B8C]/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-[#5E8B8C]/50" />
              </div>
              <h3 className="text-lg font-medium text-[#FAF6F2] mb-2">Aún no tienes mandatos activos</h3>
              <p className="text-sm text-[#9C8578] max-w-xl mx-auto mb-5">
                Para comenzar, solicita permiso general al propietario y luego crea una solicitud por cada propiedad que quieras administrar.
              </p>
              <div className="mb-5 space-y-1 text-sm text-[#9C8578] max-w-md mx-auto text-left">
                <p>1. Invita al propietario o busca su correo en el sistema.</p>
                <p>2. Espera su aprobación para quedar habilitado.</p>
                <p>3. Crea la solicitud de mandato de la propiedad.</p>
              </div>
              <Link href="/broker/mandatos/nuevo">
                <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear solicitud de mandato
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {mandates.map((mandate) => {
              const status = mandateStatus[mandate.status as keyof typeof mandateStatus]
              return (
                <Card key={mandate.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      <div className="flex-1 space-y-3 min-w-0">
                        <div>
                          <h3 className="text-lg font-semibold text-[#FAF6F2]">
                            {mandate.property.name || mandate.property.address}
                          </h3>
                          <div className="flex items-center gap-2 text-[#9C8578] text-sm mt-1">
                            <MapPin className="h-4 w-4 shrink-0" />
                            {mandate.property.commune}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#9C8578]">
                          <User className="h-4 w-4 shrink-0" />
                          <span>{mandate.owner.name || mandate.owner.email}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <span className="text-[#9C8578]">
                            Solicitud{' '}
                            <span className="inline-flex items-center gap-1 text-[#FAF6F2]">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(mandate.createdAt)}
                            </span>
                          </span>
                          {mandate.status === 'ACTIVE' && (
                            <span className="text-[#9C8578]">
                              Activado desde{' '}
                              <span className="inline-flex items-center gap-1 text-[#FAF6F2]">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(mandate.startsAt)}
                              </span>
                            </span>
                          )}
                          <span className="text-[#9C8578]">
                            Comisión{' '}
                            <span className="text-[#FAF6F2]">
                              {mandate.commissionRate != null
                                ? `${mandate.commissionRate}% (${mandate.commissionType === 'MONTHLY'
                                    ? 'Mensual'
                                    : mandate.commissionType === 'ONE_TIME'
                                      ? 'Única vez'
                                      : 'Anual'})`
                                : 'No definida'}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch lg:items-end gap-3 shrink-0">
                        <Badge className={status.badge}>
                          {mandateLabels[mandate.status] ?? status.label}
                        </Badge>

                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-[#FAF6F2] border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/10"
                          >
                            <Link href={`/mandatos/${mandate.id}/documento`}>
                              <FileText className="w-4 h-4 mr-2" />
                              Documento
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-[#FAF6F2] border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/10"
                          >
                            <a href={`/api/mandates/${mandate.id}/document?download=1`}>
                              <Download className="w-4 h-4 mr-2" />
                              PDF
                            </a>
                          </Button>
                          {mandate.status === 'ACTIVE' && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="text-[#FAF6F2] border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/10"
                            >
                              <Link href={`/mandatos/${mandate.id}/seguimiento`}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Seguimiento
                              </Link>
                            </Button>
                          )}
                          {mandate.status === 'ACTIVE' && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="text-[#FAF6F2] border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/10"
                            >
                              <Link href={`/broker/propiedades/${mandate.property.id}`}>
                                Ver Detalles
                              </Link>
                            </Button>
                          )}
                          {mandate.status === 'PENDING' && (
                            <Button
                              onClick={() => handleDeleteMandate(mandate.id)}
                              disabled={deletingMandateId === mandate.id}
                              variant="outline"
                              size="sm"
                              className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deletingMandateId === mandate.id ? 'Eliminando...' : 'Eliminar solicitud'}
                            </Button>
                          )}
                        </div>
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
