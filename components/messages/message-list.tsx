"use client"

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Msg {
  id: string
  senderId: string
  tenantId: string
  subject: string
  message: string
  isRead: boolean
  createdAt: string
  sender: { id: string; name: string }
}

export function MessageList({ propertyId }: { propertyId: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages/property/${propertyId}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setMessages(json.messages || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [propertyId])

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/messages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) })
      setMessages((prev) => prev.map(m => m.id === id ? { ...m, isRead: true } : m))
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="p-4 text-sm text-[#9C8578]">Cargando mensajes...</div>
  if (!messages.length) return <div className="p-4 text-sm text-[#9C8578]">Aún no hay mensajes</div>

  return (
    <div className="space-y-3 p-4">
      {messages.map((m) => (
        <div key={m.id} className={`rounded-lg p-3 ${m.isRead ? 'bg-[#1C1917]' : 'bg-[#2A2520] border border-[#B8965A]/10'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#FAF6F2]">{m.sender?.name || 'Usuario'}</p>
              <p className="text-xs text-[#9C8578] mt-1">{m.subject}</p>
              <p className="text-sm text-[#D5C3B6] mt-2">{m.message}</p>
              <p className="text-xs text-[#9C8578] mt-2">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: es })}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {!m.isRead && (
                <button onClick={() => markRead(m.id)} className="text-xs text-[#B8965A]">Marcar como leído</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
