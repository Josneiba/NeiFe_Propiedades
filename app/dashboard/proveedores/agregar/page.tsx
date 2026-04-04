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
  company: string
  serviceType: string
  rut: string
  bankAccount?: string
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
    company: '',
    serviceType: 'MANTENIMIENTO',
    rut: '',
    bankAccount: '',
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
      if (!formData.name || !formData.email || !formData.phone || !formData.rut) {
        setError('Por favor completa los campos obligatorios')
        setLoading(false)
        return
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || undefined,
        serviceType: formData.serviceType,
        rut: formData.rut,
        bankAccount: formData.bankAccount || undefined,
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

            {/* Row 1: Name and RUT */}
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
                <Label htmlFor="rut" className="text-foreground text-sm font-medium">
                  RUT *
                </Label>
                <Input
                  id="rut"
                  name="rut"
                  value={formData.rut}
                  onChange={handleInputChange}
                  placeholder="Ej: 12345678-9"
                  className="bg-background border-border text-foreground"
                  required
                />
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

            {/* Row 3: Company and Service Type */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-foreground text-sm font-medium">
                  Empresa / Negocio
                </Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Ej: García y Asociados"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType" className="text-foreground text-sm font-medium">
                  Tipo de Servicio *
                </Label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#5E8B8C]"
                  required
                >
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="ELECTRICIDAD">Electricidad</option>
                  <option value="PLOMERIA">Plomería</option>
                  <option value="LIMPIEZA">Limpieza</option>
                  <option value="JARDINERIA">Jardinería</option>
                  <option value="REPARACIONES">Reparaciones</option>
                  <option value="SEGURIDAD">Seguridad</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>

            {/* Row 4: Bank Account */}
            <div className="space-y-2">
              <Label htmlFor="bankAccount" className="text-foreground text-sm font-medium">
                Cuenta Bancaria (opcional)
              </Label>
              <Input
                id="bankAccount"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleInputChange}
                placeholder="Ej: Nombre Banco - Tipo de Cuenta - Número"
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
