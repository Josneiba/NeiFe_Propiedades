'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Building2, Mail, Search, ArrowLeft } from 'lucide-react'
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

  const [formData, setFormData] = useState({
    propertyId: '',
    notes: '',
    startsAt: '',
    expiresAt: '',
  })
  const [submitting, setSubmitting] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!owner || !formData.propertyId) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/mandates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          ownerId: owner.id,
          notes: formData.notes || undefined,
          startsAt: formData.startsAt ? new Date(formData.startsAt) : undefined,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear mandato')
      }

      toast({
        title: 'Éxito',
        description: 'Solicitud enviada. El propietario recibirá una notificación para firmar.',
      })

      // Show success message for 3 seconds before redirecting
      setTimeout(() => {
        router.push('/broker/mandatos')
      }, 3000)
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
          <p className="text-[#9C8578]">Solicita administrar una propiedad</p>
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
                    }}
                    className="text-[#9C8578] hover:text-[#D5C3B6]"
                  >
                    Cambiar
                  </Button>
                </div>
              </div>

              {/* Property Selection */}
              <div>
                <Label htmlFor="property" className="text-[#FAF6F2]">
                  Propiedad *
                </Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, propertyId: value })
                  }
                >
                  <SelectTrigger
                    id="property"
                    className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2] mt-2"
                  >
                    <SelectValue placeholder="Selecciona una propiedad" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1917] border-[#D5C3B6]/10">
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#5E8B8C]" />
                          {prop.name || prop.address}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  disabled={submitting || !formData.propertyId}
                  className="flex-1 bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
                >
                  {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
