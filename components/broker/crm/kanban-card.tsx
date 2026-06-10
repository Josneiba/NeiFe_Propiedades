'use client'

import { useState } from 'react'
import { GripVertical, Eye, Trash2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export interface DealCard {
  id: string
  publicId: string
  title: string
  contact: {
    name: string
    type: 'OWNER' | 'TENANT' | 'BUYER' | 'INVESTOR'
  }
  property?: {
    name: string
    type: string
  }
  value?: number
  probability?: number
  score?: number
  stage: string
  daysInStage?: number
  nextFollowUp?: string
}

interface KanbanCardProps {
  deal: DealCard
  isDragging?: boolean
  onDelete?: (id: string) => void
  onMove?: (dealId: string, newStage: string) => void
}

const contactTypeColors: Record<string, string> = {
  OWNER: 'bg-blue-100 text-blue-800',
  TENANT: 'bg-green-100 text-green-800',
  BUYER: 'bg-purple-100 text-purple-800',
  INVESTOR: 'bg-orange-100 text-orange-800',
}

export function KanbanCard({ deal, isDragging, onDelete, onMove }: KanbanCardProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <Card
      className={`cursor-grab active:cursor-grabbing transition-all mb-3 ${
        isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header with drag handle and ID */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-gray-600">{deal.publicId}</div>
              <h4 className="font-semibold text-sm line-clamp-2">{deal.title}</h4>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                  ⋯
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/broker/crm/oportunidades/${deal.id}`} className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Ver Detalles</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(deal.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Contact info */}
        <div className="flex items-center gap-2">
          <Badge className={`${contactTypeColors[deal.contact.type]} text-xs`}>
            {deal.contact.type === 'OWNER'
              ? 'Propietario'
              : deal.contact.type === 'TENANT'
                ? 'Arrendatario'
                : deal.contact.type === 'BUYER'
                  ? 'Comprador'
                  : 'Inversor'}
          </Badge>
          <span className="text-xs font-medium truncate">{deal.contact.name}</span>
        </div>

        {/* Property if exists */}
        {deal.property && (
          <div className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded line-clamp-1">
            📍 {deal.property.name}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-1 pt-1 text-xs">
          {deal.value && (
            <div>
              <div className="text-gray-600">Valor</div>
              <div className="font-semibold">${deal.value.toLocaleString()}</div>
            </div>
          )}
          {deal.probability && (
            <div>
              <div className="text-gray-600">Prob.</div>
              <div className="font-semibold">{deal.probability}%</div>
            </div>
          )}
          {deal.daysInStage && (
            <div>
              <div className="text-gray-600">Días</div>
              <div className="font-semibold">{deal.daysInStage}d</div>
            </div>
          )}
        </div>

        {/* Days in stage warning */}
        {deal.daysInStage && deal.daysInStage > 30 && (
          <div className="text-xs text-orange-600 bg-orange-50 p-1.5 rounded">
            ⚠️ Más de {deal.daysInStage} días en esta etapa
          </div>
        )}

        {/* Next follow-up if exists */}
        {deal.nextFollowUp && (
          <div className="text-xs text-blue-600 bg-blue-50 p-1.5 rounded">
            📅 Seguimiento: {deal.nextFollowUp}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
