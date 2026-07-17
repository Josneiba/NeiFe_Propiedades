'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { X, Check, Trash2, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export interface ContactFilterCriteria {
  type: string
  status: string
  source: string
  priority: string
  operationType: string
  dealStatus: string
  wonBeforeDays: string
  interestedCommune: string
  interestedPropertyType: string
}

export const EMPTY_FILTER_CRITERIA: ContactFilterCriteria = {
  type: 'all',
  status: 'all',
  source: 'all',
  priority: 'all',
  operationType: 'all',
  dealStatus: 'all',
  wonBeforeDays: 'all',
  interestedCommune: '',
  interestedPropertyType: 'all',
}

export interface SavedFilter {
  id: string
  name: string
  criteria: ContactFilterCriteria
}

interface ContactFilterSheetProps {
  open: boolean
  onClose: () => void
  criteria: ContactFilterCriteria
  onApply: (criteria: ContactFilterCriteria) => void
}

// Clase compartida para que cada <Select> se vea como texto + flecha,
// integrado en la fila — no como una caja de formulario aparte.
const FLAT_SELECT_TRIGGER =
  'h-auto w-auto gap-1 border-none bg-transparent p-0 text-sm font-medium text-[#FAF6F2] shadow-none hover:text-[#7FB8B9] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[placeholder]:text-[#9C8578]'

export function ContactFilterSheet({ open, onClose, criteria, onApply }: ContactFilterSheetProps) {
  const [draft, setDraft] = useState<ContactFilterCriteria>(criteria)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [filterName, setFilterName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(criteria)
      void loadSavedFilters()
    }
  }, [open, criteria])

  async function loadSavedFilters() {
    try {
      const res = await fetch('/api/broker/crm/saved-filters')
      if (res.ok) {
        const data = await res.json()
        setSavedFilters(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  function set<K extends keyof ContactFilterCriteria>(field: K, value: ContactFilterCriteria[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSaveFilter() {
    if (!filterName.trim()) {
      toast.error('Ponle un nombre al filtro')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/broker/crm/saved-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: filterName.trim(), criteria: draft }),
      })
      if (!res.ok) throw new Error()
      setFilterName('')
      toast.success('Filtro guardado')
      void loadSavedFilters()
    } catch {
      toast.error('No se pudo guardar el filtro')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteFilter(id: string) {
    try {
      const res = await fetch(`/api/broker/crm/saved-filters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSavedFilters((prev) => prev.filter((f) => f.id !== id))
    } catch {
      toast.error('No se pudo eliminar el filtro')
    }
  }

  function applySavedFilter(filter: SavedFilter) {
    setDraft(filter.criteria)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1C2828] text-[#FAF6F2]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#2D3C3C] bg-[#1C2828] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#9C8578] hover:bg-[#152022]"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Filtros</h1>
        <button
          type="button"
          onClick={() => onApply(draft)}
          aria-label="Aplicar filtros"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C27F79] text-[#1C2828] transition hover:bg-[#C27F79]/85"
        >
          <Check className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-7 p-4 pb-16">
        {savedFilters.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Filtros guardados</h2>
            <div className="space-y-2">
              {savedFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#152022] px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => applySavedFilter(filter)}
                    className="flex-1 text-left text-sm font-medium text-[#FAF6F2]"
                  >
                    {filter.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFilter(filter.id)}
                    aria-label={`Eliminar filtro ${filter.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#9C8578] hover:bg-[#1C2828] hover:text-[#C27F79]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Datos del contacto</h2>

          <FilterRow label="Tipo de contacto">
            <Select value={draft.type} onValueChange={(value) => set('type', value)}>
              <SelectTrigger className={FLAT_SELECT_TRIGGER}><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                <SelectItem value="ARRENDATARIO">Arrendatario</SelectItem>
                <SelectItem value="INVERSIONISTA">Inversionista</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>

          <FilterRow label="Estado">
            <Select value={draft.status} onValueChange={(value) => set('status', value)}>
              <SelectTrigger className={FLAT_SELECT_TRIGGER}><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="CONVERTED">Convertido</SelectItem>
                <SelectItem value="LOST">Perdido</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>

          <FilterRow label="Fuente">
            <Select value={draft.source} onValueChange={(value) => set('source', value)}>
              <SelectTrigger className={FLAT_SELECT_TRIGGER}><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="PORTAL">Portal</SelectItem>
                <SelectItem value="REFERIDO">Referido</SelectItem>
                <SelectItem value="RRSS">RRSS</SelectItem>
                <SelectItem value="LLAMADA_DIRECTA">Llamada directa</SelectItem>
                <SelectItem value="LETRERO">Letrero</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>

          <FilterRow label="Prioridad" last>
            <Select value={draft.priority} onValueChange={(value) => set('priority', value)}>
              <SelectTrigger className={FLAT_SELECT_TRIGGER}><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="MEDIUM">Media</SelectItem>
                <SelectItem value="LOW">Baja</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>
        </section>

        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Negociación</h2>

          <FilterRow label="Interés de operación">
            <Select value={draft.operationType} onValueChange={(value) => set('operationType', value)}>
              <SelectTrigger className={FLAT_SELECT_TRIGGER}><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="ARRIENDO">Arrendar</SelectItem>
                <SelectItem value="VENTA">Comprar / Vender</SelectItem>
                <SelectItem value="AMBOS">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>

          <FilterRow label="Resultado de negociación">
            <Select value={draft.dealStatus} onValueChange={(value) => set('dealStatus', value)}>
              <SelectTrigger className={FLAT_SELECT_TRIGGER}><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="ACTIVE">En curso</SelectItem>
                <SelectItem value="WON">Cerrado con éxito</SelectItem>
                <SelectItem value="LOST">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>

          <FilterRow label="Cerrado hace más de" last>
            <Select value={draft.wonBeforeDays} onValueChange={(value) => set('wonBeforeDays', value)}>
              <SelectTrigger className={FLAT_SELECT_TRIGGER}><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                <SelectItem value="all">Cualquier fecha</SelectItem>
                <SelectItem value="90">3 meses</SelectItem>
                <SelectItem value="180">6 meses</SelectItem>
                <SelectItem value="365">1 año</SelectItem>
                <SelectItem value="730">2 años</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>
          <p className="mt-2 text-xs leading-relaxed text-[#9C8578]">
            Ej: "Resultado: Cerrado con éxito" + "Cerrado hace más de 1 año" = clientes a los que ya les vendiste o arrendaste y podrías recontactar por otro negocio.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Intereses</h2>

          <FilterRow label="Comuna / sector">
            <input
              value={draft.interestedCommune}
              onChange={(event) => set('interestedCommune', event.target.value)}
              placeholder="Sin especificar"
              className="w-32 bg-transparent text-right text-sm font-medium text-[#FAF6F2] placeholder:text-[#9C8578] placeholder:font-normal focus:outline-none"
            />
          </FilterRow>

          <FilterRow label="Tipo de propiedad" last>
            <Select value={draft.interestedPropertyType} onValueChange={(value) => set('interestedPropertyType', value)}>
              <SelectTrigger className={FLAT_SELECT_TRIGGER}><SelectValue placeholder="Cualquiera" /></SelectTrigger>
              <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="DEPARTAMENTO">Departamento</SelectItem>
                <SelectItem value="CASA">Casa</SelectItem>
                <SelectItem value="OFICINA">Oficina</SelectItem>
                <SelectItem value="LOCAL_COMERCIAL">Local comercial</SelectItem>
                <SelectItem value="ESTACIONAMIENTO">Estacionamiento</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>
        </section>

        <section className="space-y-2 rounded-2xl bg-[#152022] p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[#FAF6F2]">
            <Save className="h-4 w-4" /> Guardar como filtro
          </h2>
          <p className="text-xs leading-relaxed text-[#9C8578]">Para volver a aplicar esta combinación con un toque, ej. "Ganados hace +1 año".</p>
          <div className="flex gap-2">
            <Input
              value={filterName}
              onChange={(event) => setFilterName(event.target.value)}
              placeholder="Nombre del filtro"
              className="h-10 border-[#2D3C3C] bg-[#1C2828] text-[#FAF6F2]"
            />
            <button
              type="button"
              onClick={handleSaveFilter}
              disabled={saving}
              className="shrink-0 rounded-xl bg-[#5E8B8C] px-4 text-sm font-semibold text-white transition hover:bg-[#5E8B8C]/85 disabled:opacity-60"
            >
              Guardar
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

// Fila plana: label a la izquierda, valor + flecha a la derecha, con una
// línea divisoria fina abajo (menos la última fila de cada sección).
function FilterRow({ label, children, last = false }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-3 ${last ? '' : 'border-b border-[#2D3C3C]/70'}`}>
      <span className="text-sm text-[#D5C3B6]">{label}</span>
      {children}
    </div>
  )
}
