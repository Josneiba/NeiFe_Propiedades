'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface ContactScore {
  score: number
  lastActivityDays: number | null
  recommendation: string | null
}

interface ContactProgressItem {
  id: string
  name: string
  score?: ContactScore | null
  urgencyLevel?: string | null
  deals?: { deal: { id: string } }[]
}

interface RecommendationItem {
  contactId?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
}

const URGENCY_COLOR: Record<string, string> = {
  HIGH: 'border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]',
  MEDIUM: 'border-[#B8965A]/30 bg-[#B8965A]/10 text-[#B8965A]',
  LOW: 'border-[#5E8B8C]/30 bg-[#5E8B8C]/10 text-[#5E8B8C]',
}

function urgencyLabel(level?: string) {
  switch (level) {
    case 'HIGH':
      return 'Urgente'
    case 'LOW':
      return 'Bajo'
    default:
      return 'Normal'
  }
}

function mapRecommendations(items: RecommendationItem[]) {
  return items.reduce<Record<string, RecommendationItem>>((acc, rec) => {
    if (!rec.contactId) return acc
    const existing = acc[rec.contactId]
    const priorityValue = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    if (!existing || priorityValue[rec.priority] > priorityValue[existing.priority]) {
      acc[rec.contactId] = rec
    }
    return acc
  }, {})
}

export function ContactsWithProgress() {
  const [contacts, setContacts] = useState<ContactProgressItem[]>([])
  const [recommendations, setRecommendations] = useState<Record<string, RecommendationItem>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [contactsRes, recommendationsRes] = await Promise.all([
          fetch('/api/crm/contacts?status=ACTIVE&limit=6'),
          fetch('/api/crm/recommendations'),
        ])

        if (!contactsRes.ok || !recommendationsRes.ok) {
          throw new Error('Error al cargar datos de inteligencia')
        }

        const contactsData = await contactsRes.json()
        const recommendationsData = await recommendationsRes.json()

        setContacts((contactsData.contacts ?? contactsData) as ContactProgressItem[])
        setRecommendations(mapRecommendations(recommendationsData as RecommendationItem[]))
      } catch (error) {
        console.error(error)
        toast.error('No se pudieron cargar contactos con progreso')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const urgencyOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      const aUrgency = a.urgencyLevel ? urgencyOrder[a.urgencyLevel] ?? 1 : urgencyOrder[recommendations[a.id]?.priority ?? 'MEDIUM']
      const bUrgency = b.urgencyLevel ? urgencyOrder[b.urgencyLevel] ?? 1 : urgencyOrder[recommendations[b.id]?.priority ?? 'MEDIUM']
      if (aUrgency !== bUrgency) return aUrgency - bUrgency
      return (b.score?.score ?? 0) - (a.score?.score ?? 0)
    })
  }, [contacts, recommendations])

  return (
    <Card className="bg-[#1a2a2a] border-[#2D3C3C]">
      <CardHeader>
        <CardTitle>Contactos con progreso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-[#D5C3B6]">Cargando contactos...</p>
        ) : sortedContacts.length === 0 ? (
          <p className="text-sm text-[#D5C3B6]">No hay contactos con datos de progreso.</p>
        ) : (
          sortedContacts.slice(0, 5).map((contact) => {
            const recommendation = contact.score?.recommendation ?? recommendations[contact.id]?.message
            const lastContacted = contact.score?.lastActivityDays == null
              ? 'Sin registro'
              : contact.score.lastActivityDays === 0
                ? 'Hoy'
                : `${contact.score.lastActivityDays}d`
            const scoreValue = contact.score?.score ?? 0
            const urgency = contact.urgencyLevel ?? recommendations[contact.id]?.priority ?? 'MEDIUM'

            return (
              <div key={contact.id} className="rounded-3xl border border-[#2D3C3C] bg-[#152022] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#FAF6F2] truncate">{contact.name}</p>
                    <p className="text-xs text-[#9C8578] mt-1 line-clamp-2">
                      {recommendation ?? 'Sin recomendación disponible'}
                    </p>
                  </div>
                  <div className="space-y-2 text-right">
                    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${URGENCY_COLOR[urgency]}`}>
                      {urgencyLabel(urgency)}
                    </span>
                    <p className="text-[11px] text-[#D5C3B6]">{lastContacted}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#D5C3B6]">
                  <span>{contact.deals?.length ?? 0} operación{contact.deals?.length === 1 ? '' : 'es'}</span>
                  <span>Puntaje {scoreValue}</span>
                </div>

                <Progress value={Math.min(100, Math.max(0, scoreValue))} className="mt-3 h-2 rounded-full bg-[#0f1b1b]" />
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
