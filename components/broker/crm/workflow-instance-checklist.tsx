'use client'

import { useEffect, useState } from 'react'
import { StageChecklist } from './stage-checklist'

interface WorkflowInstanceChecklistProps {
  dealId: string
  onCanAdvanceChange?: (canAdvance: boolean) => void
  fallback?: React.ReactNode
}

export function WorkflowInstanceChecklist({ dealId, onCanAdvanceChange, fallback }: WorkflowInstanceChecklistProps) {
  const [hasInstance, setHasInstance] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch(`/api/crm/workflow-instances/by-deal/${dealId}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (active) setHasInstance(Boolean(data.found && data.instance))
      } catch {
        if (active) setHasInstance(false)
      }
    }
    void load()
    return () => { active = false }
  }, [dealId])

  if (hasInstance === null) return <div className="h-20 rounded-lg bg-[#1a2a2a] animate-pulse" />
  if (!hasInstance) return <>{fallback ?? null}</>

  return <StageChecklist dealId={dealId} onCanAdvanceChange={onCanAdvanceChange} />
}
