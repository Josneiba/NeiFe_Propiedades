'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ContactFilters } from '@/components/broker/crm/contact-filters'
import { NewContactModal } from '@/components/broker/crm/new-contact-modal'
import { toast } from 'sonner'

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
  deals: Array<{ deal: { id: string; code: string; title: string; stage: string } }>
  score: { score: number; recommendation: string } | null
}

interface NewContactFormData {
  name: string
  email?: string
  phone?: string
  type: 'OWNER' | 'TENANT' | 'BUYER' | 'INVESTOR'
  status: string
  priority: 'HIGH' | 'NORMAL' | 'LOW'
  notes?: string
}

const typeLabels: Record<string, string> = {
  PROPIETARIO: 'Propietario',
  ARRENDATARIO: 'Arrendatario',
  INVERSIONISTA: 'Inversionista',
  LEAD: 'Lead',
}

const sourceLabels: Record<string, string> = {
  PORTAL: 'Portal',
  REFERIDO: 'Referido',
  RRSS: 'RRSS',
  LLAMADA_DIRECTA: 'Llamada directa',
  LETRERO: 'Letrero',
  OTRO: 'Otro',
}

export default function ContactosPage() {
  const searchParams = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters state
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [source, setSource] = useState('all')

  useEffect(() => {
    const nextType = searchParams.get('type')?.toLowerCase() ?? 'all'
    const nextStatus = searchParams.get('status')?.toLowerCase() ?? 'all'
    const nextSource = searchParams.get('source')?.toLowerCase() ?? 'all'
    const nextSearch = searchParams.get('q')?.toLowerCase() ?? ''

    setType(nextType)
    setStatus(nextStatus)
    setSource(nextSource)
    setSearch(nextSearch)
  }, [searchParams])

  const loadContacts = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (type !== 'all') params.set('type', type.toUpperCase())
      if (status !== 'all') params.set('status', status.toUpperCase())
      if (source !== 'all') params.set('source', source.toUpperCase())

      const res = await fetch(`/api/crm/contacts?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setContacts(data)
    } catch {
      toast.error('No se pudieron cargar los contactos')
    } finally {
      setIsLoading(false)
    }
  }, [search, type, status, source])

  useEffect(() => { loadContacts() }, [loadContacts])

  // Apply filters
  useEffect(() => {
    let filtered = contacts

    // Search filter (client-side fallback)
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.includes(search)
      )
    }

    // Type filter
    if (type !== 'all') {
      filtered = filtered.filter((c) => c.type === type.toUpperCase())
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter((c) => c.status === status.toUpperCase())
    }

    // Source filter
    if (source !== 'all') {
      filtered = filtered.filter((c) => c.source === source.toUpperCase())
    }

    setFilteredContacts(filtered)
  }, [contacts, search, type, status, source])

  const handleCreateContact = async (data: NewContactFormData) => {
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error()

      const newContact = await res.json()
      setContacts((prev) => [newContact, ...prev])

      toast.success('Contacto creado correctamente')
    } catch {
      toast.error('No se pudo crear el contacto')
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contacto?')) return

    try {
      const res = await fetch(`/api/crm/contacts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()

      setContacts(contacts.filter((c) => c.id !== id))
      toast.success('Contacto eliminado correctamente')
    } catch {
      toast.error('No se pudo eliminar el contacto')
    }
  }

  const handleReset = () => {
    setSearch('')
    setType('all')
    setStatus('all')
    setSource('all')
  }

  const groupedContacts = useMemo(() => {
    const groups = [
      {
        key: 'high-priority',
        title: 'Prioridad alta',
        description: 'Requieren seguimiento inmediato',
        predicate: (contact: Contact) => contact.priority === 'HIGH',
      },
      {
        key: 'active',
        title: 'En seguimiento',
        description: 'Contactos activos con oportunidad',
        predicate: (contact: Contact) => contact.status === 'ACTIVE' && contact.priority !== 'HIGH' && !contact.stallReason,
      },
      {
        key: 'stalled',
        title: 'Sin contacto reciente',
        description: 'Necesitan reactivación',
        predicate: (contact: Contact) => contact.status !== 'ACTIVE' || Boolean(contact.stallReason),
      },
    ]

    return groups
      .map((group) => ({ ...group, contacts: filteredContacts.filter(group.predicate) }))
      .filter((group) => group.contacts.length > 0)
  }, [filteredContacts])

  const stalledCount = filteredContacts.filter((contact) => Boolean(contact.stallReason) || contact.status === 'INACTIVE').length

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#D5C3B6]/10 bg-[#1C2828] p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#B8965A]">CRM · Personas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#FAF6F2]">Contactos</h1>
          <p className="mt-1 text-sm text-[#9C8578]">
            {filteredContacts.length === 0
              ? 'Ajusta los filtros para ver más personas.'
              : `${filteredContacts.length} contactos listos para seguir, con ${stalledCount} que necesitan reactivación.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] px-3 py-2 text-sm text-[#FAF6F2]">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#9C8578]">Activos</span>
            <span className="mt-1 block font-semibold">{filteredContacts.filter((contact) => contact.status === 'ACTIVE').length}</span>
          </div>
          <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] px-3 py-2 text-sm text-[#FAF6F2]">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#9C8578]">Alta prioridad</span>
            <span className="mt-1 block font-semibold">{filteredContacts.filter((contact) => contact.priority === 'HIGH').length}</span>
          </div>
        </div>
      </div>

      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        type={type}
        onTypeChange={setType}
        status={status}
        onStatusChange={setStatus}
        source={source}
        onSourceChange={setSource}
        priority="all"
        onPriorityChange={() => {}}
        onReset={handleReset}
      />

      <div className="space-y-4">
        {groupedContacts.map((group) => (
          <section key={group.key} className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C2828] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#FAF6F2]">{group.title}</h2>
                <p className="text-sm text-[#9C8578]">{group.description}</p>
              </div>
              <span className="rounded-full border border-[#D5C3B6]/10 bg-[#2D3C3C] px-3 py-1 text-sm text-[#FAF6F2]">{group.contacts.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {group.contacts.map((contact) => (
                <div key={contact.id} className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/70 p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <Link href={`/broker/crm/contactos/${contact.id}`} className="text-sm font-semibold text-[#FAF6F2] transition-colors hover:text-[#5E8B8C]">
                        {contact.name}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#D5C3B6]">
                        <span className="rounded-full bg-[#5E8B8C]/15 px-2.5 py-1 text-[#5E8B8C]">{typeLabels[contact.type] ?? contact.type}</span>
                        <span className="rounded-full bg-[#B8965A]/15 px-2.5 py-1 text-[#B8965A]">{sourceLabels[contact.source] ?? contact.source}</span>
                        {contact.priority === 'HIGH' && <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-red-400">Alta prioridad</span>}
                        {contact.stallReason && <span className="rounded-full bg-[#9C8578]/15 px-2.5 py-1 text-[#9C8578]">Sin contacto reciente</span>}
                      </div>
                      <p className="mt-2 text-sm text-[#9C8578]">
                        {contact.email || contact.phone || `${contact.deals.length} negociación${contact.deals.length === 1 ? '' : 'es'}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link href={`/broker/crm/contactos/${contact.id}`} className="rounded-full border border-[#D5C3B6]/10 bg-[#1C2828] px-3 py-1.5 text-sm text-[#FAF6F2] transition-colors hover:border-[#5E8B8C]/40 hover:text-[#5E8B8C]">
                        Ver
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <NewContactModal onCreated={loadContacts} variant="fab" />
    </div>
  )
}
