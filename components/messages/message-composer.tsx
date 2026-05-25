"use client"

import { useState } from 'react'

export function MessageComposer({ propertyId }: { propertyId: string }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const send = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/messages/property/${propertyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) throw new Error('Failed')
      setText('')
      // let parent re-fetch via interval or you can trigger event
      window.dispatchEvent(new CustomEvent('neife:message-sent', { detail: { propertyId } }))
    } catch (e) {
      console.error(e)
      alert('Error al enviar el mensaje')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full bg-[#1C1917] border border-[#D5C3B6]/10 p-3 rounded-md text-[#FAF6F2]" placeholder="Escribe tu mensaje..." />
      <div className="flex justify-end mt-2">
        <button onClick={send} disabled={submitting} className="bg-[#5E8B8C] text-white px-4 py-2 rounded-md">{submitting ? 'Enviando...' : 'Enviar'}</button>
      </div>
    </div>
  )
}
