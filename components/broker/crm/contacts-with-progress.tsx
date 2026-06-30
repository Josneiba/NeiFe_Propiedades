'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WhatsAppButton } from '@/components/broker/crm/whatsapp-button'
import { cn } from '@/lib/utils'

interface HotContact {
  contactId: string
  contactName: string
  contactPhone: string | null
  dealCode?: string | null
  dealStage?: string | null
  daysWithoutContact: number
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  successProbability: number
  reason: string
  suggestedAction: string
}

const URGENCY_DOT: Record<string, string> = {
  HIGH: 'bg-red-400',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-emerald-400',
}

export function ContactsWithProgress() {
  const [contacts, setContacts] = useState<HotContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/contact-suggestions')
        if (!res.ok) throw new Error('Error al cargar contactos con progreso')
        const data = await res.json()
        setContacts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] animate-pulse" />
        ))}
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#2D3C3C] bg-[#1a2a2a] py-8 text-center text-sm text-[#9C8578]">
        ✨ Todos los contactos están al día
      </div>
    )
  }

  return (
    <Card className="bg-[#1a2a2a] border-[#2D3C3C]">
      <CardHeader>
        <CardTitle>Contactos con progreso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.slice(0, 5).map((contact) => (
          <div
            key={contact.contactId}
            className="grid gap-3 rounded-3xl border border-[#2D3C3C] bg-[#152022] p-4 sm:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', URGENCY_DOT[contact.urgency] ?? 'bg-[#9C8578]')} />
                <Link href={`/broker/crm/contactos/${contact.contactId}`} className="text-sm font-semibold text-[#FAF6F2] truncate hover:text-[#B8965A]">
                  {contact.contactName}
                </Link>
              </div>
              <p className="mt-1 text-xs text-[#9C8578] truncate">{contact.reason}</p>
              <p className="mt-1 text-xs text-[#9C8578]">
                {contact.daysWithoutContact === 0
                  ? 'Contactado hoy'
                  : contact.daysWithoutContact === 1
                  ? 'Hace 1 día'
                  : `Hace ${contact.daysWithoutContact} días`}
              </p>
              <p className="mt-2 text-xs text-[#D5C3B6] truncate">
                {contact.dealCode ? `${contact.dealCode} · ${contact.dealStage ?? 'Sin etapa'}` : 'Sin operación activa'}
              </p>
            </div>

            <div className="flex flex-col gap-2 items-end justify-between">
              <span
                className={cn(
                  'rounded-full px-2 py-1 text-[10px] font-semibold uppercase',
                  contact.successProbability >= 70
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : contact.successProbability >= 50
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'bg-[#9C8578]/10 text-[#9C8578]',
                )}
              >
                {contact.successProbability}%
              </span>
              <div className="flex items-center gap-2">
                {contact.contactPhone ? (
                  <a href={`tel:${contact.contactPhone}`} className="h-9 w-9 rounded-xl border border-[#2D3C3C] bg-[#132023] flex items-center justify-center text-[#9C8578] hover:text-[#FAF6F2] transition">
                    <Phone className="w-4 h-4" />
                  </a>
                ) : null}
                {contact.contactPhone ? <WhatsAppButton phone={contact.contactPhone} size="sm" /> : null}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
