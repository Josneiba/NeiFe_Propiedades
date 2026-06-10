'use client'

import { useState, useEffect, useCallback } from 'react'
import { ContactsTable } from '@/components/broker/crm/contacts-table'
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
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
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

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters state
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')

  const loadContacts = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (type !== 'all') params.set('type', type.toUpperCase())
      if (status !== 'all') params.set('status', status.toUpperCase())
      
      const res = await fetch(`/api/crm/contacts?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setContacts(data)
    } catch {
      toast.error('No se pudieron cargar los contactos')
    } finally {
      setIsLoading(false)
    }
  }, [search, type, status])

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

    setFilteredContacts(filtered)
  }, [contacts, search, type, status])

  const handleCreateContact = async (data: NewContactFormData) => {
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error()
      
      const newContact = await res.json()
      setContacts([...contacts, newContact])
      
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
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contactos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todos tus contactos en un solo lugar
          </p>
        </div>
        <NewContactModal onCreateContact={handleCreateContact} />
      </div>

      {/* Filters */}
      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        type={type}
        onTypeChange={setType}
        status={status}
        onStatusChange={setStatus}
        priority="all"
        onPriorityChange={() => {}}
        onReset={handleReset}
      />

      {/* Results info */}
      <div className="text-sm text-gray-600">
        Mostrando {filteredContacts.length} de {contacts.length} contactos
      </div>

      {/* Table */}
      <ContactsTable
        contacts={filteredContacts}
        isLoading={isLoading}
        onDelete={handleDeleteContact}
      />
    </div>
  )
}
