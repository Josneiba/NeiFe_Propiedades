'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const strategyTypes = [
  ['GENERACION_LEADS', 'Lead Generation'],
  ['CAPTACION_PROPIEDADES', 'Property Acquisition'],
  ['MARKETING', 'Marketing Campaigns'],
  ['REFERIDOS', 'Referrals'],
  ['REACTIVACION', 'Reactivation'],
  ['INVERSIONISTAS', 'Investors'],
  ['OPEN_HOUSE', 'Open Houses'],
  ['ALIANZAS', 'Strategic Partnerships'],
] as const

export function StrategiesTab() {
  const [strategies, setStrategies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState('GENERACION_LEADS')
  const [name, setName] = useState('')
  const [activityTitle, setActivityTitle] = useState<Record<string, string>>({})
  const [activityDate, setActivityDate] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/crm/strategies')
      if (!res.ok) throw new Error('No se pudieron cargar estrategias')
      const data = await res.json()
      setStrategies(data.strategies ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando estrategias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function createStrategy() {
    if (!name.trim()) return toast.error('Nombre requerido')
    const res = await fetch('/api/crm/strategies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name: name.trim() }),
    })
    if (!res.ok) return toast.error('No se pudo crear la estrategia')
    setName('')
    toast.success('Estrategia creada')
    await load()
  }

  async function createActivity(strategyId: string) {
    const title = activityTitle[strategyId]?.trim()
    if (!title) return toast.error('Actividad requerida')
    const res = await fetch(`/api/crm/strategies/${strategyId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, dueDate: activityDate[strategyId] || null }),
    })
    if (!res.ok) return toast.error('No se pudo crear la actividad')
    setActivityTitle((current) => ({ ...current, [strategyId]: '' }))
    setActivityDate((current) => ({ ...current, [strategyId]: '' }))
    toast.success(activityDate[strategyId] ? 'Actividad y task creada' : 'Actividad creada')
    await load()
  }

  if (loading) return <div className="rounded-lg border border-[#2D3C3C] bg-[#1a2a2a] p-5 text-sm text-[#9C8578]">Cargando estrategias...</div>
  if (error) return <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#2D3C3C] bg-[#1a2a2a] p-4">
        <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"><SelectValue /></SelectTrigger>
            <SelectContent>{strategyTypes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Agregar estrategia" className="border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]" />
          <Button onClick={() => void createStrategy()} className="bg-[#5E8B8C] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#FAF6F2]">Estrategias de la semana</h2>
        <Button size="sm" variant="outline" onClick={() => void load()} className="border-[#D5C3B6]/20 text-[#D5C3B6]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {strategies.length === 0 ? <p className="text-sm text-[#9C8578]">Aún no hay estrategias para esta semana.</p> : strategies.map((strategy) => (
          <section key={strategy.id} className="rounded-lg border border-[#2D3C3C] bg-[#1a2a2a] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">{strategy.type}</Badge>
                <h3 className="mt-3 text-base font-semibold text-[#FAF6F2]">{strategy.name}</h3>
                <p className="mt-1 text-xs text-[#9C8578]">{strategy.goalDescription ?? 'Sin descripción de meta'}</p>
              </div>
              <div className="text-right text-xs text-[#9C8578]">
                <p>Esperada: {Math.round((strategy.expectedConversion ?? 0) * 100)}%</p>
                <p>Real: {Math.round((strategy.actualConversion ?? 0) * 100)}%</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#2D3C3C] bg-[#152022] p-3 text-xs text-[#D5C3B6]">
              <p className="font-semibold text-[#FAF6F2]">Contribución al pipeline: {strategy.pipelineContribution?.count ?? 0}</p>
              <p className="mt-1 text-[#9C8578]">{strategy.pipelineContribution?.attribution}</p>
            </div>

            <div className="mt-4 space-y-2">
              {strategy.activities.length === 0 ? <p className="text-sm text-[#9C8578]">Sin actividades.</p> : strategy.activities.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#2D3C3C] bg-[#152022] p-3 text-sm">
                  <div>
                    <p className="text-[#FAF6F2]">{activity.title}</p>
                    <p className="text-xs text-[#9C8578]">{activity.owner?.name ?? 'Sin responsable'} · {activity.dueDate ? new Date(activity.dueDate).toLocaleDateString('es-CL') : 'Sin fecha'}</p>
                  </div>
                  <Badge>{activity.isCompleted ? 'Completada' : activity.taskId ? 'Task creada' : 'Planificada'}</Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_150px_auto]">
              <Input value={activityTitle[strategy.id] ?? ''} onChange={(event) => setActivityTitle((current) => ({ ...current, [strategy.id]: event.target.value }))} placeholder="Agregar actividad" className="border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]" />
              <Input type="date" value={activityDate[strategy.id] ?? ''} onChange={(event) => setActivityDate((current) => ({ ...current, [strategy.id]: event.target.value }))} className="border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]" />
              <Button size="sm" onClick={() => void createActivity(strategy.id)} className="bg-[#5E8B8C] text-white">Crear</Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
