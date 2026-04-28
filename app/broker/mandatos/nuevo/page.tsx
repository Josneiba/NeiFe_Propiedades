'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Building2, Mail, Search, ArrowLeft, Copy } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

interface Property {
  id: string
  name: string | null
  address: string
  commune: string
}

interface Owner {
  id: string
  name: string | null
  email: string
}

export default function NuevoMandatoPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<'search' | 'form'>('search')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [owner, setOwner] = useState<Owner | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'NONE' | 'PENDING' | 'REJECTED' | 'APPROVED'>('NONE')
  const [requestingPermission, setRequestingPermission] = useState(false)

  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    notes: '',
    startsAt: '',
    expiresAt: '',
    commissionRate: '',
    commissionType: 'MONTHLY',
  })
  const [submitting, setSubmitting] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  // Pre-llenar email si viene de una notificación
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const email = searchParams.get('email')
    if (email) {
      setOwnerEmail(email)
      // Buscar automáticamente si hay email
      handleSearchOwnerFromParam(email)
    }
  }, [])

  const handleSearchOwnerFromParam = async (email: string) => {
    setLoading(true)
    setSearchError(null)

    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`)
      if (!response.ok) {
        setSearchError('El propietario no tiene cuenta en NeiFe')
        setOwner(null)
        setProperties([])
        setLoading(false)
        return
      }

      const userData = await response.json()
      setOwner(userData.user)

      setPermissionStatus('NONE')
      // Verificar estado de permiso del corredor con este propietario
      const permissionResponse = await fetch(`/api/broker-permissions/check?landlordId=${userData.user.id}`)
      if (permissionResponse.ok) {
        const permissionData = await permissionResponse.json()
        setPermissionStatus(permissionData.status || 'NONE')
        if (!permissionData.hasPermission) {
          setSearchError('Aún no tienes permiso aprobado para administrar las propiedades de este propietario.')
          setProperties([])
          setLoading(false)
          return
        }
      }

      // Get properties for this owner
      const propsResponse = await fetch(`/api/properties?ownerId=${userData.user.id}`)
      if (!propsResponse.ok) {
        throw new Error('Error al obtener propiedades')
      }

      const propsData = await propsResponse.json()
      const availableProps = propsData.properties.filter(
        (p: any) => !p.mandates?.some((m: any) => m.status === 'ACTIVE')
      )

      setProperties(availableProps)
      setSelectedPropertyIds([])
      if (availableProps.length > 0) {
        setStep('form')
      } else {
        setSearchError('Este propietario no tiene propiedades disponibles para administrar')
      }
    } catch (err) {
      setSearchError('Error al buscar propietario')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownerEmail.trim()) return

    setLoading(true)
    setSearchError(null)

    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(ownerEmail)}`)
      if (!response.ok) {
        setSearchError('El propietario no tiene cuenta en NeiFe')
        setOwner(null)
        setProperties([])
        setLoading(false)
        return
      }

      const userData = await response.json()
      setOwner(userData.user)

      setPermissionStatus('NONE')
      // Verificar estado de permiso del corredor con este propietario
      const permissionResponse = await fetch(`/api/broker-permissions/check?landlordId=${userData.user.id}`)
      if (permissionResponse.ok) {
        const permissionData = await permissionResponse.json()
        setPermissionStatus(permissionData.status || 'NONE')
        if (!permissionData.hasPermission) {
          setSearchError('Aún no tienes permiso aprobado para administrar las propiedades de este propietario.')
          setProperties([])
          setLoading(false)
          return
        }
      }

      // Get properties for this owner
      const propsResponse = await fetch(`/api/properties?ownerId=${userData.user.id}`)
      if (!propsResponse.ok) {
        throw new Error('Error al obtener propiedades')
      }

      const propsData = await propsResponse.json()
      const availableProps = propsData.properties.filter(
        (p: any) => !p.mandates?.some((m: any) => m.status === 'ACTIVE')
      )

      setProperties(availableProps)
      setSelectedPropertyIds([])
      if (availableProps.length > 0) {
        setStep('form')
      } else {
        setSearchError('Este propietario no tiene propiedades disponibles para administrar')
      }
    } catch (err) {
      setSearchError('Error al buscar propietario')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleProperty = (id: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllAvailable = () => {
    setSelectedPropertyIds(properties.map((p) => p.id))
  }

  const clearSelection = () => setSelectedPropertyIds([])

  const handleRequestPermission = async () => {
    if (!owner) return
    setRequestingPermission(true)
    try {
      const response = await fetch('/api/broker-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId: owner.id }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo enviar la solicitud de permiso',
        })
        return
      }

      setPermissionStatus('PENDING')
      toast({
        title: 'Solicitud enviada',
        description: 'El propietario recibió una notificación para aprobar tu acceso.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error de conexión al enviar la solicitud',
      })
    } finally {
      setRequestingPermission(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!owner || selectedPropertyIds.length === 0) return

    setSubmitting(true)

    const bodyBase = {
      ownerId: owner.id,
      notes: formData.notes || undefined,
      startsAt: formData.startsAt ? new Date(formData.startsAt) : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
      commissionRate: formData.commissionRate ? Number(formData.commissionRate) : undefined,
      commissionType: formData.commissionType || undefined,
    }

    try {
      const results = await Promise.allSettled(
        selectedPropertyIds.map((propertyId) =>
          fetch('/api/mandates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...bodyBase, propertyId }),
          }).then(async (res) => {
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
              throw new Error(data.error || `Error en propiedad ${propertyId}`)
            }
            return data
          })
        )
      )

      const failed = results.filter((r) => r.status === 'rejected')
      const ok = results.length - failed.length

      if (ok === 0) {
        const first = failed[0]
        const msg =
          first?.status === 'rejected' ? first.reason?.message || 'Error' : 'Error'
        throw new Error(msg)
      }

      if (failed.length === 0) {
        toast({
          title: 'Éxito',
          description: `Se enviaron ${ok} solicitud${ok !== 1 ? 'es' : ''}. El propietario recibirá notificaciones para firmar.`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: ok > 0 ? 'Parcialmente enviado' : 'Error',
          description: `Se enviaron ${ok} solicitud${ok !== 1 ? 'es' : ''}. ${failed.length} no se pudieron crear (p. ej. ya hay mandato pendiente o activo).`,
        })
      }

      setTimeout(() => {
        router.push('/broker/mandatos')
      }, failed.length > 0 ? 500 : 2000)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendInvite = async () => {
    if (!ownerEmail.trim()) return

    setSendingInvite(true)
    setInviteUrl(null)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BROKER_INVITE',
          email: ownerEmail.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo enviar la invitación',
          variant: 'destructive',
        })
        return
      }

      const url = data.inviteUrl || `${window.location.origin}/invitacion/${data.invitation?.token || data.token}`
      setInviteUrl(url)

      if (data.emailSent) {
        toast({
          title: 'Invitación enviada',
          description: 'Correo enviado. Revisa spam si no aparece.',
        })
      } else {
        toast({
          title: 'Invitación creada — correo no enviado',
          description: data.warning || 'Revisa Resend y RESEND_FROM, o copia el enlace de abajo.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      })
    } finally {
      setSendingInvite(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/broker/mandatos">
          <Button variant="ghost" size="icon" className="text-[#9C8578] hover:text-[#D5C3B6]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#FAF6F2]">Nueva Solicitud</h1>
          <p className="text-[#9C8578]">
            Permiso del propietario y luego elige una o más propiedades para administrar
          </p>
        </div>
      </div>

      {/* Search Owner */}
      {step === 'search' && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-6">
            <form onSubmit={handleSearchOwner} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-[#FAF6F2]">
                  Email del Propietario
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="propietario@example.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !ownerEmail.trim()}
                    className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] shrink-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {searchError && (
                <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/30">
                  <p className="text-red-600 text-sm">{searchError}</p>
                  {owner && permissionStatus !== 'APPROVED' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-[#9C8578]">
                        {permissionStatus === 'PENDING'
                          ? 'Ya enviaste una solicitud. Espera la aprobación del propietario.'
                          : permissionStatus === 'REJECTED'
                            ? 'Tu solicitud anterior fue rechazada. Puedes enviar una nueva solicitud.'
                            : 'Primero debes solicitar autorización a este propietario.'}
                      </p>
                      {permissionStatus !== 'PENDING' && (
                        <Button
                          onClick={handleRequestPermission}
                          disabled={requestingPermission}
                          size="sm"
                          className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
                        >
                          {requestingPermission ? 'Enviando...' : 'Solicitar Permiso'}
                        </Button>
                      )}
                    </div>
                  )}
                  {searchError === 'El propietario no tiene cuenta en NeiFe' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-[#9C8578]">
                        Puedes enviar una invitación para que se registre y luego administres sus propiedades.
                      </p>
                      <Button
                        onClick={handleSendInvite}
                        disabled={sendingInvite}
                        size="sm"
                        className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
                      >
                        {sendingInvite ? (
                          <>Enviando...</>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Invitación
                          </>
                        )}
                      </Button>
                      {inviteUrl && (
                        <div className="mt-2 p-2 bg-[#1C1917] rounded border text-xs">
                          <p className="text-[#FAF6F2] mb-1">Enlace de invitación:</p>
                          <div className="flex gap-2">
                            <Input
                              value={inviteUrl}
                              readOnly
                              className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2] text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(inviteUrl)
                                toast({ title: 'Enlace copiado' })
                              }}
                              className="border-[#D5C3B6]/10 text-[#FAF6F2] hover:bg-[#D5C3B6]/10"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {owner && properties.length > 0 && (
                <div className="p-4 rounded-lg bg-[#5E8B8C]/10 border border-[#5E8B8C]/30">
                  <p className="text-sm text-[#FAF6F2]">
                    ✓ Propietario encontrado: <strong>{owner.name || owner.email}</strong>
                  </p>
                  <p className="text-xs text-[#9C8578] mt-1">
                    {properties.length} propiedad{properties.length !== 1 ? 'es' : ''} disponible{properties.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {step === 'form' && owner && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Owner Info */}
              <div className="p-4 rounded-lg bg-[#5E8B8C]/10 border border-[#5E8B8C]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#9C8578]">Propietario</p>
                    <p className="text-[#FAF6F2] font-medium">{owner.name || owner.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep('search')
                      setOwner(null)
                      setProperties([])
                      setSelectedPropertyIds([])
                    }}
                    className="text-[#9C8578] hover:text-[#D5C3B6]"
                  >
                    Cambiar
                  </Button>
                </div>
              </div>

              {/* Property Selection (multiple) */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Label className="text-[#FAF6F2]">Propiedades a administrar *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllAvailable}
                      className="text-xs border-[#D5C3B6]/10 text-[#FAF6F2]"
                    >
                      Todas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="text-xs border-[#D5C3B6]/10 text-[#FAF6F2]"
                    >
                      Ninguna
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-[#9C8578] mt-1 mb-3">
                  Se enviará una solicitud de mandato por cada propiedad seleccionada. El propietario debe aprobar cada una.
                </p>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917] divide-y divide-[#D5C3B6]/10">
                  {properties.map((prop) => (
                    <label
                      key={prop.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#2D3C3C]/50"
                    >
                      <Checkbox
                        checked={selectedPropertyIds.includes(prop.id)}
                        onCheckedChange={() => toggleProperty(prop.id)}
                      />
                      <Building2 className="h-4 w-4 text-[#5E8B8C] shrink-0" />
                      <span className="text-sm text-[#FAF6F2]">
                        {prop.name || prop.address}
                        <span className="text-[#9C8578] text-xs block">{prop.commune}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {selectedPropertyIds.length > 0 && (
                  <p className="text-xs text-[#5E8B8C] mt-2">
                    {selectedPropertyIds.length} propiedad{selectedPropertyIds.length !== 1 ? 'es' : ''} seleccionada
                    {selectedPropertyIds.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-[#FAF6F2]">
                  Notas (Opcional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Información adicional para el propietario..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2] mt-2"
                  rows={4}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="starts" className="text-[#FAF6F2]">
                    Fecha de Inicio (Opcional)
                  </Label>
                  <Input
                    id="starts"
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) =>
                      setFormData({ ...formData, startsAt: e.target.value })
                    }
                    className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2] mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="expires" className="text-[#FAF6F2]">
                    Fecha de Término (Opcional)
                  </Label>
                  <Input
                    id="expires"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                    className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2] mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commissionRate" className="text-[#FAF6F2]">
                    Comisión del mandato (%)
                  </Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Ej: 8"
                    value={formData.commissionRate}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionRate: e.target.value })
                    }
                    className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2] mt-2"
                  />
                  <p className="mt-1 text-xs text-[#9C8578]">
                    Se usará como base en las rendiciones mensuales del corredor.
                  </p>
                </div>
                <div>
                  <Label htmlFor="commissionType" className="text-[#FAF6F2]">
                    Tipo de comisión
                  </Label>
                  <select
                    id="commissionType"
                    value={formData.commissionType}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionType: e.target.value })
                    }
                    className="mt-2 w-full rounded-md border border-[#D5C3B6]/10 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
                  >
                    <option value="MONTHLY">Mensual</option>
                    <option value="ONE_TIME">Única vez</option>
                    <option value="ANNUAL">Anual</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('search')}
                  className="flex-1 text-[#FAF6F2] border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/10"
                >
                  Atrás
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || selectedPropertyIds.length === 0}
                  className="flex-1 bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
                >
                  {submitting ? 'Enviando...' : `Enviar solicitud${selectedPropertyIds.length > 1 ? 'es' : ''}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
