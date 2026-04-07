'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface FormData {
  name: string
  email: string
  phone: string
  description: string
  specialty: string
  photoUrl?: string
  rating?: string
}

export default function AgregarProveedor() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    description: '',
    specialty: 'GENERAL',
    photoUrl: '',
    rating: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.specialty) {
        setError('Por favor completa los campos obligatorios')
        setLoading(false)
        return
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialty: formData.specialty,
        description: formData.description || undefined,
        photoUrl: formData.photoUrl || undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
      }

      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al crear el proveedor')
        setLoading(false)
        return
      }

      toast({
        title: 'Éxito',
        description: 'Proveedor creado correctamente',
      })

      router.push('/dashboard/proveedores')
      router.refresh()
    } catch (err) {
      setError('Error al crear el proveedor. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/proveedores">
          <Button variant="ghost" size="icon" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agregar Proveedor</h1>
          <p className="text-muted-foreground">Registra un nuevo proveedor o contratista</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Información del Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Row 1: Name and Specialty */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground text-sm font-medium">
                  Nombre o Razón Social *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan García"
                  className="bg-background border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-foreground text-sm font-medium">
                  Especialidad *
                </Label>
                <select
                  id="specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  required
                >
                  <option value="PLUMBER">Plomero</option>
                  <option value="ELECTRICIAN">Electricista</option>
                  <option value="PAINTER">Pintor</option>
                  <option value="CARPENTER">Carpintero</option>
                  <option value="LOCKSMITH">Cerrajero</option>
                  <option value="GENERAL">Mantenimiento General</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>

            {/* Row 2: Email and Phone */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ej: juan@example.com"
                  className="bg-background border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground text-sm font-medium">
                  Teléfono *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Ej: +56 9 1234 5678"
                  className="bg-background border-border text-foreground"
                  required
                />
              </div>
            </div>

            {/* Row 3: Description and Rating */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground text-sm font-medium">
                  Descripción / Experiencia
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ej: 15 años de experiencia en reparaciones"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating" className="text-foreground text-sm font-medium">
                  Calificación (0-5)
                </Label>
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={handleInputChange}
                  placeholder="Ej: 4.5"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            {/* Row 4: Photo URL */}
            <div className="space-y-2">
              <Label htmlFor="photoUrl" className="text-foreground text-sm font-medium">
                URL de Foto (opcional)
              </Label>
              <Input
                id="photoUrl"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleInputChange}
                placeholder="Ej: https://example.com/photo.jpg"
                className="bg-background border-border text-foreground"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar proveedor
              </Button>
              <Link href="/dashboard/proveedores">
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
