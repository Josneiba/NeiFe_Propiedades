'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, CreditCard, Wrench, FileText, UserPlus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatDateCompact } from '@/lib/utils'

interface TimelineEvent {
  id: string
  type: 'PAYMENT' | 'MAINTENANCE' | 'CONTRACT' | 'ACTIVITY' | 'INVITATION'
  title: string
  description: string
  status?: string
  date: string
  icon: string
  color: string
}

interface Props {
  propertyId: string
}

const iconMap = {
  'credit-card': CreditCard,
  'wrench': Wrench,
  'file-text': FileText,
  'activity': Activity,
  'user-plus': UserPlus,
}

export function PropertyTimeline({ propertyId }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/timeline`)
        if (!res.ok) throw new Error('Failed to fetch timeline')
        const data = await res.json()
        setEvents(data.events || [])
      } catch (error) {
        console.error('Error fetching timeline:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTimeline()
  }, [propertyId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#2D3C3C] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#2D3C3C] rounded animate-pulse w-1/3" />
              <div className="h-3 bg-[#2D3C3C] rounded animate-pulse w-2/3" />
              <div className="h-3 bg-[#2D3C3C] rounded animate-pulse w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-10 text-center">
          <Activity className="h-12 w-12 text-[#9C8578] mx-auto mb-4 opacity-50" />
          <p className="text-[#9C8578]">Sin actividad registrada aún</p>
        </CardContent>
      </Card>
    )
  }

  const visibleEvents = events.slice(0, visibleCount)
  const hasMore = events.length > visibleCount

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Línea vertical conectora */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[rgba(213,195,182,0.15)]" />
        
        <div className="space-y-4">
          {visibleEvents.map((event, index) => {
            const IconComponent = iconMap[event.icon as keyof typeof iconMap] || Activity
            const isOverdue = event.type === 'PAYMENT' && event.status === 'OVERDUE'
            const isPendingPayment = event.type === 'PAYMENT' && event.status === 'PENDING'
            
            return (
              <div
                key={event.id}
                className={cn(
                  "flex gap-4 group hover:bg-[rgba(213,195,182,0.04)] rounded-lg p-2 -mx-2 transition-colors",
                  (isOverdue || isPendingPayment) && "border-l-2 border-[#C27F79] pl-3"
                )}
              >
                {/* Ícono en círculo */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{
                    backgroundColor: `${event.color}20`,
                  }}
                >
                  <IconComponent
                    className="h-4 w-4"
                    style={{
                      stroke: event.color,
                    }}
                  />
                </div>
                
                {/* Contenido del evento */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#FAF6F2]">{event.title}</p>
                  {event.description && (
                    <p className="text-sm text-[#9C8578] mt-1 line-clamp-2">{event.description}</p>
                  )}
                  <p className="text-xs text-[#D5C3B6] mt-1">
                    {formatDistanceToNow(new Date(event.date), { addSuffix: true, locale: es })} · {formatDateCompact(event.date)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 20)}
          className="w-full py-2 text-sm text-[#B8965A] hover:text-[#B8965A]/80 transition-colors"
        >
          Ver más actividad
        </button>
      )}
    </div>
  )
}

import { cn } from '@/lib/utils'
