'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { getRegions, getCommunesByRegion } from '@/lib/chile-regions'

interface Property {
  id: string
  name: string
  address: string
  commune: string
  region: string
  description: string
  bedrooms?: number
  bathrooms?: number
  squareMeters?: number
  monthlyRentCLP?: number
  monthlyRentUF?: number
  contractStart?: string
  contractEnd?: string
  lat?: number | null
  lng?: number | null
}

interface FormData {
  name: string
  address: string
  commune: string
  region: string
  description: string
  bedrooms: string
  bathrooms: string
  squareMeters: string
  monthlyRentCLP: string
  monthlyRentUF: string
  contractStart: string
  contractEnd: string
  lat: string
  lng: string
}

export default function EditarPropiedad() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [error, setError] = useState<string | null>(null)
  const regions = getRegions()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    commune: '',
    region: 'Región Metropolitana de Santiago (XIII)',
    description: '',
    bedrooms: '',
    bathrooms: '',
    squareMeters: '',
    monthlyRentCLP: '',
    monthlyRentUF: '',
    contractStart: '',
    contractEnd: '',
    lat: '',
    lng: '',
  })

  const currentCommunas = getCommunesByRegion(formData.region)
  const toNumber = (value: string) => {
    if (value === '' || value === null || typeof value === 'undefined') return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }

  // Load property data
  useEffect(() => {
    const loadProperty = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}`)
        if (!res.ok) throw new Error('Failed to load property')
        const json = await res.json()
        const data = json.property
        if (!data) throw new Error('Failed to load property')
        setProperty(data)
        
        setFormData({
          name: data.name || '',
          address: data.address || '',
          commune: data.commune || '',
          region: data.region || 'Región Metropolitana de Santiago (XIII)',
          description: data.description || '',
          bedrooms: data.bedrooms?.toString() || '',
          bathrooms: data.bathrooms?.toString() || '',
          squareMeters: data.squareMeters?.toString() || '',
          monthlyRentCLP: data.monthlyRentCLP?.toString() || '',
          monthlyRentUF: data.monthlyRentUF?.toString() || '',
          contractStart: data.contractStart ? new Date(data.contractStart).toISOString().split('T')[0] : '',
          contractEnd: data.contractEnd ? new Date(data.contractEnd).toISOString().split('T')[0] : '',
          lat: data.lat != null ? String(data.lat) : '',
          lng: data.lng != null ? String(data.lng) : '',
        })
      } catch (err) {
        setError('No se pudo cargar la propiedad')
        toast({
          title: 'Error',
          description: 'No se pudo cargar la propiedad',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [propertyId, toast])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!formData.name || !formData.address || !formData.commune) {
        setError('Por favor completa los campos obligatorios')
        setSaving(false)
        return
      }

      const payload = {
        name: formData.name,
        address: formData.address,
        commune: formData.commune,
        region: formData.region,
        description: formData.description || undefined,
        bedrooms: toNumber(formData.bedrooms),
        bathrooms: toNumber(formData.bathrooms),
        squareMeters: toNumber(formData.squareMeters),
        monthlyRentCLP: toNumber(formData.monthlyRentCLP),
        monthlyRentUF: toNumber(formData.monthlyRentUF),
        contractStart: formData.contractStart || undefined,
        contractEnd: formData.contractEnd || undefined,
        lat: toNumber(formData.lat),
        lng: toNumber(formData.lng),
      }

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const errorMsg = typeof data.error === 'string' ? data.error : 'Error al actualizar la propiedad'
        
        // Log errores detallados en consola para debugging
        console.error('Update error details:', errorMsg)
        
        // Mostrar mensaje genérico al usuario
        setError('Error al actualizar la propiedad. Por favor intenta nuevamente.')
        setSaving(false)
        return
      }

      toast({
        title: 'Éxito',
        description: 'Propiedad actualizada correctamente',
      })
      
      router.push(`/dashboard/propiedades/${propertyId}`)
      router.refresh()
    } catch (err) {
      setError('Error al actualizar la propiedad. Intenta nuevamente.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/propiedades/${propertyId}`}>
          <Button variant="ghost" size="icon" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Propiedad</h1>
          <p className="text-muted-foreground">Actualiza la información de tu propiedad</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Información de la Propiedad</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Row 1: Name and Address */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground text-sm font-medium">
                  Nombre o Referencia *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Depto Providencia"
                  className="bg-background border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground text-sm font-medium">
                  Dirección Completa *
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Providencia 1234, Depto 501"
                  className="bg-background border-border text-foreground"
                  required
                />
              </div>
            </div>

            {/* Row 2: Region and Commune */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="region" className="text-foreground text-sm font-medium">
                  Región *
                </Label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  required
                >
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commune" className="text-foreground text-sm font-medium">
                  Comuna *
                </Label>
                <select
                  id="commune"
                  name="commune"
                  value={formData.commune}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  required
                >
                  <option value="">Selecciona una comuna</option>
                  {currentCommunas.map(comuna => (
                    <option key={comuna} value={comuna}>
                      {comuna}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground text-sm font-medium">
                Descripción
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe la propiedad en detalle..."
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] resize-none"
                rows={4}
              />
            </div>

            {/* Row 3: Bedrooms, Bathrooms, Square Meters */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-foreground text-sm font-medium">
                  Habitaciones
                </Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="bg-background border-border text-foreground"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-foreground text-sm font-medium">
                  Baños
                </Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="bg-background border-border text-foreground"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="squareMeters" className="text-foreground text-sm font-medium">
                  Metros cuadrados
                </Label>
                <Input
                  id="squareMeters"
                  name="squareMeters"
                  type="number"
                  value={formData.squareMeters}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="bg-background border-border text-foreground"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Row 4: Rent Amounts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="monthlyRentCLP" className="text-foreground text-sm font-medium">
                  Arriendo Mensual (CLP)
                </Label>
                <Input
                  id="monthlyRentCLP"
                  name="monthlyRentCLP"
                  type="number"
                  value={formData.monthlyRentCLP}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="bg-background border-border text-foreground"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRentUF" className="text-foreground text-sm font-medium">
                  Arriendo Mensual (UF)
                </Label>
                <Input
                  id="monthlyRentUF"
                  name="monthlyRentUF"
                  type="number"
                  value={formData.monthlyRentUF}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="bg-background border-border text-foreground"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Ubicación mapa */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="lat" className="text-foreground text-sm font-medium">
                  Latitud (mapa)
                </Label>
                <Input
                  id="lat"
                  name="lat"
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={handleInputChange}
                  placeholder="-33.45"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng" className="text-foreground text-sm font-medium">
                  Longitud (mapa)
                </Label>
                <Input
                  id="lng"
                  name="lng"
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={handleInputChange}
                  placeholder="-70.65"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            {/* Row 5: Contract Dates */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contractStart" className="text-foreground text-sm font-medium">
                  Fecha Inicio del Contrato
                </Label>
                <Input
                  id="contractStart"
                  name="contractStart"
                  type="date"
                  value={formData.contractStart}
                  onChange={handleInputChange}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractEnd" className="text-foreground text-sm font-medium">
                  Fecha Fin del Contrato
                </Label>
                <Input
                  id="contractEnd"
                  name="contractEnd"
                  type="date"
                  value={formData.contractEnd}
                  onChange={handleInputChange}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={saving}
                className="gap-2 bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
              <Link href={`/dashboard/propiedades/${propertyId}`}>
                <Button type="button" variant="outline" className="text-foreground">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
