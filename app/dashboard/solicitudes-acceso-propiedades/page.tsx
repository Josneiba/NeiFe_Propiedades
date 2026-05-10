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
  MessageSquare,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

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

export default function PropertyAccessRequestsPage() {
  const [requests, setRequests] = useState<PropertyAccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast: hookToast } = useToast()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const response = await fetch("/api/property-access-requests")
      if (!response.ok) throw new Error("Error al cargar solicitudes")
      
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Error loading requests:", error)
      hookToast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de acceso",
        variant: "destructive"
      })
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
          <Badge className="bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30 gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge className="bg-[#5E8B8C]/15 text-[#5E8B8C] border border-[#5E8B8C]/30 gap-1">
            <Check className="h-3 w-3" />
            Aprobada
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-[#C27F79]/15 text-[#C27F79] border border-[#C27F79]/30 gap-1">
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

  const pendingRequests = requests.filter(r => r.status === 'PENDING')
  const processedRequests = requests.filter(r => r.status !== 'PENDING')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-[#FAF6F2]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Solicitudes de acceso</h1>
          <p className="text-sm text-[#9C8578] mt-0.5">
            Corredores que han solicitado acceso a tus propiedades
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-[#F2C94C]" />
              <div>
                <p className="text-xl font-semibold text-[#FAF6F2]">{pendingRequests.length}</p>
                <p className="text-xs text-[#9C8578]">Solicitudes pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-[#5E8B8C]" />
              <div>
                <p className="text-xl font-semibold text-[#FAF6F2]">
                  {requests.filter(r => r.status === 'APPROVED').length}
                </p>
                <p className="text-xs text-[#9C8578]">Aprobadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <X className="h-5 w-5 text-[#C27F79]" />
              <div>
                <p className="text-xl font-semibold text-[#FAF6F2]">
                  {requests.filter(r => r.status === 'REJECTED').length}
                </p>
                <p className="text-xs text-[#9C8578]">Rechazadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Solicitudes pendientes</p>
            <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="border border-[#D5C3B6]/10 rounded-lg p-4 space-y-4 hover:bg-[#D5C3B6]/5 transition-colors"
              >
                {/* Header with status and date */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#5E8B8C]/20 text-[#5E8B8C]">
                        {request.broker.name?.substring(0, 2).toUpperCase() || 
                         request.broker.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-[#FAF6F2]">
                        {request.broker.name || request.broker.email}
                      </p>
                      {request.broker.company && (
                        <p className="text-sm text-[#9C8578]">{request.broker.company}</p>
                      )}
                      <p className="text-xs text-[#9C8578]">{request.broker.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(request.status)}
                    <p className="text-xs text-[#9C8578]">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Property info */}
                <div className="flex items-center gap-2 text-xs text-[#9C8578] bg-[#1C1917]/60 border border-[#D5C3B6]/10 rounded-lg px-3 py-2">
                  <Building2 className="h-4 w-4" />
                  <span>{request.property.name || request.property.address}</span>
                  <MapPin className="h-4 w-4" />
                  <span>{request.property.commune}</span>
                </div>

                {/* Message */}
                {request.message && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#FAF6F2]">
                      <MessageSquare className="h-4 w-4" />
                      Mensaje del corredor:
                    </div>
                    <div className="bg-[#1C1917]/60 border border-[#D5C3B6]/10 p-3 rounded text-sm text-[#9C8578]">
                      {request.message}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
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
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Historial de solicitudes</p>
            <div className="space-y-4">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className="border border-[#D5C3B6]/10 rounded-lg p-4 space-y-4 opacity-75"
              >
                {/* Header with status and date */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#5E8B8C]/20 text-[#5E8B8C]">
                        {request.broker.name?.substring(0, 2).toUpperCase() || 
                         request.broker.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-[#FAF6F2]">
                        {request.broker.name || request.broker.email}
                      </p>
                      {request.broker.company && (
                        <p className="text-sm text-[#9C8578]">{request.broker.company}</p>
                      )}
                      <p className="text-xs text-[#9C8578]">{request.broker.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(request.status)}
                    <p className="text-xs text-[#9C8578]">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Property info */}
                <div className="flex items-center gap-2 text-xs text-[#9C8578] bg-[#1C1917]/60 border border-[#D5C3B6]/10 rounded-lg px-3 py-2">
                  <Building2 className="h-4 w-4" />
                  <span>{request.property.name || request.property.address}</span>
                  <MapPin className="h-4 w-4" />
                  <span>{request.property.commune}</span>
                </div>

                {/* Processing info */}
                <div className="text-sm text-[#9C8578] pt-2 border-t border-[#D5C3B6]/10">
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
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {requests.length === 0 && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="text-center p-10">
            <UserPlus className="h-10 w-10 mx-auto mb-4 text-[#9C8578]/40" />
            <h3 className="text-base font-medium text-[#FAF6F2] mb-2">No hay solicitudes de acceso</h3>
            <p className="text-sm text-[#9C8578]">
              Los corredores pueden solicitar acceso a tus propiedades desde la página de detalles de cada propiedad.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
