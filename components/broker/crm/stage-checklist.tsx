'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PlaybookStepResult {
  stepId: string
  order: number
  title: string
  description: string | null
  taskType: string
  isRequired: boolean
  isCompleted: boolean
  completedAt: string | null
}

interface StageChecklistProps {
  dealId: string
  onCanAdvanceChange?: (canAdvance: boolean) => void
}

export function StageChecklist({ dealId, onCanAdvanceChange }: StageChecklistProps) {
  const [steps, setSteps] = useState<PlaybookStepResult[]>([])
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [canAdvance, setCanAdvance] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  async function load() {
    // Try workflow-instance first (configurable workflows)
    try {
      const wfRes = await fetch(`/api/crm/workflow-instances/by-deal/${dealId}`)
      if (wfRes.ok) {
        const wfData = await wfRes.json()
        if (wfData.found && wfData.instance) {
          const inst = wfData.instance
          const mapped = inst.stages.map((s: any, idx: number) => ({
            stepId: s.id,
            order: idx + 1,
            title: s.stage?.name ?? 'Etapa',
            description: s.stage?.description ?? null,
            taskType: 'WORKFLOW',
            isRequired: s.stage?.isRequired ?? true,
            isCompleted: s.isCompleted,
            completedAt: s.completedAt,
          }))
          setSteps(mapped)
          setInstanceId(inst.id)
          const requiredDone = mapped.filter((m: any) => m.isRequired && m.isCompleted).length
          const requiredCount = mapped.filter((m: any) => m.isRequired).length
          const can = requiredCount === 0 ? true : requiredDone >= requiredCount
          setCanAdvance(can)
          onCanAdvanceChange?.(can)
          setLoading(false)
          return
        }
      }
    } catch (e) {
      // ignore and fallback to playbook
    }

    const res = await fetch(`/api/crm/deals/${dealId}/playbook`)
    if (!res.ok) return
    const data = await res.json()
    setSteps(data.steps)
    setCanAdvance(data.canAdvance)
    onCanAdvanceChange?.(data.canAdvance)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [dealId])

  async function complete(stepId: string) {
    setCompleting(stepId)
    try {
      // Try marking workflow-instance stage first
      const wfComplete = instanceId ? await fetch(`/api/crm/workflow-instances/${instanceId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: stepId }),
      }) : { ok: false as const }
      if (wfComplete.ok) {
        await load()
        toast.success('Paso completado (workflow)')
      } else {
        const res = await fetch(`/api/crm/deals/${dealId}/playbook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepId }),
        })
        if (!res.ok) throw new Error()
        await load()
        toast.success('Paso completado')
      }
    } catch {
      toast.error('Error al completar el paso')
    } finally {
      setCompleting(null)
    }
  }

  const completedCount = steps.filter((s) => s.isCompleted).length
  const requiredCount = steps.filter((s) => s.isRequired).length
  const requiredDone = steps.filter((s) => s.isRequired && s.isCompleted).length

  if (loading) return <div className="h-20 bg-[#1a2a2a] animate-pulse rounded-lg" />

  return (
    <div className="border border-[#2D3C3C] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-[#1a2a2a] hover:bg-[#1e3030] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#FAF6F2]">Checklist de etapa</span>
          <Badge
            className={cn(
              'text-xs',
              canAdvance ? 'bg-emerald-800 text-emerald-200' : 'bg-[#2D3C3C] text-[#D5C3B6]/60'
            )}
          >
            {requiredDone}/{requiredCount} requeridos
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#D5C3B6]/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#D5C3B6]/40" />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-[#2D3C3C]">
          {steps.map((step) => (
            <div
              key={step.stepId}
              className={cn(
                'flex items-start gap-3 p-3 transition-colors',
                step.isCompleted ? 'bg-emerald-950/10' : 'bg-[#1a2424]'
              )}
            >
              <button
                onClick={() => !step.isCompleted && complete(step.stepId)}
                disabled={step.isCompleted || completing === step.stepId}
                className="mt-0.5 shrink-0"
              >
                {step.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-[#D5C3B6]/30 hover:text-[#5E8B8C] transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-sm',
                      step.isCompleted ? 'line-through text-[#D5C3B6]/40' : 'text-[#FAF6F2]'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.isRequired && !step.isCompleted && (
                    <Lock className="w-3 h-3 text-[#C27F79]" />
                  )}
                </div>
                {step.description && (
                  <p className="text-xs text-[#D5C3B6]/50 mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!canAdvance && steps.length > 0 && (
        <div className="p-2 bg-[#C27F79]/10 border-t border-[#C27F79]/20">
          <p className="text-xs text-[#C27F79] text-center">
            Completa los pasos requeridos para avanzar de etapa
          </p>
        </div>
      )}
    </div>
  )
}
