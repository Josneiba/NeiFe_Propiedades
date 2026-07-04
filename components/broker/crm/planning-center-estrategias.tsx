'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Zap, TrendingUp, AlertCircle, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Strategy {
  id: string
  type: string
  name: string
  goalDescription?: string | null
  targetNumber?: number | null
  expectedConversion?: number | null
  actualConversion?: number
  activities: Array<{
    id: string
    title: string
    isCompleted: boolean
    dueDate?: string | null
  }>
  pipelineContribution?: {
    count: number
    attribution: string
  }
  createdAt?: string
  updatedAt?: string
}

const strategyTypeLabels: Record<string, string> = {
  CAPTACION_PROPIEDADES: 'Captación de Propiedades',
  GENERACION_LEADS: 'Generación de Leads',
  MARKETING: 'Marketing',
  REFERIDOS: 'Referidos',
  REACTIVACION: 'Reactivación',
  INVERSIONISTAS: 'Inversionistas',
  OPEN_HOUSE: 'Open House',
  ALIANZAS: 'Alianzas',
}

export function EstrategiasTab() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewStrategy, setShowNewStrategy] = useState(false)
  const [formData, setFormData] = useState({
    type: 'GENERACION_LEADS',
    name: '',
    goalDescription: '',
    targetNumber: '',
    expectedConversion: '',
  })

  useEffect(() => {
    loadStrategies()
  }, [])

  async function loadStrategies() {
    try {
      setLoading(true)
      const res = await fetch('/api/crm/strategies')
      if (!res.ok) throw new Error('No se pudieron cargar las estrategias')
      const data = await res.json()
      setStrategies(data.strategies || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function createStrategy() {
    try {
      const res = await fetch('/api/crm/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          goalDescription: formData.goalDescription || null,
          targetNumber: formData.targetNumber ? Number(formData.targetNumber) : null,
          expectedConversion: formData.expectedConversion ? Number(formData.expectedConversion) / 100 : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Estrategia creada')
      setShowNewStrategy(false)
      setFormData({
        type: 'GENERACION_LEADS',
        name: '',
        goalDescription: '',
        targetNumber: '',
        expectedConversion: '',
      })
      void loadStrategies()
    } catch {
      toast.error('No se pudo crear la estrategia')
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-[#1C2828] border border-[#D5C3B6]/10 p-8 text-center text-[#9C8578]">
        Cargando estrategias...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-200">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#FAF6F2]">Gestión de Estrategias Comerciales</h2>
          <p className="mt-1 text-sm text-[#D5C3B6]/70">Define y monitorea tus estrategias de venta</p>
        </div>
        <Button 
          onClick={() => setShowNewStrategy(true)}
          className="gap-2 bg-[#5E8B8C] hover:bg-[#4A7278] text-[#FAF6F2]"
        >
          <Plus className="h-4 w-4" />
          Nueva Estrategia
        </Button>
      </div>

      {strategies.length === 0 ? (
        <div className="rounded-lg bg-[#1C2828] border border-[#D5C3B6]/10 p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-[#5E8B8C]/10 p-3">
                <AlertCircle className="h-6 w-6 text-[#5E8B8C]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[#FAF6F2]">No hay estrategias definidas</h3>
            <p className="mt-2 text-sm text-[#D5C3B6]/70">
              Crea tu primera estrategia comercial para comenzar a gestionar tus actividades de ventas
            </p>
            <Button 
              onClick={() => setShowNewStrategy(true)}
              className="mt-4 gap-2 bg-[#5E8B8C] hover:bg-[#4A7278] text-[#FAF6F2]"
            >
              <Plus className="h-4 w-4" />
              Crear Estrategia
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="rounded-lg bg-[#1C2828] border border-[#5E8B8C]/20 p-4 hover:border-[#5E8B8C]/40 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#FAF6F2]">{strategy.name}</h3>
                  <p className="text-xs text-[#D5C3B6]/70 mt-1">{strategyTypeLabels[strategy.type] || strategy.type}</p>
                </div>
                <Badge variant="outline" className="border-[#5E8B8C]/30 text-[#5E8B8C]">Activa</Badge>
              </div>
              <div className="space-y-2 mb-4">
                <div className="text-xs">
                  <span className="text-[#9C8578]">Actividades:</span>
                  <span className="ml-2 text-[#FAF6F2]">{strategy.activities.length}</span>
                </div>
                {strategy.targetNumber && (
                  <div className="text-xs">
                    <span className="text-[#9C8578]">Meta:</span>
                    <span className="ml-2 text-[#FAF6F2]">{strategy.targetNumber}</span>
                  </div>
                )}
                {strategy.expectedConversion !== undefined && strategy.expectedConversion !== null && (
                  <div className="text-xs">
                    <span className="text-[#9C8578]">Conversión esperada:</span>
                    <span className="ml-2 text-[#FAF6F2]">{Math.round(strategy.expectedConversion * 100)}%</span>
                  </div>
                )}
                {strategy.actualConversion !== undefined && strategy.actualConversion > 0 && (
                  <div className="text-xs">
                    <span className="text-[#9C8578]">Conversión real:</span>
                    <span className="ml-2 text-[#5E8B8C]">{Math.round(strategy.actualConversion * 100)}%</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 text-xs">
                <Button variant="outline" size="sm" className="flex-1 border-[#D5C3B6]/20 text-[#5E8B8C] hover:text-[#D8F0EE]">
                  Ver detalles
                </Button>
                <Button variant="outline" size="sm" className="flex-1 border-[#D5C3B6]/20">
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={showNewStrategy} onOpenChange={setShowNewStrategy}>
        <SheetContent side="right" className="w-full border-l border-[#2D3C3C] bg-[#1C2828] text-[#FAF6F2] sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-[#FAF6F2]">Nueva Estrategia</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.1em] text-[#9C8578]">Nombre</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej. Prospección Q1 2026"
                className="mt-2 bg-[#0f1b1b] border-[#D5C3B6]/10 text-[#FAF6F2]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.1em] text-[#9C8578]">Tipo</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger className="mt-2 bg-[#0f1b1b] border-[#D5C3B6]/10 text-[#FAF6F2]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/10">
                  {Object.entries(strategyTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-[#FAF6F2]">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.1em] text-[#9C8578]">Descripción de Meta</label>
              <Input 
                value={formData.goalDescription}
                onChange={(e) => setFormData({...formData, goalDescription: e.target.value})}
                placeholder="Detalles de la estrategia"
                className="mt-2 bg-[#0f1b1b] border-[#D5C3B6]/10 text-[#FAF6F2]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.1em] text-[#9C8578]">Meta Numérica</label>
              <Input 
                type="number"
                value={formData.targetNumber}
                onChange={(e) => setFormData({...formData, targetNumber: e.target.value})}
                placeholder="Ej. 10"
                className="mt-2 bg-[#0f1b1b] border-[#D5C3B6]/10 text-[#FAF6F2]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.1em] text-[#9C8578]">Conversión Esperada (%)</label>
              <Input 
                type="number"
                value={formData.expectedConversion}
                onChange={(e) => setFormData({...formData, expectedConversion: e.target.value})}
                placeholder="Ej. 35"
                min="0"
                max="100"
                className="mt-2 bg-[#0f1b1b] border-[#D5C3B6]/10 text-[#FAF6F2]"
              />
            </div>
            <Button 
              onClick={() => void createStrategy()}
              className="w-full mt-6 bg-[#5E8B8C] hover:bg-[#4A7278] text-[#FAF6F2]"
            >
              Crear Estrategia
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
