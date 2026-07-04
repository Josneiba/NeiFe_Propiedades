'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, Pencil, Trash2, Plus, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface SavedView {
  id: string
  name: string
  entity: 'CONTACTS' | 'PROPERTIES' | 'MANDATES' | 'PAYMENTS' | 'MAINTENANCE'
  filters: Record<string, unknown>
  sortBy?: string | null
  sortOrder?: string | null
  isStandard?: boolean
  updatedAt?: string
  resultCount?: number
}

const ENTITY_LABELS: Record<string, string> = {
  CONTACTS: 'Clientes',
  PROPERTIES: 'Propiedades',
  MANDATES: 'Contratos',
  PAYMENTS: 'Pagos',
  MAINTENANCE: 'Mantenciones',
}

const DEFAULT_SORTS: Record<string, Array<{ value: string; label: string }>> = {
  CONTACTS: [{ value: 'updatedAt', label: 'Última actualización' }, { value: 'name', label: 'Nombre' }],
  PROPERTIES: [{ value: 'updatedAt', label: 'Última actualización' }, { value: 'price', label: 'Precio' }, { value: 'name', label: 'Nombre' }],
  MANDATES: [{ value: 'expiresAt', label: 'Fecha de vencimiento' }, { value: 'createdAt', label: 'Fecha de creación' }],
  PAYMENTS: [{ value: 'createdAt', label: 'Fecha de creación' }, { value: 'amountCLP', label: 'Monto' }],
  MAINTENANCE: [{ value: 'createdAt', label: 'Fecha de creación' }, { value: 'updatedAt', label: 'Última actualización' }],
}

export default function SavedViewsPage() {
  const router = useRouter()
  const [views, setViews] = useState<SavedView[]>([])
  const [loading, setLoading] = useState(true)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [entity, setEntity] = useState('CONTACTS')
  const [name, setName] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadViews = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/crm/saved-views?entity=CONTACTS')
      if (res.ok) {
        const data = await res.json()
        setViews(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error('No se pudieron cargar las vistas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadViews() }, [])

  const groupedViews = useMemo(() => {
    const custom = views.filter((view) => !view.isStandard)
    const standards = views.filter((view) => view.isStandard)
    return { custom, standards }
  }, [views])

  const openBuilder = (view?: SavedView) => {
    setEditingId(view?.id ?? null)
    setEntity(view?.entity ?? 'CONTACTS')
    setName(view?.name ?? '')
    setSortBy(view?.sortBy ?? 'updatedAt')
    setSortOrder(view?.sortOrder ?? 'desc')
    setFilters(view?.filters ?? {})
    setBuilderOpen(true)
  }

  const saveView = async () => {
    if (!name.trim()) return toast.error('El nombre es obligatorio')
    try {
      const payload = { name: name.trim(), entity, filters, sortBy, sortOrder }
      const res = editingId
        ? await fetch(`/api/crm/saved-views/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/crm/saved-views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(editingId ? 'Vista actualizada' : 'Vista guardada')
      setBuilderOpen(false)
      await loadViews()
    } catch {
      toast.error('No se pudo guardar la vista')
    }
  }

  const applyView = async (view: SavedView) => {
    const res = await fetch('/api/crm/saved-views/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: view.entity, filters: view.filters, sortBy: view.sortBy, sortOrder: view.sortOrder }),
    })
    if (!res.ok) return toast.error('No se pudo aplicar la vista')
    const result = await res.json()
    const entityPath = view.entity === 'CONTACTS' ? '/broker/crm/contactos' : view.entity === 'PROPERTIES' ? '/broker/propiedades' : view.entity === 'MANDATES' ? '/broker/mandatos' : view.entity === 'PAYMENTS' ? '/broker/pagos' : '/broker/mantenciones'
    const query = new URLSearchParams({ view: view.id, entity: view.entity })
    router.push(`${entityPath}?${query.toString()}`)
    toast.success(`Se aplicó ${view.name}`)
  }

  const removeView = async (view: SavedView) => {
    if (view.isStandard) return
    if (!window.confirm(`¿Eliminar ${view.name}?`)) return
    try {
      const res = await fetch(`/api/crm/saved-views/${view.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Vista eliminada')
      await loadViews()
    } catch {
      toast.error('No se pudo eliminar la vista')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#D5C3B6]/10 bg-[#1C2828] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#B8965A]">CRM · Vistas guardadas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#FAF6F2]">Vistas guardadas</h1>
          <p className="mt-1 text-sm text-[#9C8578]">Guarda y reutiliza tus filtros más útiles en un clic.</p>
        </div>
        <Button onClick={() => openBuilder()} className="gap-2 bg-[#5E8B8C] text-white">
          <Plus className="h-4 w-4" />
          Nueva vista
        </Button>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C2828] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#FAF6F2]">Mis vistas</h2>
            <span className="text-sm text-[#9C8578]">{groupedViews.custom.length} personalizadas</span>
          </div>
          {loading ? <p className="text-sm text-[#9C8578]">Cargando...</p> : groupedViews.custom.length === 0 ? <p className="text-sm text-[#9C8578]">Aún no tienes vistas guardadas.</p> : (
            <div className="space-y-3">
              {groupedViews.custom.map((view) => (
                <div key={view.id} className="flex flex-col gap-3 rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/70 p-3 md:flex-row md:items-center md:justify-between">
                  <button onClick={() => void applyView(view)} className="flex flex-1 items-start gap-3 text-left">
                    <div className="rounded-xl bg-[#5E8B8C]/15 p-2 text-[#5E8B8C]"><FolderOpen className="h-4 w-4" /></div>
                    <div>
                      <p className="font-semibold text-[#FAF6F2]">{view.name}</p>
                      <p className="text-sm text-[#9C8578]">{ENTITY_LABELS[view.entity]} · {view.resultCount ?? 0} resultados</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openBuilder(view)} className="text-[#D5C3B6]">
                      <Pencil className="mr-2 h-4 w-4" />Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void removeView(view)} className="text-red-400">
                      <Trash2 className="mr-2 h-4 w-4" />Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C2828] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#FAF6F2]">Vistas estándar</h2>
            <span className="text-sm text-[#9C8578]">{groupedViews.standards.length} disponibles</span>
          </div>
          <div className="space-y-3">
            {groupedViews.standards.map((view) => (
              <button key={view.id} onClick={() => void applyView(view)} className="flex w-full items-center justify-between rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/70 p-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#B8965A]/15 p-2 text-[#B8965A]"><FolderOpen className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-[#FAF6F2]">{view.name}</p>
                    <p className="text-sm text-[#9C8578]">{ENTITY_LABELS[view.entity]} · {view.resultCount ?? 0} resultados</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#9C8578]" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="border-[#2D3C3C] bg-[#1a2a2a] text-[#FAF6F2] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar vista' : 'Nueva vista'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]" />
            </div>
            <div className="space-y-2">
              <Label>Entidad</Label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger className="border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTACTS">Clientes</SelectItem>
                  <SelectItem value="PROPERTIES">Propiedades</SelectItem>
                  <SelectItem value="MANDATES">Contratos</SelectItem>
                  <SelectItem value="PAYMENTS">Pagos</SelectItem>
                  <SelectItem value="MAINTENANCE">Mantenciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_SORTS[entity]?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendente</SelectItem>
                    <SelectItem value="desc">Descendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBuilderOpen(false)} className="text-[#D5C3B6]">Cancelar</Button>
            <Button onClick={() => void saveView()} className="bg-[#5E8B8C] text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
