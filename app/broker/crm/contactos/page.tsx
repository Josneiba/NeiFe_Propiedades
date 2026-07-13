'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Star, Plus } from 'lucide-react'
import { ContactFilters } from '@/components/broker/crm/contact-filters'
import { ContactFilterSheet, EMPTY_FILTER_CRITERIA, type ContactFilterCriteria, type SavedFilter } from '@/components/broker/crm/contact-filter-sheet'
import { toast } from 'sonner'

interface DealSummary {
  deal: {
    id: string
    code: string
    title: string
    stage: string
    status: 'ACTIVE' | 'WON' | 'LOST'
    operationType: 'ARRIENDO' | 'VENTA' | 'AMBOS'
    wonAt: string | null
  }
}

interface Contact {
  id: string
  code: string
  name: string
  email: string | null
  phone: string | null
  type: 'PROPIETARIO' | 'ARRENDATARIO' | 'INVERSIONISTA' | 'LEAD'
  status: 'ACTIVE' | 'INACTIVE' | 'CONVERTED' | 'LOST'
  source: 'PORTAL' | 'REFERIDO' | 'RRSS' | 'LLAMADA_DIRECTA' | 'LETRERO' | 'OTRO'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  stallReason: string | null
  interestedCommune: string | null
  interestedPropertyType: string | null
  deals: DealSummary[]
  score: { score: number; recommendation: string } | null
}

const typeLabels: Record<string, string> = {
  PROPIETARIO: 'Propietario',
  ARRENDATARIO: 'Arrendatario',
  INVERSIONISTA: 'Inversionista',
  LEAD: 'Lead',
}

const stallReasonMeta: Record<string, { label: string; className: string }> = {
  NO_INTERESADO: { label: 'No interesado', className: 'bg-[#9C8578]/15 text-[#9C8578]' },
  SIN_CONTACTO_RECIENTE: { label: 'Sin contacto reciente', className: 'bg-[#B8965A]/15 text-[#B8965A]' },
  NO_CONTACTABLE: { label: 'No contactable', className: 'bg-[#5E8B8C]/15 text-[#5E8B8C]' },
  MUY_OCUPADO: { label: 'Muy ocupado', className: 'bg-[#C27F79]/15 text-[#C27F79]' },
}

const sourceLabels: Record<string, string> = {
  PORTAL: 'Portal',
  REFERIDO: 'Referido',
  RRSS: 'RRSS',
  LLAMADA_DIRECTA: 'Llamada directa',
  LETRERO: 'Letrero',
  OTRO: 'Otro',
}

function ContactStatusMarker({ contact }: { contact: Contact }) {
  if (contact.priority === 'HIGH') {
    return <Star className="h-4 w-4 shrink-0 fill-[#C27F79] text-[#C27F79]" />
  }
  if (contact.stallReason) {
    return <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#B8965A]" />
  }
  if (contact.status === 'CONVERTED') {
    return <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#5E8B8C]" />
  }
  if (contact.status === 'INACTIVE' || contact.status === 'LOST') {
    return <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#9C8578]/50" />
  }
  return <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#7FB8B9]" />
}

function countActiveFilters(criteria: ContactFilterCriteria) {
  let count = 0
  if (criteria.type !== 'all') count++
  if (criteria.status !== 'all') count++
  if (criteria.source !== 'all') count++
  if (criteria.priority !== 'all') count++
  if (criteria.operationType !== 'all') count++
  if (criteria.dealStatus !== 'all') count++
  if (criteria.wonBeforeDays !== 'all') count++
  if (criteria.interestedCommune.trim()) count++
  if (criteria.interestedPropertyType !== 'all') count++
  return count
}

export default function ContactosPage() {
  const searchParams = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [criteria, setCriteria] = useState<ContactFilterCriteria>(EMPTY_FILTER_CRITERIA)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [quickFilters, setQuickFilters] = useState<SavedFilter[]>([])

  useEffect(() => {
    const nextSearch = searchParams.get('q')?.toLowerCase() ?? ''
    setSearch(nextSearch)
    setCriteria((prev) => ({
      ...prev,
      type: searchParams.get('type')?.toUpperCase() ?? prev.type,
      status: searchParams.get('status')?.toUpperCase() ?? prev.status,
      source: searchParams.get('source')?.toUpperCase() ?? prev.source,
    }))
  }, [searchParams])

  const loadContacts = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/crm/contacts')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setContacts(data)
    } catch {
      toast.error('No se pudieron cargar los contactos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  useEffect(() => {
    async function loadQuickFilters() {
      try {
        const res = await fetch('/api/broker/crm/saved-filters')
        if (res.ok) {
          const data = await res.json()
          setQuickFilters(Array.isArray(data) ? data.slice(0, 6) : [])
        }
      } catch (error) {
        console.error(error)
      }
    }

    void loadQuickFilters()
  }, [])

  useEffect(() => {
    let filtered = contacts

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(q) ||
          contact.code.toLowerCase().includes(q) ||
          contact.email?.toLowerCase().includes(q) ||
          contact.phone?.includes(search)
      )
    }

    if (criteria.type !== 'all') filtered = filtered.filter((contact) => contact.type === criteria.type)
    if (criteria.status !== 'all') filtered = filtered.filter((contact) => contact.status === criteria.status)
    if (criteria.source !== 'all') filtered = filtered.filter((contact) => contact.source === criteria.source)
    if (criteria.priority !== 'all') filtered = filtered.filter((contact) => contact.priority === criteria.priority)

    if (criteria.operationType !== 'all') {
      filtered = filtered.filter((contact) => contact.deals.some((deal) => deal.deal.operationType === criteria.operationType))
    }
    if (criteria.dealStatus !== 'all') {
      filtered = filtered.filter((contact) => contact.deals.some((deal) => deal.deal.status === criteria.dealStatus))
    }
    if (criteria.wonBeforeDays !== 'all') {
      const thresholdMs = Number(criteria.wonBeforeDays) * 86_400_000
      filtered = filtered.filter((contact) =>
        contact.deals.some(
          (deal) => deal.deal.status === 'WON' && deal.deal.wonAt && Date.now() - new Date(deal.deal.wonAt).getTime() >= thresholdMs
        )
      )
    }
    if (criteria.interestedCommune.trim()) {
      const commune = criteria.interestedCommune.trim().toLowerCase()
      filtered = filtered.filter((contact) => contact.interestedCommune?.toLowerCase().includes(commune))
    }
    if (criteria.interestedPropertyType !== 'all') {
      filtered = filtered.filter((contact) => contact.interestedPropertyType === criteria.interestedPropertyType)
    }

    setFilteredContacts(filtered)
  }, [contacts, search, criteria])

  function handleReset() {
    setSearch('')
    setCriteria(EMPTY_FILTER_CRITERIA)
  }

  const groupedContacts = useMemo(() => {
    const groups = [
      {
        key: 'prospects',
        title: 'Prospectos',
        description: 'Contactos con intención temprana',
        predicate: (contact: Contact) => contact.type === 'LEAD' && contact.status === 'ACTIVE' && contact.priority !== 'HIGH',
      },
      {
        key: 'scheduled-visits',
        title: 'Visitas Programadas',
        description: 'Clientes con visita agendada',
        predicate: (contact: Contact) => contact.deals.some((deal) => deal.deal.stage === 'VISITA_AGENDADA'),
      },
      {
        key: 'documentation-pending',
        title: 'Documentación Pendiente',
        description: 'Faltan documentos para avanzar',
        predicate: (contact: Contact) => contact.deals.some((deal) => ['DOCS_REVISION', 'CONTACTO_INICIADO'].includes(deal.deal.stage)),
      },
      {
        key: 'contracts-pending',
        title: 'Contratos por Firmar',
        description: 'Interés con contrato listo para firmar',
        predicate: (contact: Contact) => contact.deals.some((deal) => ['FIRMA_CONTRATO', 'NEGOCIANDO'].includes(deal.deal.stage)),
      },
      {
        key: 'active-tenants',
        title: 'Arrendatarios Activos',
        description: 'Clientes con contrato vigente',
        predicate: (contact: Contact) => contact.type === 'ARRENDATARIO' && contact.status === 'ACTIVE',
      },
      {
        key: 'owners',
        title: 'Propietarios',
        description: 'Propietarios o dueños de cartera',
        predicate: (contact: Contact) => contact.type === 'PROPIETARIO',
      },
      {
        key: 'win-back',
        title: 'Para Recontactar',
        description: 'Negocios cerrados con éxito hace más de 6 meses',
        predicate: (contact: Contact) =>
          contact.deals.some(
            (deal) => deal.deal.status === 'WON' && deal.deal.wonAt && Date.now() - new Date(deal.deal.wonAt).getTime() >= 180 * 86_400_000
          ),
      },
      {
        key: 'inactive',
        title: 'Clientes Inactivos',
        description: 'Requieren reactivación (sin contacto, no contactable o no interesado)',
        predicate: (contact: Contact) => Boolean(contact.stallReason) || contact.status === 'INACTIVE',
      },
    ]

    return groups
      .map((group) => ({ ...group, contacts: filteredContacts.filter(group.predicate) }))
      .filter((group) => group.contacts.length > 0)
  }, [filteredContacts])

  const activeCount = filteredContacts.filter((contact) => contact.status === 'ACTIVE').length
  const highPriorityCount = filteredContacts.filter((contact) => contact.priority === 'HIGH').length
  const activeFilterCount = countActiveFilters(criteria)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#B8965A]">CRM · Personas</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#FAF6F2]">Contactos</h1>
        <p className="mt-1 text-xs text-[#9C8578]">
          {isLoading
            ? 'Cargando contactos...'
            : filteredContacts.length === 0
              ? 'Ajusta los filtros para ver más personas.'
              : `${activeCount} activos · ${highPriorityCount} de alta prioridad`}
        </p>
      </div>

      {quickFilters.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {quickFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCriteria(filter.criteria)}
              className="shrink-0 rounded-full border border-[#2D3C3C] bg-[#152022] px-3 py-1.5 text-xs font-medium text-[#D5C3B6] hover:border-[#5E8B8C]"
            >
              {filter.name}
            </button>
          ))}
        </div>
      )}

      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setSheetOpen(true)}
        onReset={handleReset}
      />

      <ContactFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        criteria={criteria}
        onApply={(next) => {
          setCriteria(next)
          setSheetOpen(false)
        }}
      />

      <div className="space-y-7">
        {groupedContacts.map((group) => (
          <section key={group.key}>
            <div className="flex items-center justify-between gap-3 border-b border-[#2D3C3C] pb-2">
              <div>
                <h2 className="text-sm font-semibold text-[#FAF6F2]">{group.title}</h2>
                <p className="text-xs text-[#9C8578]">{group.description}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-[#9C8578]">{group.contacts.length}</span>
            </div>

            <div>
              {group.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="-mx-2 flex items-start justify-between gap-3 rounded-lg border-b border-[#2D3C3C]/60 px-2 py-3.5 transition hover:bg-[#152022]/60"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <ContactStatusMarker contact={contact} />
                    <div className="min-w-0">
                      <Link
                        href={`/broker/crm/contactos/${contact.id}`}
                        className="text-[15px] font-medium text-[#FAF6F2] hover:text-[#7FB8B9]"
                      >
                        {contact.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="rounded-full bg-[#5E8B8C]/15 px-2 py-0.5 text-[#5E8B8C]">
                          {typeLabels[contact.type] ?? contact.type}
                        </span>
                        <span className="rounded-full bg-[#B8965A]/15 px-2 py-0.5 text-[#B8965A]">
                          {sourceLabels[contact.source] ?? contact.source}
                        </span>
                        {contact.stallReason && (
                          <span className={`rounded-full px-2 py-0.5 ${stallReasonMeta[contact.stallReason]?.className ?? 'bg-[#9C8578]/15 text-[#9C8578]'}`}>
                            {stallReasonMeta[contact.stallReason]?.label ?? contact.stallReason}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#9C8578]">
                        {contact.email || contact.phone || `${contact.deals.length} negociación${contact.deals.length === 1 ? '' : 'es'}`}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/broker/crm/contactos/${contact.id}`}
                    className="shrink-0 self-center text-xs font-medium text-[#9C8578] hover:text-[#7FB8B9]"
                  >
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}

        {!isLoading && groupedContacts.length === 0 && (
          <p className="py-8 text-center text-sm text-[#9C8578]">No hay contactos que coincidan con estos filtros.</p>
        )}
      </div>

      <Link
        href="/broker/crm/contactos/nuevo"
        aria-label="Nuevo contacto"
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5E8B8C] text-white shadow-lg shadow-[#1C2828]/40 transition hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
