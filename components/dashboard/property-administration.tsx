'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  User,
  Loader2,
} from 'lucide-react'

interface Mandate {
  id: string
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  ownerSignedAt?: string
  property: {
    id: string
    managedBy: string | null
  }
  broker: {
    name: string | null
    email: string
    company?: string | null
  }
}

interface Broker {
  id: string
  name: string | null
  email: string
  company?: string | null
}

export function AdministrationSection({ propertyId }: { propertyId: string }) {
  const { toast } = useToast()
  const [mandates, setMandates] = useState<Mandate[]>([])
  const [loading, setLoading] = useState(true)
  const [brokerEmail, setBrokerEmail] = useState('')
  const [broker, setBroker] = useState<Broker | null>(null)
  const [searchingBroker, setSearchingBroker] = useState(false)

  useEffect(() => {
    const fetchMandates = async () => {
      try {
        const response = await fetch(`/api/mandates?propertyId=${propertyId}`)
        if (response.ok) {
          const data = await response.json()
          setMandates(data.mandates || [])
        }
      } catch (err) {
        console.error('Error fetching mandates:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMandates()
  }, [propertyId])

  const handleSearchBroker = async () => {
    if (!brokerEmail.trim()) return

    setSearchingBroker(true)
    try {
      const response = await fetch(
        `/api/users?email=${encodeURIComponent(brokerEmail)}`
      )
      if (!response.ok) {
        throw new Error('Corredor no encontrado')
      }
      const data = await response.json()
      setBroker(data.user)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Corredor no encontrado',
      })
      setBroker(null)
    } finally {
      setSearchingBroker(false)
    }
  }

  const handleDelegateToBroker = async () => {
    if (!broker) return

    try {
      const response = await fetch('/api/mandates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ownerId: undefined, // Backend uses session
          brokerId: broker.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear mandato')
      }

      toast({
        title: 'Éxito',
        description: 'Solicitud enviada al corredor.',
      })

      setBroker(null)
      setBrokerEmail('')

      // Refresh mandates
      const mandatesRes = await fetch(
        `/api/mandates?propertyId=${propertyId}`
      )
      if (mandatesRes.ok) {
        const mandatesData = await mandatesRes.json()
        setMandates(mandatesData.mandates || [])
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  const handleRevokeMandate = async (mandateId: string) => {
    if (!confirm('¿Estás seguro de que deseas revocar este mandato?'))
      return

    try {
      const response = await fetch(`/api/mandates/${mandateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al revocar mandato')
      }

      toast({
        title: 'Éxito',
        description: 'Mandato revocado.',
      })

      // Refresh mandates
      const mandatesRes = await fetch(
        `/api/mandates?propertyId=${propertyId}`
      )
      if (mandatesRes.ok) {
        const mandatesData = await mandatesRes.json()
        setMandates(mandatesData.mandates || [])
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  const handleSignMandate = async (mandateId: string) => {
    try {
      const response = await fetch(`/api/mandates/${mandateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign', role: 'owner' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al firmar mandato')
      }

      toast({
        title: 'Éxito',
        description: 'Mandato activado. El corredor ahora administra esta propiedad.',
      })

      // Refresh mandates
      const mandatesRes = await fetch(
        `/api/mandates?propertyId=${propertyId}`
      )
      if (mandatesRes.ok) {
        const mandatesData = await mandatesRes.json()
        setMandates(mandatesData.mandates || [])
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  const activateMandate = mandates.find((m) => m.status === 'PENDING')
  const hasActiveBroker = mandates.some((m) => m.status === 'ACTIVE')
  const brokerInfo = mandates.find((m) => m.status === 'ACTIVE')?.broker

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Mandate Alert */}
      {activateMandate && (
        <Card className="bg-[#F2C94C]/10 border-[#F2C94C]/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-[#F2C94C] shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-[#FAF6F2]">
                  Solicitud Pendiente de Firma
                </h3>
                <p className="text-sm text-[#9C8578] mt-1">
                  El corredor <strong>{activateMandate.broker.name || activateMandate.broker.email}</strong> solicita
                  administrar esta propiedad.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleSignMandate(activateMandate.id)}
                    className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceptar y Firmar
                  </Button>
                  <Button
                    onClick={() => handleRevokeMandate(activateMandate.id)}
                    variant="outline"
                    className="text-[#C27F79] border-[#C27F79]/30 hover:bg-[#C27F79]/10"
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Status */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Estado de Administración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasActiveBroker && brokerInfo ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#5E8B8C]/10 border border-[#5E8B8C]/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#9C8578]">Administrador</p>
                    <p className="font-semibold text-[#FAF6F2] mt-1">
                      {brokerInfo.name || brokerInfo.email}
                    </p>
                    {brokerInfo.company && (
                      <p className="text-sm text-[#9C8578] mt-1">
                        {brokerInfo.company}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-[#5E8B8C] text-[#FAF6F2]">
                    Activo
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() =>
                  mandates[0] && handleRevokeMandate(mandates[0].id)
                }
                variant="outline"
                className="w-full text-[#C27F79] border-[#C27F79]/30 hover:bg-[#C27F79]/10"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Revocar Mandato
              </Button>
            </div>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                  <User className="h-4 w-4 mr-2" />
                  Delegar a un Corredor
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <DialogHeader>
                  <DialogTitle className="text-[#FAF6F2]">
                    Delegar Administración
                  </DialogTitle>
                  <DialogDescription className="text-[#9C8578]">
                    Busca un corredor para que administre tu propiedad.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="broker-email" className="text-[#FAF6F2]">
                      Email del Corredor
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="broker-email"
                        type="email"
                        placeholder="corredor@example.com"
                        value={brokerEmail}
                        onChange={(e) => setBrokerEmail(e.target.value)}
                        className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
                      />
                      <Button
                        onClick={handleSearchBroker}
                        disabled={
                          searchingBroker || !brokerEmail.trim()
                        }
                        className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] shrink-0"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {broker && (
                    <div className="p-4 rounded-lg bg-[#5E8B8C]/10 border border-[#5E8B8C]/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-[#9C8578]">Corredor</p>
                          <p className="font-semibold text-[#FAF6F2] mt-1">
                            {broker.name || broker.email}
                          </p>
                          {broker.company && (
                            <p className="text-sm text-[#9C8578] mt-1">
                              {broker.company}
                            </p>
                          )}
                        </div>
                        <CheckCircle className="h-6 w-6 text-[#5E8B8C]" />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleDelegateToBroker}
                    disabled={!broker}
                    className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
                  >
                    Enviar Solicitud
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Mandate History */}
      {mandates.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Historial de Mandatos</CardTitle>
            <CardDescription>Todos los mandatos asociados a esta propiedad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mandates.map((mandate) => (
                <div
                  key={mandate.id}
                  className="p-4 rounded-lg bg-muted border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {mandate.broker.name || mandate.broker.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {mandate.broker.company && `${mandate.broker.company} - `}
                        Desde {new Date(mandate.createdAt).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <Badge
                      className={
                        mandate.status === 'ACTIVE'
                          ? 'bg-[#5E8B8C] text-white'
                          : mandate.status === 'PENDING'
                            ? 'bg-[#F2C94C] text-black'
                            : mandate.status === 'REVOKED'
                              ? 'bg-[#C27F79] text-white'
                              : 'bg-muted-foreground text-white'
                      }
                    >
                      {mandate.status === 'ACTIVE'
                        ? 'Activo'
                        : mandate.status === 'PENDING'
                          ? 'Pendiente'
                          : mandate.status === 'REVOKED'
                            ? 'Revocado'
                            : 'Expirado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
