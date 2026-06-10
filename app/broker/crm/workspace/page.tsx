'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { KanbanColumn } from '@/components/broker/crm/kanban-column'
import { Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface DealCard {
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

const PIPELINE_STAGES = [
  {
    id: 'PROSPECTING',
    name: 'Prospecting',
    label: 'Prospeccion',
    color: '#9333ea',
    textColor: 'text-purple-900',
    phase: 'PRE_VENTA',
  },
  {
    id: 'INITIAL_CONTACT',
    name: 'Initial Contact',
    label: 'Contacto Inicial',
    color: '#0ea5e9',
    textColor: 'text-blue-900',
    phase: 'PRE_VENTA',
  },
  {
    id: 'QUALIFIED',
    name: 'Qualified',
    label: 'Calificado',
    color: '#06b6d4',
    textColor: 'text-cyan-900',
    phase: 'VENTA',
  },
  {
    id: 'PROPOSAL',
    name: 'Proposal',
    label: 'Propuesta',
    color: '#14b8a6',
    textColor: 'text-teal-900',
    phase: 'VENTA',
  },
  {
    id: 'NEGOTIATION',
    name: 'Negotiation',
    label: 'Negociacion',
    color: '#f59e0b',
    textColor: 'text-amber-900',
    phase: 'VENTA',
  },
  {
    id: 'CLOSING',
    name: 'Closing',
    label: 'Cierre',
    color: '#10b981',
    textColor: 'text-emerald-900',
    phase: 'POST_VENTA',
  },
  {
    id: 'WON',
    name: 'Won',
    label: 'Ganado',
    color: '#22c55e',
    textColor: 'text-green-900',
    phase: 'ADMINISTRAR',
  },
  {
    id: 'LOST',
    name: 'Lost',
    label: 'Perdido',
    color: '#ef4444',
    textColor: 'text-red-900',
    phase: 'ADMINISTRAR',
  },
]

export default function WorkspacePage() {
  const { toast } = useToast()
  const [deals, setDeals] = useState<DealCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load deals
  useEffect(() => {
    const loadDeals = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/crm/deals')
        if (!res.ok) throw new Error('Error loading deals')
        const data = await res.json()

        // Mock data for now
        const mockDeals: DealCard[] = [
          {
            id: '1',
            publicId: 'OPE-001234',
            title: 'Venta Depto Providencia',
            contact: { name: 'Juan Pérez', type: 'BUYER' },
            property: { name: 'Av. Providencia 1234, Piso 5', type: 'Departamento' },
            value: 250000,
            probability: 80,
            stage: 'NEGOTIATION',
            daysInStage: 14,
          },
          {
            id: '2',
            publicId: 'OPE-001235',
            title: 'Arriendo Casa Ñuñoa',
            contact: { name: 'María García', type: 'TENANT' },
            property: { name: 'Calle Los Copihues 456, Ñuñoa', type: 'Casa' },
            value: 1500,
            probability: 60,
            stage: 'PROPOSAL',
            daysInStage: 8,
          },
          {
            id: '3',
            publicId: 'OPE-001236',
            title: 'Propiedad Nueva Propietario',
            contact: { name: 'Carlos Martínez', type: 'OWNER' },
            property: { name: 'Paseo Ahumada 789', type: 'Casa' },
            value: 500000,
            probability: 40,
            stage: 'QUALIFIED',
            daysInStage: 35,
          },
          {
            id: '4',
            publicId: 'OPE-001237',
            title: 'Compra Oficina Centro',
            contact: { name: 'Pedro López', type: 'BUYER' },
            stage: 'PROSPECTING',
            value: 750000,
            probability: 20,
            daysInStage: 45,
          },
        ]

        setDeals(mockDeals)
      } catch (error) {
        console.error('Error loading deals:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las oportunidades',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDeals()
  }, [toast])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeStage = deals.find((d) => d.id === active.id)?.stage
      const newStage = PIPELINE_STAGES.find((s) => s.id === over.id)?.id

      if (activeStage && newStage && activeStage !== newStage) {
        // Optimistic update
        setDeals(
          deals.map((d) =>
            d.id === active.id
              ? { ...d, stage: newStage }
              : d
          )
        )

        try {
          // Call API to update deal stage
          const res = await fetch(`/api/crm/deals/${active.id}/stage`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: newStage }),
          })

          if (!res.ok) throw new Error('Error updating deal stage')

          toast({
            title: 'Éxito',
            description: 'Oportunidad movida correctamente',
          })
        } catch (error) {
          // Revert on error
          setDeals(
            deals.map((d) =>
              d.id === active.id
                ? { ...d, stage: activeStage }
                : d
            )
          )
          toast({
            title: 'Error',
            description: 'No se pudo actualizar la oportunidad',
            variant: 'destructive',
          })
        }
      }
    }
  }

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta oportunidad?')) return

    try {
      const res = await fetch(`/api/crm/deals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting deal')

      setDeals(deals.filter((d) => d.id !== id))
      toast({
        title: 'Éxito',
        description: 'Oportunidad eliminada correctamente',
      })
    } catch (error) {
      console.error('Error deleting deal:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la oportunidad',
        variant: 'destructive',
      })
    }
  }

  // Group deals by stage
  const dealsByStage = PIPELINE_STAGES.reduce(
    (acc, stage) => ({
      ...acc,
      [stage.id]: deals.filter((d) => d.stage === stage.id),
    }),
    {} as Record<string, DealCard[]>
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspace - Pipeline</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus oportunidades arrastrando entre etapas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button asChild size="sm">
            <Link href="/broker/crm/oportunidades/nueva" className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Oportunidad
            </Link>
          </Button>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex gap-1 bg-gray-50 p-3 rounded-lg border">
        {['PRE_VENTA', 'VENTA', 'POST_VENTA', 'ADMINISTRAR'].map((phase) => {
          const color = {
            PRE_VENTA: 'bg-purple-100 text-purple-800',
            VENTA: 'bg-blue-100 text-blue-800',
            POST_VENTA: 'bg-green-100 text-green-800',
            ADMINISTRAR: 'bg-gray-100 text-gray-800',
          }[phase]

          const label = {
            PRE_VENTA: 'Pre-Venta',
            VENTA: 'Venta',
            POST_VENTA: 'Post-Venta',
            ADMINISTRAR: 'Administrar',
          }[phase]

          return (
            <div
              key={phase}
              className={`px-3 py-1.5 rounded text-sm font-medium ${color}`}
            >
              {label}
            </div>
          )
        })}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-600">Cargando oportunidades...</p>
          </div>
        </div>
      ) : (
        /* Kanban Board */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={{
                    ...stage,
                    dealCount: dealsByStage[stage.id].length,
                  }}
                  deals={dealsByStage[stage.id]}
                  onDeleteDeal={handleDeleteDeal}
                />
              ))}
            </div>
          </div>
        </DndContext>
      )}

      {/* Summary */}
      {!isLoading && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
          Total de oportunidades: <span className="font-semibold">{deals.length}</span>
        </div>
      )}
    </div>
  )
}
