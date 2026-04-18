'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Check, X, User, UserX } from 'lucide-react'

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

export default function SolicitudesCorredoresPage() {
  const { toast } = useToast()
  const [permissions, setPermissions] = useState<BrokerPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [endingId, setEndingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/broker-permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
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
        fetchPermissions()
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
        fetchPermissions()
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
        fetchPermissions()
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
        <p className="text-[#9C8578]">Gestiona las solicitudes de corredores que quieren administrar tus propiedades</p>
      </div>

      {permissions.length === 0 ? (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-[#9C8578]/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#FAF6F2] mb-2">No hay solicitudes</h3>
            <p className="text-[#9C8578]">Cuando los corredores te envíen solicitudes para administrar tus propiedades, aparecerán aquí.</p>
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
                    Solicitado el {new Date(permission.createdAt).toLocaleDateString('es-ES')}
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
    </div>
  )
}