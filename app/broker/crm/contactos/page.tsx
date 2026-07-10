'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Star } from 'lucide-react'
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

// Punto de estado a la izquierda del nombre — el mismo lenguaje visual que
// PME usa para marcar de un vistazo la situación de la persona (verde =
// activo normal, ámbar = necesita atención, estrella = alta prioridad).
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

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.includes(search)
      )
    }

    if (type !== 'all') {
      filtered = filtered.filter((c) => c.type === type.toUpperCase())
    }

    if (status !== 'all') {
      filtered = filtered.filter((c) => c.status === status.toUpperCase())
    }

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

  return (
    <div className="space-y-5">
      {/* Encabezado plano, sin recuadro contenedor — de borde a borde, igual que
          el resto de la app tras el rediseño de Indicadores Clave. */}
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

      <NewContactModal onCreated={loadContacts} variant="fab" />
    </div>
  )
}
