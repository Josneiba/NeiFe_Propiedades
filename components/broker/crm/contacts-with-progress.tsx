'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface ContactProgressItem {
  id: string
  name: string
  contactCount: number
  lastContactedAt: string | null
}

export function ContactsWithProgress() {
  const [contacts, setContacts] = useState<ContactProgressItem[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/contacts?status=ACTIVE&limit=5')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setContacts(data.contacts ?? data)
      } catch (error) {
        console.error(error)
        toast.error('No se pudieron cargar contactos con progreso')
      }
    }

    load()
  }, [])

  return (
    <div className="grid gap-3">
      <Card className="bg-[#1a2a2a] border-[#2D3C3C]">
        <CardHeader>
          <CardTitle>Contactos con progreso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-[#D5C3B6]">No hay contactos recientes.</p>
          ) : (
            contacts.map((contact) => {
              const daysAgo = contact.lastContactedAt
                ? Math.floor((new Date().getTime() - new Date(contact.lastContactedAt).getTime()) / 86400000)
                : null
              return (
                <div key={contact.id} className="rounded-3xl border border-[#2D3C3C] bg-[#152022] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#FAF6F2]">{contact.name}</p>
                      <p className="text-xs text-[#9C8578]">{contact.contactCount} interacciones</p>
                    </div>
                    <span className="text-xs text-[#D5C3B6]">{daysAgo !== null ? `${daysAgo}d` : 'Sin contacto'}</span>
                  </div>
                  <Progress value={Math.min(100, contact.contactCount * 10)} className="mt-3 h-2 rounded-full bg-[#0f1b1b]" />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
