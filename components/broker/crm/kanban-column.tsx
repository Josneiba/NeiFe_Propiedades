'use client'

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KanbanCard, type DealCard } from './kanban-card'

interface KanbanColumnProps {
  stage: {
    id: string
    name: string
    label: string
    color: string
    textColor: string
    dealCount: number
  }
  deals: DealCard[]
  onDeleteDeal?: (id: string) => void
  onMoveDeal?: (dealId: string, newStage: string) => void
}

export function KanbanColumn({
  stage,
  deals,
  onDeleteDeal,
  onMoveDeal,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useSortable({
    id: stage.id,
    data: {
      type: 'Column',
      stage: stage.id,
    },
  })

  const dealIds = deals.map((d) => d.id)

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[350px] transition-colors rounded-lg ${
        isOver ? 'bg-gray-100' : ''
      }`}
    >
      <Card className="h-full flex flex-col border-t-4" style={{ borderTopColor: stage.color }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{stage.label}</CardTitle>
              <Badge variant="secondary">{stage.dealCount}</Badge>
            </div>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
              title={stage.id}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-0 pr-2">
          <SortableContext
            items={dealIds}
            strategy={verticalListSortingStrategy}
            id={stage.id}
          >
            <div className="space-y-3">
              {deals.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">Sin oportunidades</p>
                    <p className="text-xs">Arrastra aquí para agregar</p>
                  </div>
                </div>
              ) : (
                deals.map((deal) => (
                  <KanbanCard
                    key={deal.id}
                    deal={deal}
                    onDelete={onDeleteDeal}
                    onMove={onMoveDeal}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}
