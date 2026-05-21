'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
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

interface PendingPropertyCreationRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  notes: string | null
  broker: {
    id: string
    name: string | null
    email: string
    company: string | null
  }
  property: {
    id: string
    name: string | null
    address: string
    commune: string
    region: string
    description: string | null
    bedrooms: number | null
    bathrooms: number | null
    squareMeters: number | null
    monthlyRentUF: number | null
    monthlyRentCLP: number | null
    contractStart: string | null
    contractEnd: string | null
    isActive: boolean
  }
}

export default function SolicitudesCorredoresPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [permissions, setPermissions] = useState<BrokerPermission[]>([])
  const [pendingMandates, setPendingMandates] = useState<PendingMandate[]>([])
  const [pendingPropertyCreations, setPendingPropertyCreations] = useState<PendingPropertyCreationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [endingId, setEndingId] = useState<string | null>(null)
  const [processingMandateId, setProcessingMandateId] = useState<string | null>(null)
  const [processingPropertyCreationId, setProcessingPropertyCreationId] = useState<string | null>(null)
  const currentTabParam = searchParams.get('tab')
  const currentTab =
    currentTabParam === 'propiedades'
      ? 'propiedades'
      : currentTabParam === 'altas'
        ? 'altas'
        : 'corredores'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [permissionsResponse, mandatesResponse, propertyCreationsResponse] = await Promise.all([
        fetch('/api/broker-permissions', { cache: 'no-store' }),
        fetch('/api/mandates?status=PENDING', { cache: 'no-store' }),
        fetch('/api/broker-property-requests?status=PENDING', { cache: 'no-store' }),
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

      if (propertyCreationsResponse.ok) {
        const propertyCreationsData = await propertyCreationsResponse.json()
        setPendingPropertyCreations((propertyCreationsData.requests || []).filter(
          (request: PendingPropertyCreationRequest) => request.status === 'PENDING'
        ))
      } else {
        setPendingPropertyCreations([])
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

  const handlePropertyCreationDecision = async (
    requestId: string,
    action: 'approve' | 'reject'
  ) => {
    setProcessingPropertyCreationId(requestId)

    try {
      const response = await fetch(`/api/broker-property-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast({
          title: action === 'approve' ? 'Propiedad aprobada' : 'Propiedad rechazada',
          description:
            action === 'approve'
              ? 'La propiedad quedó activa y el corredor ya puede administrarla.'
              : 'La propiedad quedó rechazada y no se activará.',
        })
        await fetchData()
      } else {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo procesar la alta de propiedad.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión.',
      })
    } finally {
      setProcessingPropertyCreationId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30">Pendiente</Badge>
      case 'APPROVED':
        return <Badge className="bg-[#5E8B8C]/15 text-[#5E8B8C] border border-[#5E8B8C]/30">Aprobado</Badge>
      case 'REJECTED':
        return <Badge className="bg-[#C27F79]/15 text-[#C27F79] border border-[#C27F79]/30">Rechazado</Badge>
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
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Solicitudes de corredores</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">Gestiona permisos generales y accesos a propiedades específicas de tus corredores</p>
      </div>

      <Tabs key={currentTab} defaultValue={currentTab} className="w-full">
        <TabsList className="bg-[#2D3C3C] border border-[#D5C3B6]/10">
          <TabsTrigger value="altas">Altas de propiedades</TabsTrigger>
          <TabsTrigger value="propiedades">Acceso a propiedades</TabsTrigger>
          <TabsTrigger value="corredores">Permisos generales</TabsTrigger>
        </TabsList>

        <TabsContent value="altas" className="space-y-4">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-4 text-sm text-[#9C8578]">
              Aquí revisas las propiedades que un corredor cargó directamente a tu nombre para que tú solo confirmes si autorizas su administración.
            </CardContent>
          </Card>

          {pendingPropertyCreations.length === 0 ? (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-10 text-center">
                <Building2 className="w-12 h-12 text-[#9C8578]/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#FAF6F2] mb-2">Sin altas pendientes</h3>
                <p className="text-sm text-[#9C8578]">
                  Cuando un corredor cargue una propiedad en tu nombre, aparecerá aquí para tu revisión.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPropertyCreations.map((requestRow) => (
                <Card key={requestRow.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 text-[#FAF6F2]">
                          <Building2 className="h-4 w-4 text-[#5E8B8C]" />
                          <span className="font-semibold">{requestRow.property.name || requestRow.property.address}</span>
                        </div>
                        <p className="text-sm text-[#9C8578]">{requestRow.property.address}</p>
                        <p className="text-sm text-[#9C8578]">
                          Corredor: {requestRow.broker.name || requestRow.broker.email}
                        </p>
                        {requestRow.broker.company ? (
                          <p className="text-xs text-[#9C8578]">{requestRow.broker.company}</p>
                        ) : null}
                      </div>
                      <Badge className="w-fit bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30">
                        Pendiente de aprobación
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#9C8578]">Ubicación</p>
                        <p className="mt-1 text-sm text-[#FAF6F2]">
                          {requestRow.property.commune}, {requestRow.property.region}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#9C8578]">Distribución</p>
                        <p className="mt-1 text-sm text-[#FAF6F2]">
                          {requestRow.property.bedrooms ?? 0}D / {requestRow.property.bathrooms ?? 0}B
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#9C8578]">Superficie</p>
                        <p className="mt-1 text-sm text-[#FAF6F2]">
                          {requestRow.property.squareMeters ? `${requestRow.property.squareMeters} m²` : 'Sin dato'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#9C8578]">Arriendo</p>
                        <p className="mt-1 text-sm text-[#FAF6F2]">
                          {requestRow.property.monthlyRentCLP
                            ? `$${requestRow.property.monthlyRentCLP.toLocaleString('es-CL')}`
                            : requestRow.property.monthlyRentUF
                              ? `UF ${requestRow.property.monthlyRentUF}`
                              : 'Sin renta'}
                        </p>
                      </div>
                    </div>

                    {requestRow.property.description ? (
                      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-[#B8965A]">Descripción cargada por el corredor</p>
                        <p className="mt-2 text-sm text-[#D5C3B6]">{requestRow.property.description}</p>
                      </div>
                    ) : null}

                    {requestRow.notes ? (
                      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-[#B8965A]">Notas del corredor</p>
                        <p className="mt-2 text-sm text-[#D5C3B6]">{requestRow.notes}</p>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm text-[#9C8578]">
                        Cargado el {formatDate(requestRow.createdAt)}
                      </p>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button
                          onClick={() => handlePropertyCreationDecision(requestRow.id, 'reject')}
                          disabled={processingPropertyCreationId === requestRow.id}
                          variant="outline"
                          size="sm"
                          className="border-red-600/30 text-red-600 hover:bg-red-600/10"
                        >
                          {processingPropertyCreationId === requestRow.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-2" />
                          )}
                          Rechazar
                        </Button>
                        <Button
                          onClick={() => handlePropertyCreationDecision(requestRow.id, 'approve')}
                          disabled={processingPropertyCreationId === requestRow.id}
                          size="sm"
                          className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90"
                        >
                          {processingPropertyCreationId === requestRow.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Aprobar y activar administración
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="propiedades" className="space-y-4">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-4 text-sm text-[#9C8578]">
              Aquí apruebas o rechazas cuando un corredor te pide administrar una propiedad puntual.
            </CardContent>
          </Card>

          {pendingMandates.length > 0 && (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">Solicitudes pendientes de administración</p>
                <div className="space-y-3">
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
                      <div className="rounded-lg bg-[#1C1917]/60 border border-[#D5C3B6]/10 p-3 text-sm text-[#D5C3B6]">
                        {mandate.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm text-[#9C8578]">
                        Solicitado el {formatDate(mandate.createdAt)}
                      </p>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button asChild variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#FAF6F2]">
                          <Link href={`/mandatos/${mandate.id}/documento`}>
                            Ver documento
                          </Link>
                        </Button>
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
              </div>
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
              <CardContent className="p-10 text-center">
                <User className="w-12 h-12 text-[#9C8578]/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#FAF6F2] mb-2">No hay solicitudes</h3>
                <p className="text-sm text-[#9C8578]">Cuando los corredores te envíen solicitudes de permiso general, aparecerán aquí.</p>
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
