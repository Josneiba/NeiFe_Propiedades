'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Building2, Check, Loader2, User, UserX, X } from 'lucide-react'
import { PropertyAccessRequestsPanel } from '@/components/dashboard/property-access-requests-panel'

interface BrokerPermission {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  broker: {
    id: string
    name: string
    email: string
    company?: string
  }
}

interface PendingMandate {
  id: string
  status: 'PENDING'
  createdAt: string
  notes: string | null
  property: {
    id: string
    name: string | null
    address: string
  }
  broker: {
    id: string
    name: string | null
    email: string
    company: string | null
  }
}

export default function SolicitudesCorredoresPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [permissions, setPermissions] = useState<BrokerPermission[]>([])
  const [pendingMandates, setPendingMandates] = useState<PendingMandate[]>([])
  const [loading, setLoading] = useState(true)
  const [endingId, setEndingId] = useState<string | null>(null)
  const [processingMandateId, setProcessingMandateId] = useState<string | null>(null)
  const currentTab = searchParams.get('tab') === 'propiedades' ? 'propiedades' : 'corredores'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [permissionsResponse, mandatesResponse] = await Promise.all([
        fetch('/api/broker-permissions', { cache: 'no-store' }),
        fetch('/api/mandates?status=PENDING', { cache: 'no-store' }),
      ])

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        setPermissions(permissionsData.permissions || [])
      } else {
        setPermissions([])
      }

      if (mandatesResponse.ok) {
        const mandatesData = await mandatesResponse.json()
        setPendingMandates((mandatesData.mandates || []).filter(
          (mandate: PendingMandate) => mandate.status === 'PENDING'
        ))
      } else {
        setPendingMandates([])
      }
    } catch (error) {
      console.error('Error fetching broker requests:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/broker-permissions/${permissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        toast({
          title: 'Solicitud aprobada',
          description: 'El corredor ahora puede administrar tus propiedades.',
        })
        await fetchData()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo aprobar la solicitud.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión.',
      })
    }
  }

  const handleRevokeAccess = async (permissionId: string) => {
    if (
      !confirm(
        '¿Quitar acceso a este corredor? Se revocarán mandatos activos y solicitudes pendientes con él.'
      )
    ) {
      return
    }
    setEndingId(permissionId)
    try {
      const response = await fetch(`/api/broker-permissions/${permissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_partnership' }),
      })
      if (response.ok) {
        toast({
          title: 'Acceso revocado',
          description: 'El corredor ya no podrá administrar tus propiedades con este permiso.',
        })
        await fetchData()
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo revocar el acceso.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión.',
      })
    } finally {
      setEndingId(null)
    }
  }

  const handleReject = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/broker-permissions/${permissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        toast({
          title: 'Solicitud rechazada',
          description: 'La solicitud ha sido rechazada.',
        })
        await fetchData()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo rechazar la solicitud.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión.',
      })
    }
  }

  const handleApproveMandate = async (mandateId: string) => {
    setProcessingMandateId(mandateId)

    try {
      const response = await fetch(`/api/mandates/${mandateId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'owner' }),
      })

      if (response.ok) {
        toast({
          title: 'Solicitud aprobada',
          description: 'El corredor ya puede administrar esta propiedad.',
        })
        await fetchData()
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo aprobar la solicitud.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión.',
      })
    } finally {
      setProcessingMandateId(null)
    }
  }

  const handleRejectMandate = async (mandateId: string) => {
    setProcessingMandateId(mandateId)

    try {
      const response = await fetch(`/api/mandates/${mandateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      })

      if (response.ok) {
        toast({
          title: 'Solicitud rechazada',
          description: 'La solicitud de administración fue rechazada.',
        })
        await fetchData()
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo rechazar la solicitud.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión.',
      })
    } finally {
      setProcessingMandateId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-600">Aprobado</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rechazado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-2 border-[#9C8578] border-t-[#D5C3B6] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#FAF6F2]">Solicitudes de Corredores</h1>
        <p className="text-[#9C8578]">Gestiona permisos generales y accesos a propiedades específicas de tus corredores</p>
      </div>

      <Tabs key={currentTab} defaultValue={currentTab} className="w-full">
        <TabsList className="bg-[#2D3C3C] border border-[#D5C3B6]/10">
          <TabsTrigger value="propiedades">Acceso a propiedades</TabsTrigger>
          <TabsTrigger value="corredores">Permisos generales</TabsTrigger>
        </TabsList>

        <TabsContent value="propiedades" className="space-y-4">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-4 text-sm text-[#9C8578]">
              Aquí apruebas o rechazas cuando un corredor te pide administrar una propiedad puntual.
            </CardContent>
          </Card>

          {pendingMandates.length > 0 && (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-[#FAF6F2]">Solicitudes pendientes de administración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingMandates.map((mandate) => (
                  <div
                    key={mandate.id}
                    className="rounded-xl border border-[#D5C3B6]/10 bg-[#243131] p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#FAF6F2]">
                          <Building2 className="w-4 h-4 text-[#5E8B8C]" />
                          <span className="font-semibold">
                            {mandate.property.name || mandate.property.address}
                          </span>
                        </div>
                        <p className="text-sm text-[#9C8578]">{mandate.property.address}</p>
                        <p className="text-sm text-[#9C8578]">
                          Corredor: {mandate.broker.name || mandate.broker.email}
                        </p>
                        {mandate.broker.company && (
                          <p className="text-xs text-[#9C8578]">{mandate.broker.company}</p>
                        )}
                      </div>
                      <Badge variant="secondary">Pendiente</Badge>
                    </div>

                    {mandate.notes && (
                      <div className="rounded-lg bg-[#1E2A2A] p-3 text-sm text-[#D5C3B6]">
                        {mandate.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm text-[#9C8578]">
                        Solicitado el {formatDate(mandate.createdAt)}
                      </p>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button
                          onClick={() => handleRejectMandate(mandate.id)}
                          disabled={processingMandateId === mandate.id}
                          variant="outline"
                          size="sm"
                          className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                        >
                          {processingMandateId === mandate.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-2" />
                          )}
                          Rechazar
                        </Button>
                        <Button
                          onClick={() => handleApproveMandate(mandate.id)}
                          disabled={processingMandateId === mandate.id}
                          size="sm"
                          className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90"
                        >
                          {processingMandateId === mandate.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Aprobar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <PropertyAccessRequestsPanel
            showOnlyPending={false}
            hideWhenEmpty={pendingMandates.length > 0}
          />
        </TabsContent>

        <TabsContent value="corredores" className="space-y-4">
          {permissions.length === 0 ? (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-8 text-center">
                <User className="w-16 h-16 text-[#9C8578]/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#FAF6F2] mb-2">No hay solicitudes</h3>
                <p className="text-[#9C8578]">Cuando los corredores te envíen solicitudes de permiso general, aparecerán aquí.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {permissions.map((permission) => (
                <Card key={permission.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#5E8B8C]/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[#5E8B8C]" />
                        </div>
                        <div>
                          <CardTitle className="text-[#FAF6F2]">{permission.broker.name}</CardTitle>
                          <p className="text-sm text-[#9C8578]">{permission.broker.email}</p>
                          {permission.broker.company && (
                            <p className="text-xs text-[#9C8578]">{permission.broker.company}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(permission.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-[#9C8578]">
                        Solicitado el {formatDate(permission.createdAt)}
                      </div>
                      {permission.status === 'PENDING' && (
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button
                            onClick={() => handleReject(permission.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                          <Button
                            onClick={() => handleApprove(permission.id)}
                            size="sm"
                            className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Aprobar
                          </Button>
                        </div>
                      )}
                      {permission.status === 'APPROVED' && (
                        <Button
                          onClick={() => handleRevokeAccess(permission.id)}
                          disabled={endingId === permission.id}
                          variant="outline"
                          size="sm"
                          className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          {endingId === permission.id ? 'Quitando...' : 'Quitar acceso al corredor'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
