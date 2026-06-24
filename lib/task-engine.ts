import { CrmDeal, CrmActivity, CrmTask, CrmPlaybookStep, CrmDealStage } from '@prisma/client'
import { DEFAULT_PLAYBOOK } from './playbook-defaults'

export type DealWithContext = CrmDeal & {
  activities: Pick<CrmActivity, 'createdAt' | 'type'>[]
  tasks: Pick<CrmTask, 'id' | 'isCompleted' | 'dueDate' | 'type' | 'title' | 'priority'>[]
  playbookSteps: { stepId: string }[]
}

export type TaskSuggestion = {
  dealId: string
  dealCode: string
  dealTitle: string
  dealStage: CrmDealStage
  taskType: string
  title: string
  description: string
  urgencyScore: number // 0-100, 100 = máxima urgencia
  daysWithoutActivity: number
  channel: string | null
  reason: string
}

/** Calcula la urgencia de un deal (0-100) */
export function calcUrgency(deal: DealWithContext): number {
  const lastActivity = deal.activities[0]?.createdAt
  const daysWithout = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86_400_000)
    : 999

  const stageWeights: Record<string, number> = {
    NUEVO_LEAD: 30,
    CONTACTO_INICIADO: 20,
    VISITA_AGENDADA: 25,
    OFERTA_RECIBIDA: 40,
    DOCS_REVISION: 35,
    NEGOCIANDO: 45,
    FIRMA_CONTRATO: 50,
    ENTREGA_LLAVES: 30,
    PUBLICADA: 10,
    MOSTRANDO: 20,
    PROPIEDAD_CAPTADA: 15,
    ADMINISTRAR: 0,
  }

  const base = stageWeights[deal.stage] ?? 20
  const daysPenalty = Math.min(daysWithout * 8, 60)
  const overduePenalty = deal.dueDate && new Date(deal.dueDate) < new Date() ? 20 : 0

  return Math.min(base + daysPenalty + overduePenalty, 100)
}

/** Genera las sugerencias de siguiente tarea para todos los deals del corredor */
export function generateTaskSuggestions(deals: DealWithContext[]): TaskSuggestion[] {
  const suggestions: TaskSuggestion[] = []

  for (const deal of deals) {
    if (deal.status !== 'ACTIVE') continue

    const completedStepIds = new Set(deal.playbookSteps.map((p) => p.stepId))
    const stageSteps = DEFAULT_PLAYBOOK.filter((s) => s.stage === deal.stage)
    const nextStep = stageSteps.find((s) => !completedStepIds.has(`${s.stage}-${s.order}`))

    const lastActivity = deal.activities[0]?.createdAt
    const daysWithout = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86_400_000)
      : 999

    const urgency = calcUrgency(deal)

    if (nextStep) {
      suggestions.push({
        dealId: deal.id,
        dealCode: deal.code,
        dealTitle: deal.title,
        dealStage: deal.stage,
        taskType: nextStep.taskType,
        title: nextStep.title,
        description: nextStep.description ?? '',
        urgencyScore: urgency,
        daysWithoutActivity: daysWithout,
        channel: nextStep.channel,
        reason: `Paso ${nextStep.order} del playbook para etapa ${deal.stage}`,
      })
    } else if (daysWithout > 2) {
      // No hay playbook pendiente pero lleva >2 días sin actividad
      suggestions.push({
        dealId: deal.id,
        dealCode: deal.code,
        dealTitle: deal.title,
        dealStage: deal.stage,
        taskType: 'SEGUIMIENTO',
        title: 'Seguimiento de contacto',
        description: `Han pasado ${daysWithout} días sin actividad registrada`,
        urgencyScore: urgency,
        daysWithoutActivity: daysWithout,
        channel: 'WHATSAPP',
        reason: `${daysWithout} días sin actividad`,
      })
    }
  }

  // Ordenar por urgencia descendente
  return suggestions.sort((a, b) => b.urgencyScore - a.urgencyScore)
}
