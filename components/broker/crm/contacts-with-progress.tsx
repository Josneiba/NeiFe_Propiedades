'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, Star } from 'lucide-react'
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

const STAGE_LABELS: Record<string, string> = {
  NUEVO_LEAD: 'Nuevo lead',
  CONTACTO_INICIADO: 'Contactado',
  VISITA_AGENDADA: 'Visita agendada',
  OFERTA_RECIBIDA: 'Oferta recibida',
  DOCS_REVISION: 'Revisión docs',
  NEGOCIANDO: 'Negociando',
  FIRMA_CONTRATO: 'Firmando',
  ENTREGA_LLAVES: 'Entrega',
  ADMINISTRAR: 'Administrado',
}

export function ContactsWithProgress() {
  const [contacts, setContacts] = useState<HotContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/contact-suggestions')
        if (res.ok) {
          const data = await res.json()
          setContacts(Array.isArray(data) ? data : [])
        }
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-[#1a2a2a] animate-pulse" />
        ))}
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-[#9C8578]">
        ✨ Todos los contactos están al día
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#2D3C3C]">
      {contacts.slice(0, 5).map((c) => (
        <div key={c.contactId} className="flex items-start gap-3 py-3">
          {/* Urgency dot */}
          <div className="mt-1 shrink-0">
            <span className={cn('block w-2.5 h-2.5 rounded-full', URGENCY_DOT[c.urgency] ?? 'bg-[#9C8578]')} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/broker/crm/contactos/${c.contactId}`}
                className="text-sm font-semibold text-[#FAF6F2] hover:text-[#5E8B8C] transition-colors truncate"
              >
                {c.contactName}
              </Link>
              {c.successProbability >= 75 && (
                <Star className="w-3 h-3 text-[#B8965A] shrink-0" fill="#B8965A" />
              )}
            </div>

            <p className="text-xs text-[#9C8578] mt-0.5 truncate">{c.reason}</p>

            {c.dealCode && (
              <p className="text-xs text-[#9C8578] mt-0.5">
                {c.dealCode}
                {c.dealStage ? ` · ${STAGE_LABELS[c.dealStage] ?? c.dealStage}` : ''}
              </p>
            )}
          </div>

          {/* Action buttons */}
          {c.contactPhone && (
            <div className="flex items-center gap-1.5 shrink-0">
              <a href={`tel:${c.contactPhone}`}>
                <button className="h-8 w-8 rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] flex items-center justify-center text-[#9C8578] hover:text-[#FAF6F2] transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </a>
              <WhatsAppButton phone={c.contactPhone} size="sm" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
