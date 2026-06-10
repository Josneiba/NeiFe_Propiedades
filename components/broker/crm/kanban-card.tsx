'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Copy } from 'lucide-react'
import { CrmDealStage } from '@prisma/client'

export interface DealCardData {
  id: string
  code: string
  title: string
  stage: CrmDealStage
  operationType: string
  value: number | null
  property: { code: string; address: string; type: string } | null
  contacts: Array<{
    contact: { id: string; code: string; name: string }
    role: string
    isPrimary: boolean
  }>
  lastActivityAt: Date | null
  daysInStage: number
}

interface KanbanCardProps {
  deal: DealCardData
  stageColor: string
  onClick: () => void
}

function getDaysSince(date: Date | null): number {
  if (!date) return 999
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
}

function UrgencyDot({ days }: { days: number }) {
  const color = days > 5 ? '#ef4444' : days > 2 ? '#f59e0b' : '#22c55e'
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
      title={`${days} días sin actividad`}
    />
  )
}

function copyToClipboard(text: string, e: React.MouseEvent) {
  e.stopPropagation()
  navigator.clipboard.writeText(text)
}

export function KanbanCard({ deal, stageColor, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    borderLeft: `3px solid ${stageColor}`,
  }

  const daysSinceActivity = getDaysSince(deal.lastActivityAt)
  const primaryContact = deal.contacts.find((c) => c.isPrimary) || deal.contacts[0]
  const secondaryContact = deal.contacts.find((c) => !c.isPrimary && c !== primaryContact)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#D5C3B6]/25 transition-all select-none"
      onClick={onClick}
    >
      {/* Header: código + urgencia */}
      <div className="flex items-center justify-between mb-1.5">
        <button
          className="font-mono text-[10px] text-[#B8965A] hover:text-[#D5C3B6] flex items-center gap-1 group"
          onClick={(e) => copyToClipboard(deal.code, e)}
          title="Copiar código"
        >
          {deal.code}
          <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <div className="flex items-center gap-1.5" {...listeners}>
          <UrgencyDot days={daysSinceActivity} />
        </div>
      </div>

      {/* Título */}
      <p className="text-xs font-semibold text-[#FAF6F2] line-clamp-2 mb-2 leading-snug">
        {deal.title}
      </p>

      {/* Propiedad */}
      {deal.property && (
        <div className="text-[10px] text-[#9C8578] bg-[#2D3C3C]/60 rounded px-2 py-1 mb-2 line-clamp-1">
          📍 {deal.property.address}
        </div>
      )}

      {/* Contactos */}
      {primaryContact && (
        <div className="space-y-0.5 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-[#B8965A] font-mono flex-shrink-0">
              {primaryContact.contact.code}
            </span>
            <span className="text-[10px] text-[#D5C3B6] truncate">
              {primaryContact.contact.name}
            </span>
          </div>
          {secondaryContact && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[#B8965A] font-mono flex-shrink-0">
                {secondaryContact.contact.code}
              </span>
              <span className="text-[10px] text-[#D5C3B6] truncate">
                {secondaryContact.contact.name}
              </span>
            </div>
          )}
          {deal.contacts.length > 2 && (
            <span className="text-[9px] text-[#9C8578]">+{deal.contacts.length - 2} más</span>
          )}
        </div>
      )}

      {/* Footer: valor + días */}
      <div className="flex items-center justify-between text-[10px] text-[#9C8578] pt-1 border-t border-[#D5C3B6]/10">
        <span>
          {deal.value
            ? `$${new Intl.NumberFormat('es-CL').format(deal.value)}` 
            : '—'}
        </span>
        <span className={daysSinceActivity > 5 ? 'text-red-400' : ''}>
          📅 {daysSinceActivity === 999 ? 'Sin actividad' : `${daysSinceActivity}d`}
        </span>
      </div>
    </div>
  )
}
