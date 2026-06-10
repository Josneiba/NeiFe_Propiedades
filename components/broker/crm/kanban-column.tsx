'use client'

import { useDroppable } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { KanbanCard, type DealCardData } from './kanban-card'
import { STAGE_COLUMNS } from '@/lib/crm-stage-utils'
import { CrmDealStage } from '@prisma/client'

interface KanbanColumnProps {
  stage: CrmDealStage
  deals: DealCardData[]
  onCardClick: (deal: DealCardData) => void
}

export function KanbanColumn({ stage, deals, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  const stageConfig = STAGE_COLUMNS.find((s) => s.stage === stage)!
  const isAdmin = stage === 'ADMINISTRAR'

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 flex flex-col rounded-xl transition-colors duration-150 ${
        isOver ? 'bg-[#D5C3B6]/10' : 'bg-transparent'
      }`}
      style={{ width: '240px', minHeight: '500px' }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-xl mb-2"
        style={{ backgroundColor: stageConfig.color + '22', borderTop: `3px solid ${stageConfig.color}` }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-[#FAF6F2]/80">
          {stageConfig.label}
        </span>
        <Badge
          variant="secondary"
          className="text-xs px-1.5 py-0"
          style={{ backgroundColor: stageConfig.color + '44', color: '#FAF6F2' }}
        >
          {deals.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 px-1">
        {deals.length === 0 ? (
          <div
            className={`flex items-center justify-center h-24 rounded-lg border-2 border-dashed transition-colors ${
              isOver ? 'border-[#5E8B8C] bg-[#5E8B8C]/5' : 'border-[#D5C3B6]/20'
            }`}
          >
            <p className="text-xs text-[#9C8578]">
              {isOver ? 'Soltar aquí' : 'Sin deals'}
            </p>
          </div>
        ) : (
          deals.map((deal) => (
            <KanbanCard
              key={deal.id}
              deal={deal}
              stageColor={stageConfig.color}
              onClick={() => onCardClick(deal)}
            />
          ))
        )}
      </div>
    </div>
  )
}
