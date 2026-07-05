'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, MessageCircle, Mail, Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { TaskSuggestion } from '@/lib/task-engine'
import { cn } from '@/lib/utils'

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  TELEFONO: <Phone className="w-3 h-3" />,
  WHATSAPP: <MessageCircle className="w-3 h-3" />,
  EMAIL: <Mail className="w-3 h-3" />,
  PRESENCIAL: <Users className="w-3 h-3" />,
}

function urgencyColor(score: number) {
  if (score >= 70) return 'border-l-red-500 bg-red-950/20'
  if (score >= 40) return 'border-l-amber-500 bg-amber-950/20'
  return 'border-l-emerald-500 bg-emerald-950/20'
}

interface TaskQueueProps {
  suggestions: TaskSuggestion[]
  onComplete: (suggestion: TaskSuggestion) => Promise<void>
  onOpenDeal: (dealId: string) => void
}

export function TaskQueue({ suggestions, onComplete, onOpenDeal }: TaskQueueProps) {
  const [completing, setCompleting] = useState<string | null>(null)

  async function handleComplete(s: TaskSuggestion) {
    setCompleting(s.dealId)
    try {
      await onComplete(s)
      toast.success(`Tarea completada: ${s.title}`)
    } catch {
      toast.error('Error al completar la tarea')
    } finally {
      setCompleting(null)
    }
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#D5C3B6]/50 gap-3">
        <CheckCircle2 className="w-12 h-12" />
        <p className="text-sm">No hay tareas pendientes — ¡bien hecho!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {suggestions.map((s, i) => (
        <div
          key={`${s.dealId}-${i}`}
          className={cn(
            'border-l-4 rounded-r-lg p-3 cursor-pointer transition-all hover:scale-[1.01]',
            urgencyColor(s.urgencyScore)
          )}
          onClick={() => onOpenDeal(s.dealId)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-[#B8965A]">{s.dealCode}</span>
                <span className="text-xs text-[#D5C3B6]/60 truncate">{s.dealTitle}</span>
                {s.daysWithoutActivity > 0 && s.daysWithoutActivity < 999 && (
                  <span className="flex items-center gap-1 text-xs text-[#D5C3B6]/50">
                    <Clock className="w-3 h-3" />
                    {s.daysWithoutActivity}d
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-[#FAF6F2] mt-0.5">{s.title}</p>
              {s.description && (
                <p className="text-xs text-[#D5C3B6]/60 mt-0.5 line-clamp-1">{s.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {s.channel && (
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0.5 border-[#75524C]/40 text-[#D5C3B6]/70 gap-1"
                >
                  {CHANNEL_ICON[s.channel]}
                  {s.channel}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-[#5E8B8C] hover:text-[#FAF6F2] hover:bg-[#5E8B8C]/20"
                disabled={completing === s.dealId}
                onClick={(e) => {
                  e.stopPropagation()
                  handleComplete(s)
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {s.urgencyScore >= 70 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-400">{s.reason}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
