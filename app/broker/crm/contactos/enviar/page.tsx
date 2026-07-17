'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Mail, MessageCircle, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'

interface ContactOption {
  id: string
  name: string
  phone: string | null
  email: string | null
  dealId: string | null
}

export default function ContactSendPage() {
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [message, setMessage] = useState('Hola, te escribo desde NeiFe para avanzar con tu operación.')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await fetch('/api/crm/contacts')
        if (!res.ok) throw new Error()
        const data = await res.json()
        const list = (Array.isArray(data) ? data : [])
          .filter((item: any) => item.phone || item.email)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            phone: item.phone ?? null,
            email: item.email ?? null,
            dealId: item.deals?.[0]?.deal?.id ?? null,
          }))
        setContacts(list)
      } catch {
        toast.error('No se pudieron cargar los contactos')
      }
    }

    void loadContacts()
  }, [])

  const selectedContacts = useMemo(() => contacts.filter((contact) => selectedIds.includes(contact.id)), [contacts, selectedIds])

  function toggleSelection(contactId: string) {
    setSelectedIds((prev) => (prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]))
  }

  async function handleSend() {
    if (selectedContacts.length === 0) {
      toast.error('Selecciona al menos un contacto')
      return
    }

    setSending(true)
    try {
      if (channel === 'email') {
        const recipients = selectedContacts.filter((contact) => contact.email).map((contact) => contact.email)
        if (recipients.length === 0) {
          throw new Error('No hay correos válidos')
        }
        const mailto = `mailto:?bcc=${encodeURIComponent(recipients.join(','))}&subject=${encodeURIComponent('Contacto desde NeiFe')}&body=${encodeURIComponent(message)}`
        window.location.href = mailto
        toast.success('Se abrió el cliente de correo con los destinatarios cargados')
      } else {
        for (const contact of selectedContacts) {
          if (!contact.phone || !contact.dealId) continue
          const res = await fetch('/api/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SEND', dealId: contact.dealId, contactId: contact.id, message }),
          })
          if (!res.ok) {
            throw new Error('No se pudo enviar el WhatsApp')
          }
        }
        toast.success('Se enviaron los WhatsApp seleccionados')
      }
    } catch {
      toast.error('No se pudo completar el envío')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 lg:px-6">
        <div>
          <Link href="/broker/crm/contactos" className="flex items-center gap-1.5 text-sm text-[#9C8578] hover:text-[#FAF6F2]">
            <ChevronLeft className="h-4 w-4" /> Volver a Contactos
          </Link>
          <h1 className="mt-3 text-2xl font-bold">Enviar mensajes</h1>
          <p className="mt-1 text-sm text-[#9C8578]">Selecciona contactos y envía WhatsApp o email de forma masiva.</p>
        </div>

        <section className="rounded-2xl border border-[#2D3C3C] bg-[#152022] p-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setChannel('whatsapp')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${channel === 'whatsapp' ? 'bg-[#5E8B8C] text-[#0F1B1B]' : 'border border-[#2D3C3C] text-[#D5C3B6]'}`}>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </button>
            <button type="button" onClick={() => setChannel('email')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${channel === 'email' ? 'bg-[#C27F79] text-[#1C2828]' : 'border border-[#2D3C3C] text-[#D5C3B6]'}`}>
              <Mail className="h-4 w-4" /> Email
            </button>
          </div>

          <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-3 min-h-[96px] w-full rounded-xl border border-[#2D3C3C] bg-[#1C2828] px-3 py-2 text-sm text-[#FAF6F2]" placeholder="Mensaje para el contacto" />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#FAF6F2]">Contactos seleccionados</h2>
            <span className="text-xs text-[#9C8578]">{selectedContacts.length}/{contacts.length}</span>
          </div>

          <div className="space-y-2 rounded-2xl border border-[#2D3C3C] bg-[#152022] p-2">
            {contacts.map((contact) => (
              <label key={contact.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#2D3C3C] px-3 py-2.5 text-sm text-[#FAF6F2]">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleSelection(contact.id)} className="h-4 w-4 rounded border-[#2D3C3C] bg-[#1C2828]" />
                  <span>{contact.name}</span>
                </div>
                <span className="text-xs text-[#9C8578]">{channel === 'whatsapp' ? contact.phone ? 'WhatsApp' : 'Sin teléfono' : contact.email ? 'Mail' : 'Sin mail'}</span>
              </label>
            ))}
          </div>
        </section>

        <button type="button" disabled={sending} onClick={handleSend} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5E8B8C] px-4 py-3 text-sm font-semibold text-[#0F1B1B] disabled:opacity-60">
          <SendHorizonal className="h-4 w-4" /> {sending ? 'Enviando...' : channel === 'whatsapp' ? 'Enviar WhatsApp' : 'Abrir correo'}
        </button>
      </div>
    </div>
  )
}
