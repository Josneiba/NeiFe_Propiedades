"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Building2,
  Loader2,
  MessageSquare
} from "lucide-react"

interface PropertyAccessRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  message: string | null
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  property: {
    id: string
    name: string | null
    address: string
    commune: string
  }
  broker: {
    id: string
    name: string | null
    email: string
    company: string | null
  }
}

interface PropertyAccessRequestsPanelProps {
  landlordId?: string
  propertyId?: string
  showOnlyPending?: boolean
  hideWhenEmpty?: boolean
}

export function PropertyAccessRequestsPanel({ 
  landlordId, 
  propertyId,
  showOnlyPending = false,
  hideWhenEmpty = false,
}: PropertyAccessRequestsPanelProps) {
  const [requests, setRequests] = useState<PropertyAccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [propertyId])

  const loadRequests = async () => {
    try {
      const url = propertyId 
        ? `/api/property-access-requests?propertyId=${propertyId}`
        : "/api/property-access-requests"
      
      const response = await fetch(url, { cache: "no-store" })
      if (!response.ok) throw new Error("Error al cargar solicitudes")
      
      const data = await response.json()
      let filteredRequests = data.requests || []
      
      if (showOnlyPending) {
        filteredRequests = filteredRequests.filter((r: PropertyAccessRequest) => r.status === 'PENDING')
      }
      
      setRequests(filteredRequests)
    } catch (error) {
      console.error("Error loading requests:", error)
      toast.error("Error al cargar solicitudes de acceso")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId)

    try {
      const response = await fetch(`/api/property-access-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al procesar solicitud")
      }

      toast.success(`Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`)
      loadRequests() // Refresh the list
    } catch (error) {
      console.error("Error processing request:", error)
      toast.error(error instanceof Error ? error.message : "Error al procesar solicitud")
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <Check className="h-3 w-3" />
            Aprobada
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
            <X className="h-3 w-3" />
            Rechazada
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {propertyId ? "Solicitudes de esta Propiedad" : "Solicitudes de Acceso"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0 && hideWhenEmpty) {
    return null
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {propertyId ? "Solicitudes de esta Propiedad" : "Solicitudes de Acceso"}
          </CardTitle>
          <CardDescription>
            {propertyId 
              ? (showOnlyPending 
                ? "No hay solicitudes pendientes para esta propiedad"
                : "No hay solicitudes registradas para esta propiedad")
              : (showOnlyPending 
                ? "No hay solicitudes pendientes de acceso a propiedades"
                : "No hay solicitudes de acceso a propiedades")
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {propertyId 
                ? (showOnlyPending 
                  ? "No tienes solicitudes pendientes para esta propiedad"
                  : "No hay solicitudes registradas para esta propiedad")
                : (showOnlyPending 
                  ? "No tienes solicitudes pendientes para revisar"
                  : "No tienes solicitudes de acceso registradas")
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {propertyId ? "Solicitudes de esta Propiedad" : "Solicitudes de Acceso"}
        </CardTitle>
        <CardDescription>
          {propertyId 
            ? (showOnlyPending 
              ? "Solicitudes pendientes para esta propiedad"
              : "Historial de solicitudes para esta propiedad")
            : (showOnlyPending 
              ? "Solicitudes pendientes de aprobación"
              : "Historial de solicitudes de acceso a tus propiedades")
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="border rounded-lg p-4 space-y-4 hover:bg-muted/50 transition-colors"
          >
            {/* Header with status and date */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#5E8B8C] text-white">
                    {request.broker.name?.substring(0, 2).toUpperCase() || 
                     request.broker.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {request.broker.name || request.broker.email}
                  </p>
                  {request.broker.company && (
                    <p className="text-sm text-muted-foreground">{request.broker.company}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{request.broker.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(request.status)}
                <p className="text-xs text-muted-foreground">
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </div>

            {/* Property info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
              <Building2 className="h-4 w-4" />
              <span>{request.property.name || request.property.address}</span>
              <MapPin className="h-4 w-4" />
              <span>{request.property.commune}</span>
            </div>

            {/* Message */}
            {request.message && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Mensaje del corredor:
                </div>
                <div className="bg-muted p-3 rounded text-sm">
                  {request.message}
                </div>
              </div>
            )}

            {/* Action buttons for pending requests */}
            {request.status === 'PENDING' && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => handleAction(request.id, 'approve')}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleAction(request.id, 'reject')}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Rechazar
                </Button>
              </div>
            )}

            {/* Approval/Rejection info */}
            {(request.status === 'APPROVED' || request.status === 'REJECTED') && (
              <div className="text-sm text-muted-foreground pt-2 border-t">
                {request.status === 'APPROVED' ? (
                  <p>Se aprobó el acceso y se creó un mandato automáticamente</p>
                ) : (
                  <p>La solicitud fue rechazada</p>
                )}
                {(request.approvedAt || request.rejectedAt) && (
                  <p className="text-xs">
                    Procesado el {formatDate(request.approvedAt || request.rejectedAt!)}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
