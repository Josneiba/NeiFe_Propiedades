'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { formatDateCompact } from '@/lib/utils'

interface Deal {
  id: string
  code: string
  title: string
  client?: { name?: string } | null
  property?: { code?: string; address?: string } | null
  stage: string
  status: string
  value?: number | null
  dueDate?: string | Date | null
  createdAt?: string | Date | null
  workflowInstance?: { 
    currentStageIndex?: number
    stages?: Array<{ id: string; isCompleted: boolean }>
  } | null
}

const stageLabels: Record<string, string> = {
  NUEVO_LEAD: 'Lead',
  CONTACTO_INICIADO: 'Contacto',
  VISITA_AGENDADA: 'Visita',
  PROPIEDAD_CAPTADA: 'Captación',
  PUBLICADA: 'Publicado',
  MOSTRANDO: 'Mostrando',
  OFERTA_RECIBIDA: 'Oferta',
  DOCS_REVISION: 'Documentos',
  NEGOCIANDO: 'Negociación',
  FIRMA_CONTRATO: 'Firma',
  ENTREGA_LLAVES: 'Entrega',
  ADMINISTRAR: 'Administrar',
}

const stageColors: Record<string, string> = {
  NUEVO_LEAD: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONTACTO_INICIADO: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  VISITA_AGENDADA: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  PROPIEDAD_CAPTADA: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  PUBLICADA: 'bg-green-500/20 text-green-400 border-green-500/30',
  MOSTRANDO: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  OFERTA_RECIBIDA: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DOCS_REVISION: 'bg-red-500/20 text-red-400 border-red-500/30',
  NEGOCIANDO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  FIRMA_CONTRATO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ENTREGA_LLAVES: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  ADMINISTRAR: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  WON: 'Ganado',
  LOST: 'Perdido',
  ON_HOLD: 'En pausa',
}

export function PipelineTab() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDeals() {
      try {
        const res = await fetch('/api/crm/deals?limit=100')
        if (!res.ok) throw new Error('No se pudieron cargar los deals')
        const data = await res.json()
        setDeals(Array.isArray(data) ? data : data.deals ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    void loadDeals()
  }, [])

  const groupedByStage = useMemo(() => {
    return deals.reduce<Record<string, Deal[]>>((acc, deal) => {
      const stage = deal.stage || 'NUEVO_LEAD'
      acc[stage] = [...(acc[stage] ?? []), deal]
      return acc
    }, {})
  }, [deals])

  const stageOrder = [
    'NUEVO_LEAD', 'CONTACTO_INICIADO', 'VISITA_AGENDADA', 'PROPIEDAD_CAPTADA',
    'PUBLICADA', 'MOSTRANDO', 'OFERTA_RECIBIDA', 'DOCS_REVISION', 'NEGOCIANDO',
  ]

  if (loading) {
    return (
      <div className="rounded-lg bg-[#1C2828] border border-[#D5C3B6]/10 p-8 text-center text-[#9C8578]">
        Cargando deals del pipeline...
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
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-9">
        {stageOrder.map((stage) => {
          const stageDeal = groupedByStage[stage] ?? []
          const value = stageDeal.reduce((sum, d) => sum + (d.value ?? 0), 0)
          return (
            <div key={stage} className="rounded-lg bg-[#1C2828] border border-[#D5C3B6]/10 p-4">
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.15em] text-[#9C8578] font-medium">{stageLabels[stage]}</p>
                <p className="mt-2 text-2xl font-bold text-[#FAF6F2]">{stageDeal.length}</p>
              </div>
              <div className="mb-3">
                <p className="text-xs text-[#D5C3B6]/60">Valor total</p>
                <p className="text-sm font-semibold text-[#5E8B8C]">${value.toLocaleString('es-CL')}</p>
              </div>
              <Progress 
                value={Math.min(100, (stageDeal.length / Math.max(1, deals.length / 9)) * 100)} 
                className="h-1 rounded-full bg-[#0f1b1b]" 
              />
            </div>
          )
        })}
      </div>

      <div className="rounded-lg bg-[#1C2828] border border-[#D5C3B6]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#D5C3B6]/10 bg-[#0f1b1b]">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium">Nombre</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium">Cliente</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium">Propiedad</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium">Etapa</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium">Valor</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium">Workflow</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.1em] text-[#9C8578] font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5C3B6]/10">
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-[#9C8578]">No hay deals en el pipeline</td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-[#212E2E] transition-colors">
                    <td className="px-4 py-3 text-[#FAF6F2] font-medium">{deal.title}</td>
                    <td className="px-4 py-3 text-[#D5C3B6]">{deal.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[#D5C3B6]">{deal.property?.code ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[11px] border ${stageColors[deal.stage] ?? 'border-[#D5C3B6]/20'}`}>
                        {stageLabels[deal.stage] ?? deal.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={deal.status === 'WON' ? 'secondary' : deal.status === 'LOST' ? 'destructive' : 'default'} className="text-[11px]">
                        {statusLabels[deal.status] ?? deal.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-[#5E8B8C] font-medium">
                      ${(deal.value ?? 0).toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 text-[#D5C3B6]">
                      {deal.dueDate ? formatDateCompact(deal.dueDate, { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {deal.workflowInstance?.stages ? (
                        <div className="text-[11px]">
                          <span className="text-[#5E8B8C]">
                            {deal.workflowInstance.stages.filter(s => s.isCompleted).length}/{deal.workflowInstance.stages.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#9C8578]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/broker/crm/workspace?deal=${deal.id}`} className="text-[#5E8B8C] hover:text-[#D8F0EE]">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
