'use client'

import { useState, useEffect } from 'react'
import { ContactsTable } from '@/components/broker/crm/contacts-table'
import { ContactFilters } from '@/components/broker/crm/contact-filters'
import { NewContactModal } from '@/components/broker/crm/new-contact-modal'
import { useToast } from '@/hooks/use-toast'

interface Contact {
  id: string
  publicId: string
  name: string
  email: string | null
  phone: string | null
  type: 'OWNER' | 'TENANT' | 'BUYER' | 'INVESTOR'
  status: string
  priority: 'HIGH' | 'NORMAL' | 'LOW'
  linkedProperties: number
  lastActivity?: string
  score?: number
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
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters state
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/crm/contacts')
        if (!res.ok) throw new Error('Error loading contacts')
        const data = await res.json()
        
        // Mock data for now until contacts API is fully working
        const mockContacts: Contact[] = [
          {
            id: '1',
            publicId: 'LEAD-001234',
            name: 'Juan Pérez López',
            email: 'juan@ejemplo.com',
            phone: '+56 9 1234 5678',
            type: 'OWNER',
            status: 'ACTIVE',
            priority: 'HIGH',
            linkedProperties: 3,
          },
          {
            id: '2',
            publicId: 'LEAD-001235',
            name: 'María García Rodríguez',
            email: 'maria@ejemplo.com',
            phone: '+56 9 2345 6789',
            type: 'TENANT',
            status: 'INTERESTED',
            priority: 'NORMAL',
            linkedProperties: 1,
          },
          {
            id: '3',
            publicId: 'LEAD-001236',
            name: 'Carlos Martínez',
            email: null,
            phone: '+56 9 3456 7890',
            type: 'BUYER',
            status: 'NEGOTIATING',
            priority: 'HIGH',
            linkedProperties: 2,
          },
        ]
        
        setContacts(mockContacts)
      } catch (error) {
        console.error('Error loading contacts:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los contactos',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadContacts()
  }, [toast])

  // Apply filters
  useEffect(() => {
    let filtered = contacts

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.publicId.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Type filter
    if (type !== 'all') {
      filtered = filtered.filter((c) => c.type === type)
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter((c) => c.status === status)
    }

    // Priority filter
    if (priority !== 'all') {
      filtered = filtered.filter((c) => c.priority === priority)
    }

    setFilteredContacts(filtered)
  }, [contacts, search, type, status, priority])

  const handleCreateContact = async (data: NewContactFormData) => {
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Error creating contact')
      
      const newContact = await res.json()
      setContacts([...contacts, newContact])
      
      toast({
        title: 'Éxito',
        description: 'Contacto creado correctamente',
      })
    } catch (error) {
      console.error('Error creating contact:', error)
      toast({
        title: 'Error',
        description: 'No se pudo crear el contacto',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contacto?')) return

    try {
      const res = await fetch(`/api/crm/contacts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting contact')

      setContacts(contacts.filter((c) => c.id !== id))
      toast({
        title: 'Éxito',
        description: 'Contacto eliminado correctamente',
      })
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el contacto',
        variant: 'destructive',
      })
    }
  }

  const handleReset = () => {
    setSearch('')
    setType('all')
    setStatus('all')
    setPriority('all')
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
        priority={priority}
        onPriorityChange={setPriority}
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
