'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Home, Loader2, Mail, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { getCommunesByRegion, getRegions } from '@/lib/chile-regions'

interface Owner {
  id: string
  name: string | null
  email: string
  company?: string | null
}

interface FormErrors {
  ownerEmail?: string
  ownerSearch?: string
  name?: string
  address?: string
  commune?: string
}

export default function NuevaPropiedadBrokerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const regions = getRegions()
  const [loadingOwner, setLoadingOwner] = useState(false)
  const [saving, setSaving] = useState(false)
  const [owner, setOwner] = useState<Owner | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [permissionStatus, setPermissionStatus] = useState<'NONE' | 'PENDING' | 'REJECTED' | 'APPROVED'>('NONE')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
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
    notes: '',
  })

  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get('email')
    if (email) {
      setOwnerEmail(email)
    }
  }, [])

  const communes = getCommunesByRegion(formData.region)

  const handleSearchOwner = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!ownerEmail.trim()) return

    setLoadingOwner(true)
    setFormErrors((current) => ({ ...current, ownerEmail: undefined, ownerSearch: undefined }))

    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(ownerEmail.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        setOwner(null)
        setPermissionStatus('NONE')
        setFormErrors((current) => ({
          ...current,
          ownerSearch: 'No encontramos un arrendador con ese correo. Primero debe tener cuenta para poder aprobar la propiedad.',
        }))
        return
      }

      setOwner(data.user)

      const permissionResponse = await fetch(`/api/broker-permissions/check?landlordId=${data.user.id}`)
      const permissionData = await permissionResponse.json()
      if (!permissionResponse.ok) {
        setPermissionStatus('NONE')
        setFormErrors((current) => ({
          ...current,
          ownerSearch: 'No pudimos verificar el permiso del arrendador.',
        }))
        return
      }

      setPermissionStatus(permissionData.status || 'NONE')
      if (!permissionData.hasPermission) {
        setFormErrors((current) => ({
          ...current,
          ownerSearch:
            permissionData.status === 'PENDING'
              ? 'Tu permiso general con este arrendador aún está pendiente. Cuando lo apruebe podrás crear propiedades en su nombre.'
              : 'Necesitas permiso general aprobado del arrendador antes de crear propiedades en su nombre.',
        }))
        return
      }

      toast({
        title: 'Arrendador listo',
        description: `Ahora puedes cargar la propiedad para ${data.user.name || data.user.email}.`,
      })
    } catch {
      setFormErrors((current) => ({
        ...current,
        ownerSearch: 'Error al buscar al arrendador. Intenta nuevamente.',
      }))
    } finally {
      setLoadingOwner(false)
    }
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!ownerEmail.trim()) nextErrors.ownerEmail = 'El correo del arrendador es obligatorio.'
    if (!owner) nextErrors.ownerSearch = 'Primero debes validar al arrendador.'
    if (!formData.name.trim()) nextErrors.name = 'Ingresa un nombre o referencia de la propiedad.'
    if (!formData.address.trim()) nextErrors.address = 'La dirección es obligatoria.'
    if (!formData.commune) nextErrors.commune = 'Selecciona una comuna.'
    if (permissionStatus !== 'APPROVED') {
      nextErrors.ownerSearch = 'Solo puedes continuar cuando el arrendador te haya aprobado como corredor.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !owner) return

    setSaving(true)

    try {
      const response = await fetch('/api/broker-property-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordId: owner.id,
          ownerEmail: owner.email,
          ownerName: owner.name || undefined,
          name: formData.name,
          address: formData.address,
          commune: formData.commune,
          region: formData.region,
          description: formData.description || undefined,
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
          squareMeters: formData.squareMeters ? Number(formData.squareMeters) : undefined,
          monthlyRentCLP: formData.monthlyRentCLP ? Number(formData.monthlyRentCLP) : undefined,
          monthlyRentUF: formData.monthlyRentUF ? Number(formData.monthlyRentUF) : undefined,
          contractStart: formData.contractStart || undefined,
          contractEnd: formData.contractEnd || undefined,
          notes: formData.notes || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(
          Array.isArray(data.error)
            ? data.error.map((item: { message?: string }) => item.message).filter(Boolean).join(', ')
            : data.error || 'No se pudo crear la propiedad',
        )
      }

      toast({
        title: 'Alta enviada al arrendador',
        description: 'La propiedad quedó pendiente de aprobación. En cuanto el propietario acepte, aparecerá en ambos paneles.',
      })
      router.push('/broker/propiedades')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear la propiedad',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/broker/propiedades">
          <Button variant="ghost" size="icon" className="text-[#FAF6F2]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-semibold text-[#FAF6F2]">Crear propiedad para un arrendador</h1>
          <p className="text-sm text-[#9C8578]">
            Flujo asistido para que el corredor haga la carga completa y el propietario solo apruebe.
          </p>
        </div>
      </div>

      <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">1. Confirma al arrendador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchOwner} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <Label htmlFor="ownerEmail" className="text-[#FAF6F2]">Correo del arrendador</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="propietario@correo.com"
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
                {formErrors.ownerEmail ? <p className="text-xs text-[#C27F79]">{formErrors.ownerEmail}</p> : null}
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loadingOwner}
                  className="bg-[#5E8B8C] text-[#FAF6F2] hover:bg-[#5E8B8C]/90"
                >
                  {loadingOwner ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Buscar
                </Button>
              </div>
            </div>

            {formErrors.ownerSearch ? (
              <div className="rounded-xl border border-[#C27F79]/20 bg-[#C27F79]/10 p-4 text-sm text-[#D5C3B6]">
                {formErrors.ownerSearch}
              </div>
            ) : null}

            {owner ? (
              <div className="rounded-2xl border border-[#5E8B8C]/20 bg-[#5E8B8C]/10 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#FAF6F2]">{owner.name || owner.email}</p>
                    <p className="text-xs text-[#9C8578]">{owner.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      permissionStatus === 'APPROVED'
                        ? 'bg-[#5E8B8C]/20 text-[#5E8B8C]'
                        : permissionStatus === 'PENDING'
                          ? 'bg-[#F2C94C]/20 text-[#F2C94C]'
                          : 'bg-[#C27F79]/20 text-[#C27F79]'
                    }`}
                  >
                    {permissionStatus === 'APPROVED'
                      ? 'Permiso aprobado'
                      : permissionStatus === 'PENDING'
                        ? 'Permiso pendiente'
                        : 'Sin permiso activo'}
                  </span>
                </div>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">2. Completa la ficha que el arrendador aprobará</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#FAF6F2]">Nombre o referencia</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Ej: Casa Los Arrayanes"
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
                {formErrors.name ? <p className="text-xs text-[#C27F79]">{formErrors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-[#FAF6F2]">Dirección completa</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((current) => ({ ...current, address: e.target.value }))}
                  placeholder="Ej: Camino Interior 1234"
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
                {formErrors.address ? <p className="text-xs text-[#C27F79]">{formErrors.address}</p> : null}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="region" className="text-[#FAF6F2]">Región</Label>
                <select
                  id="region"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      region: e.target.value,
                      commune: '',
                    }))
                  }
                  className="w-full rounded-md border border-[#D5C3B6]/10 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
                >
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commune" className="text-[#FAF6F2]">Comuna</Label>
                <select
                  id="commune"
                  value={formData.commune}
                  onChange={(e) => setFormData((current) => ({ ...current, commune: e.target.value }))}
                  className="w-full rounded-md border border-[#D5C3B6]/10 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
                >
                  <option value="">Selecciona una comuna</option>
                  {communes.map((commune) => (
                    <option key={commune} value={commune}>
                      {commune}
                    </option>
                  ))}
                </select>
                {formErrors.commune ? <p className="text-xs text-[#C27F79]">{formErrors.commune}</p> : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#FAF6F2]">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))}
                placeholder="Describe la propiedad para que el arrendador revise lo que estás cargando."
                className="min-h-[120px] border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-[#FAF6F2]">Dormitorios</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData((current) => ({ ...current, bedrooms: e.target.value }))}
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-[#FAF6F2]">Baños</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData((current) => ({ ...current, bathrooms: e.target.value }))}
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="squareMeters" className="text-[#FAF6F2]">m²</Label>
                <Input
                  id="squareMeters"
                  type="number"
                  min="0"
                  value={formData.squareMeters}
                  onChange={(e) => setFormData((current) => ({ ...current, squareMeters: e.target.value }))}
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyRentCLP" className="text-[#FAF6F2]">Arriendo CLP</Label>
                <Input
                  id="monthlyRentCLP"
                  type="number"
                  min="0"
                  value={formData.monthlyRentCLP}
                  onChange={(e) => setFormData((current) => ({ ...current, monthlyRentCLP: e.target.value }))}
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRentUF" className="text-[#FAF6F2]">Arriendo UF</Label>
                <Input
                  id="monthlyRentUF"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyRentUF}
                  onChange={(e) => setFormData((current) => ({ ...current, monthlyRentUF: e.target.value }))}
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contractStart" className="text-[#FAF6F2]">Inicio de contrato</Label>
                <Input
                  id="contractStart"
                  type="date"
                  value={formData.contractStart}
                  onChange={(e) => setFormData((current) => ({ ...current, contractStart: e.target.value }))}
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractEnd" className="text-[#FAF6F2]">Término de contrato</Label>
                <Input
                  id="contractEnd"
                  type="date"
                  value={formData.contractEnd}
                  onChange={(e) => setFormData((current) => ({ ...current, contractEnd: e.target.value }))}
                  className="border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[#FAF6F2]">Notas para el arrendador</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))}
                placeholder="Explica brevemente por qué estás cargando esta propiedad y cualquier contexto útil para su aprobación."
                className="min-h-[100px] border-[#D5C3B6]/10 bg-[#1C1917] text-[#FAF6F2]"
              />
            </div>

            <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#5E8B8C]/10">
                  <Home className="h-5 w-5 text-[#5E8B8C]" />
                </div>
                <div>
                  <p className="font-medium text-[#FAF6F2]">Qué pasará después</p>
                  <p className="mt-1 text-sm text-[#9C8578]">
                    El arrendador recibirá una notificación para aprobar o rechazar la propiedad. Si aprueba, la propiedad se activará automáticamente y quedará visible tanto en su panel como en el tuyo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#D5C3B6]/10 pt-6">
              <Link href="/broker/propiedades">
                <Button variant="outline" className="border-[#D5C3B6]/10 text-[#FAF6F2]">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#75524C] text-[#FAF6F2] hover:bg-[#75524C]/90"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Enviar para aprobación
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
