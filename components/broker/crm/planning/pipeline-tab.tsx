'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, RefreshCw } from 'lucide-react'

interface PipelineRow {
  key: string
  category: string
  plannedThisWeek: number
  activeItems: number
  savedViewQuery: any
  mapping: { model: string; plannedRule: string }
  items: any[]
}

const columns = [
  'Cliente',
  'Propiedad',
  'Etapa de Workflow',
  'Próxima Acción',
  'Agente Asignado',
  'Prioridad',
  'Fecha Objetivo',
  'Riesgo',
  '% Completitud',
]

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

export function PipelineTab() {
  const [rows, setRows] = useState<PipelineRow[]>([])
  const [selected, setSelected] = useState<PipelineRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/crm/planning/pipeline')
      if (!res.ok) throw new Error('No se pudo cargar pipeline')
      const data = await res.json()
      setRows(data.rows ?? [])
      setSelected((data.rows ?? [])[0] ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando pipeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  if (loading) return <div className="rounded-lg border border-[#2D3C3C] bg-[#1a2a2a] p-5 text-sm text-[#9C8578]">Cargando pipeline...</div>
  if (error) return <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#FAF6F2]">Pipeline semanal</h2>
          <p className="text-xs text-[#9C8578]">Cada fila usa filtros reales de vistas guardadas sobre oportunidades.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} className="border-[#D5C3B6]/20 text-[#D5C3B6]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <button
            key={row.key}
            onClick={() => setSelected(row)}
            className={`rounded-lg border p-4 text-left transition-colors ${selected?.key === row.key ? 'border-[#5E8B8C] bg-[#5E8B8C]/10' : 'border-[#2D3C3C] bg-[#1a2a2a] hover:bg-[#223333]'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#FAF6F2]">{row.category}</p>
              <ArrowRight className="h-4 w-4 text-[#9C8578]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[#FAF6F2]">{row.plannedThisWeek} / {row.activeItems}</p>
            <p className="mt-1 text-xs text-[#9C8578]">Planes definidos / activos</p>
          </button>
        ))}
      </div>

      {selected && (
        <section className="rounded-lg border border-[#2D3C3C] bg-[#1a2a2a]">
          <div className="flex flex-col gap-2 border-b border-[#2D3C3C] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-[#FAF6F2]">{selected.category}</h3>
              <p className="text-xs text-[#9C8578]">{selected.mapping.model} · {selected.mapping.plannedRule}</p>
            </div>
            <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">{selected.items.length} registros</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-[#9C8578]">
                <tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#2D3C3C]">
                {selected.items.length === 0 ? (
                  <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-[#9C8578]">No hay registros para este filtro.</td></tr>
                ) : selected.items.map((deal) => (
                  <tr key={deal.id} className="text-[#D5C3B6]">
                    <td className="px-4 py-3 text-[#FAF6F2]">{deal.client?.name ?? 'Sin cliente'}</td>
                    <td className="px-4 py-3">{deal.property?.address ?? 'Sin propiedad'}</td>
                    <td className="px-4 py-3">{deal.workflowStageLabel ?? deal.stage}</td>
                    <td className="px-4 py-3">{deal.nextAction}</td>
                    <td className="px-4 py-3">{deal.assignedAgent?.name ?? deal.brokerId}</td>
                    <td className="px-4 py-3"><Badge>{deal.priority}</Badge></td>
                    <td className="px-4 py-3">{formatDate(deal.dueDate)}</td>
                    <td className="px-4 py-3">{deal.riskScore}%</td>
                    <td className="px-4 py-3">{deal.completionPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
