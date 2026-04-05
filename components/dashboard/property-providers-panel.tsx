'use client'

import { useCallback, useEffect, useState } from 'react'
import { Wrench, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
            Las asignaciones son <strong className="text-foreground font-medium">por propiedad</strong>: un
            arrendatario en Punta Arenas no verá los mismos contactos que uno en Santiago salvo que los
            asignes aquí. Crea tu base en Proveedores y luego elige quién aplica a cada unidad.
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
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecciona proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {SPECIALTY_ES[p.specialty] ?? p.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={!selectedId || saving}
                onClick={assign}
                className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Asignar a esta propiedad
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
