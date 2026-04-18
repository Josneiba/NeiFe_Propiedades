'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getRegions, getCommunesByRegion } from '@/lib/chile-regions'

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
}

interface FormErrors {
  name?: string
  address?: string
  commune?: string
  monthlyRentCLP?: string
  monthlyRentUF?: string
  bedrooms?: string
  bathrooms?: string
  squareMeters?: string
  contractStart?: string
  contractEnd?: string
}

export default function NuevaPropiedad() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const regions = getRegions()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    commune: '',
    region: regions[0] || 'Región Metropolitana de Santiago (XIII)',
    description: '',
    bedrooms: '',
    bathrooms: '',
    squareMeters: '',
    monthlyRentCLP: '',
    monthlyRentUF: '',
    contractStart: '',
    contractEnd: '',
  })

  const currentCommunas = getCommunesByRegion(formData.region)

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'El nombre de la propiedad es requerido'
        if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres'
        return undefined
      case 'address':
        if (!value.trim()) return 'La dirección es requerida'
        if (value.trim().length < 5) return 'La dirección debe tener al menos 5 caracteres'
        return undefined
      case 'commune':
        if (!value) return 'La comuna es requerida'
        return undefined
      case 'monthlyRentCLP':
        if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
          return 'El arriendo debe ser un número positivo'
        }
        return undefined
      case 'monthlyRentUF':
        if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
          return 'El arriendo en UF debe ser un número positivo'
        }
        return undefined
      case 'bedrooms':
        if (value && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 20)) {
          return 'El número de dormitorios debe ser entre 0 y 20'
        }
        return undefined
      case 'bathrooms':
        if (value && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 10)) {
          return 'El número de baños debe ser entre 0 y 10'
        }
        return undefined
      case 'squareMeters':
        if (value && (isNaN(Number(value)) || Number(value) <= 0 || Number(value) > 10000)) {
          return 'Los metros cuadrados deben ser entre 1 y 10000'
        }
        return undefined
      case 'contractStart':
        if (value) {
          const startDate = new Date(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (startDate < today) return 'La fecha de inicio no puede ser anterior a hoy'
        }
        return undefined
      case 'contractEnd':
        if (value && formData.contractStart) {
          const endDate = new Date(value)
          const startDate = new Date(formData.contractStart)
          if (endDate <= startDate) return 'La fecha de término debe ser posterior a la de inicio'
        }
        return undefined
      default:
        return undefined
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    
    // Real-time validation
    const error = validateField(name, value)
    setFormErrors(prev => ({
      ...prev,
      [name]: error,
    }))
    
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name || !formData.address || !formData.commune) {
        setError('Por favor completa los campos obligatorios')
        setLoading(false)
        return
      }

      const payload = {
        name: formData.name,
        address: formData.address,
        commune: formData.commune,
        region: formData.region,
        description: formData.description || undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        squareMeters: formData.squareMeters ? parseFloat(formData.squareMeters) : undefined,
        monthlyRentCLP: formData.monthlyRentCLP ? parseInt(formData.monthlyRentCLP) : undefined,
        monthlyRentUF: formData.monthlyRentUF ? parseFloat(formData.monthlyRentUF) : undefined,
        contractStart: formData.contractStart || undefined,
        contractEnd: formData.contractEnd || undefined,
      }

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        const msg = Array.isArray(data.error)
          ? data.error.map((e: { message?: string }) => e.message).filter(Boolean).join(', ')
          : data.error
        setError(typeof msg === 'string' ? msg : 'Error al crear la propiedad')
        setLoading(false)
        return
      }

      const created = await response.json()
      const id = created.property?.id
      if (id) {
        router.push(`/dashboard/propiedades/${id}`)
      } else {
        router.push('/dashboard/propiedades')
      }
      router.refresh()
    } catch (err) {
      setError('Error al crear la propiedad. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/propiedades">
          <Button variant="ghost" size="icon" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Propiedad</h1>
          <p className="text-muted-foreground">Registra una nueva propiedad en arriendo</p>
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
                  className={`bg-background border text-foreground ${
                    formErrors.name ? 'border-red-500' : 'border-border'
                  }`}
                  required
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
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
                  placeholder="Ej: Av. Providencia 1234, Depto 12B"
                  className={`bg-background border text-foreground ${
                    formErrors.address ? 'border-red-500' : 'border-border'
                  }`}
                  required
                />
                {formErrors.address && (
                  <p className="text-sm text-red-500">{formErrors.address}</p>
                )}
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
                  m² Construidos
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

            {/* Row 4: Rent Prices */}
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

            {/* Row 5: Contract Dates */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contractStart" className="text-foreground text-sm font-medium">
                  Fecha de Contrato - Inicio
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
                  Fecha de Contrato - Término
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

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t border-border">
              <Link href="/dashboard/propiedades">
                <Button variant="outline" className="border-border text-foreground">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Propiedad
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
