'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { Wrench, Loader2, Trash2, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

const SPECIALTY_ES: Record<string, string> = {
  PLUMBER: 'Gasfiter',
  ELECTRICIAN: 'Electricista',
  PAINTER: 'Pintor',
  CARPENTER: 'Carpintero',
  LOCKSMITH: 'Cerrajero',
  GENERAL: 'General',
  OTHER: 'Otro',
}

type Assigned = {
  providerId: string
  provider: {
    id: string
    name: string
    specialty: string
    phone: string
    email: string | null
  }
}

type PoolProvider = {
  id: string
  name: string
  specialty: string
  phone: string
}

export function PropertyProvidersPanel({ propertyId }: { propertyId: string }) {
  const { toast } = useToast()
  const [assigned, setAssigned] = useState<Assigned[]>([])
  const [pool, setPool] = useState<PoolProvider[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, pRes] = await Promise.all([
        fetch(`/api/properties/${propertyId}/providers`),
        fetch('/api/providers'),
      ])
      const aJson = await aRes.json()
      const pJson = await pRes.json()
      const rows = Array.isArray(aJson.providers) ? aJson.providers : []
      setAssigned(
        rows.map((r: { provider: Assigned['provider'] }) => ({
          providerId: r.provider.id,
          provider: r.provider,
        }))
      )
      const all = Array.isArray(pJson.providers) ? pJson.providers : []
      setPool(
        all.map((x: { id: string; name: string; specialty: string; phone: string }) => ({
          id: x.id,
          name: x.name,
          specialty: x.specialty,
          phone: x.phone,
        }))
      )
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proveedores',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [propertyId, toast])

  useEffect(() => {
    load()
  }, [load])

  const assign = async () => {
    if (!selectedId) return
    setSaving(true)
    const selectedProvider = pool.find((p) => p.id === selectedId)
    try {
      const res = await fetch(`/api/properties/${propertyId}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo asignar',
          variant: 'destructive',
        })
        return
      }
      // Refrescar UI rápidamente
      if (selectedProvider) {
        setAssigned((prev) => [
          ...prev,
          {
            providerId: selectedProvider.id,
            provider: {
              ...selectedProvider,
              email: null,
            } as any,
          },
        ])
      }
      toast({ title: 'Listo', description: 'Proveedor asignado a esta propiedad' })
      setSelectedId('')
      await load()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (providerId: string) => {
    setSaving(true)
    try {
      await fetch(`/api/properties/${propertyId}/providers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })
      toast({ title: 'Listo', description: 'Proveedor desasignado' })
      await load()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const assignedIds = new Set(assigned.map((a) => a.providerId))
  const available = pool.filter((p) => !assignedIds.has(p.id))

  // Filtrar proveedores disponibles
  const filteredProviders = useMemo(() => {
    return available.filter((provider) => {
      const matchesSearch = searchTerm === '' ||
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.phone.includes(searchTerm)

      const matchesSpecialty = specialtyFilter === 'all' || provider.specialty === specialtyFilter

      return matchesSearch && matchesSpecialty
    })
  }, [available, searchTerm, specialtyFilter])

  // Obtener especialidades únicas para el filtro
  const availableSpecialties = useMemo(() => {
    const specialties = new Set(available.map(p => p.specialty))
    return Array.from(specialties).sort()
  }, [available])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-[#5E8B8C]" />
            Proveedores de esta propiedad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Las asignaciones son <strong className="text-foreground font-medium">por propiedad</strong>: define qué
            proveedores estarán disponibles para esta unidad. Administra tu directorio en “Proveedores” y asigna aquí
            a los que correspondan.
          </p>
          {assigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay proveedores asignados.</p>
          ) : (
            <ul className="space-y-2">
              {assigned.map((a) => (
                <li
                  key={a.providerId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{a.provider.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {SPECIALTY_ES[a.provider.specialty] ?? a.provider.specialty} ·{' '}
                      {a.provider.phone}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => remove(a.providerId)}
                    aria-label="Quitar proveedor"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-base">Asignar proveedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay proveedores disponibles para asignar. Agrega uno en Proveedores o ya están
              todos asignados a esta propiedad.
            </p>
          ) : (
            <>
              {/* Barra de búsqueda y filtros */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue placeholder="Filtrar por especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las especialidades</SelectItem>
                      {availableSpecialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {SPECIALTY_ES[specialty] ?? specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de proveedores filtrados */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredProviders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No se encontraron proveedores con los filtros aplicados.
                  </p>
                ) : (
                  filteredProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedId === provider.id
                          ? 'border-[#5E8B8C] bg-[#5E8B8C]/5'
                          : 'border-border hover:border-[#5E8B8C]/50'
                      }`}
                      onClick={() => setSelectedId(selectedId === provider.id ? '' : provider.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{provider.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {SPECIALTY_ES[provider.specialty] ?? provider.specialty}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{provider.phone}</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedId === provider.id
                            ? 'border-[#5E8B8C] bg-[#5E8B8C]'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedId === provider.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button
                type="button"
                disabled={!selectedId || saving}
                onClick={assign}
                className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Asignar a esta propiedad
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
