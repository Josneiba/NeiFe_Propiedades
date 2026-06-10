'use client'

import { DealCardData } from './kanban-card'
import { STAGE_COLUMNS } from '@/lib/crm-stage-utils'
import { Badge } from '@/components/ui/badge'

interface Props {
  deals: DealCardData[]
  onCardClick: (deal: DealCardData) => void
}

function getDaysSince(date: Date | null): number {
  if (!date) return 999
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
}

export function MobileListView({ deals, onCardClick }: Props) {
  return (
    <div className="space-y-3 px-4 pb-4">
      {deals.length === 0 ? (
        <div className="text-center py-8 text-[#9C8578] text-sm">
          Sin oportunidades activas
        </div>
      ) : (
        deals.map((deal) => {
          const stageConfig = STAGE_COLUMNS.find((s) => s.stage === deal.stage)!
          const daysSinceActivity = getDaysSince(deal.lastActivityAt)
          const primaryContact = deal.contacts.find((c) => c.isPrimary) || deal.contacts[0]

          return (
            <button
              key={deal.id}
              onClick={() => onCardClick(deal)}
              className="w-full text-left bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-3 hover:border-[#D5C3B6]/25 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-[#B8965A]">{deal.code}</span>
                    <Badge
                      variant="outline"
                      className="text-[9px] border-[#D5C3B6]/20 text-[#9C8578] py-0"
                      style={{ borderColor: stageConfig.color + '40', color: stageConfig.color }}
                    >
                      {stageConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-[#FAF6F2] line-clamp-1">{deal.title}</p>
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                  style={{
                    backgroundColor: daysSinceActivity > 5 ? '#ef4444' : daysSinceActivity > 2 ? '#f59e0b' : '#22c55e',
                  }}
                />
              </div>

              {deal.property && (
                <p className="text-[10px] text-[#9C8578] line-clamp-1 mb-2">📍 {deal.property.address}</p>
              )}

              {primaryContact && (
                <div className="flex items-center gap-2 text-[10px] text-[#D5C3B6]">
                  <span className="font-mono text-[#B8965A]">{primaryContact.contact.code}</span>
                  <span className="truncate">{primaryContact.contact.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#D5C3B6]/10 text-[10px] text-[#9C8578]">
                <span>
                  {deal.value ? `$${new Intl.NumberFormat('es-CL').format(deal.value)}` : '—'}
                </span>
                <span className={daysSinceActivity > 5 ? 'text-red-400' : ''}>
                  📅 {daysSinceActivity === 999 ? 'Sin actividad' : `${daysSinceActivity}d`}
                </span>
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}
