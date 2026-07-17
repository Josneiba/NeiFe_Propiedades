'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EMPTY_FILTER_CRITERIA, type ContactFilterCriteria, type SavedFilter } from '@/components/broker/crm/contact-filter-sheet'

const STANDARD_VIEWS = [
  { key: 'all', label: 'Todos', href: '/broker/crm/contactos' },
  { key: 'active', label: 'Activos', href: '/broker/crm/contactos?status=ACTIVE' },
  { key: 'new-leads', label: 'Leads Nuevos', href: '/broker/crm/contactos?status=ACTIVE&type=LEAD' },
  { key: 'owners', label: 'Propietarios', href: '/broker/crm/contactos?type=PROPIETARIO' },
  { key: 'tenants', label: 'Arrendatarios', href: '/broker/crm/contactos?type=ARRENDATARIO' },
  { key: 'new-clients', label: 'Nuevos Clientes', href: '/broker/crm/contactos?status=CONVERTED' },
  { key: 'inactive', label: 'Inactivos', href: '/broker/crm/contactos?status=INACTIVE' },
]

export default function ContactFiltersPage() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [loading, setLoading] = useState(true)

  const loadFilters = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/broker/crm/saved-filters')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSavedFilters(Array.isArray(data) ? data : [])
    } catch {
      toast.error('No se pudieron cargar los filtros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFilters()
  }, [])

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/broker/crm/saved-filters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSavedFilters((prev) => prev.filter((filter) => filter.id !== id))
      toast.success('Filtro borrado')
    } catch {
      toast.error('No se pudo borrar el filtro')
    }
  }

  const quickSummary = useMemo(() => {
    return savedFilters.length === 0 ? 'Aún no tienes filtros guardados.' : `${savedFilters.length} filtro${savedFilters.length === 1 ? '' : 's'} guardado${savedFilters.length === 1 ? '' : 's'}`
  }, [savedFilters])

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 lg:px-6">
        <div>
          <Link href="/broker/crm/contactos" className="flex items-center gap-1.5 text-sm text-[#9C8578] hover:text-[#FAF6F2]">
            <ChevronLeft className="h-4 w-4" /> Volver a Contactos
          </Link>
          <h1 className="mt-3 text-2xl font-bold">Estados y filtros</h1>
          <p className="mt-1 text-sm text-[#9C8578]">Vistas rápidas y filtros guardados para trabajar más rápido.</p>
        </div>

        <section className="rounded-2xl border border-[#2D3C3C] bg-[#152022] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#FAF6F2]">Filtros estándar</h2>
              <p className="text-xs text-[#9C8578]">Vistas fijas para entrar directo al segmento correcto.</p>
            </div>
          </div>
          <div className="space-y-2">
            {STANDARD_VIEWS.map((view) => (
              <Link key={view.key} href={view.href} className="flex items-center justify-between rounded-xl border border-[#2D3C3C] px-3 py-2.5 text-sm text-[#FAF6F2] hover:bg-[#1C2828]">
                <span>{view.label}</span>
                <ChevronLeft className="h-4 w-4 rotate-180 text-[#9C8578]" />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#2D3C3C] bg-[#152022] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#FAF6F2]">Filtros guardados</h2>
              <p className="text-xs text-[#9C8578]">{quickSummary}</p>
            </div>
            <span className="rounded-full bg-[#2D3C3C] px-2.5 py-1 text-[11px] text-[#D5C3B6]">{savedFilters.length}</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl bg-[#1C2828]" />
              ))}
            </div>
          ) : savedFilters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2D3C3C] p-4 text-center text-sm text-[#9C8578]">
              Aún no guardaste un filtro. Puedes crearlos desde la vista de Contactos.
            </div>
          ) : (
            <div className="space-y-2">
              {savedFilters.map((filter) => (
                <div key={filter.id} className="flex items-center justify-between rounded-xl border border-[#2D3C3C] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-[#FAF6F2]">{filter.name}</p>
                    <p className="text-xs text-[#9C8578]">{Object.keys((filter.criteria ?? EMPTY_FILTER_CRITERIA) as ContactFilterCriteria).length} criterios</p>
                  </div>
                  <button type="button" onClick={() => handleDelete(filter.id)} className="rounded-full p-2 text-[#9C8578] hover:bg-[#1C2828] hover:text-[#C27F79]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
