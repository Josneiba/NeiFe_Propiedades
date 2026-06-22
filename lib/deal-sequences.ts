import { prisma } from '@/lib/prisma'
import { CrmActivityType } from '@prisma/client'
import { parse, addDays, addHours, isAfter } from 'date-fns'

export interface SequenceAction {
  type: 'SEND_EMAIL' | 'SEND_MESSAGE' | 'CALL' | 'LOG_ACTIVITY' | 'DELAY' | 'DECISION'
  template?: string
  templateData?: Record<string, string>
  delayDays?: number
  condition?: {
    field: string
    operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains'
    value: any
  }
  onSuccess?: SequenceAction
  onFail?: SequenceAction
}

export interface DealSequenceTemplate {
  id: string
  name: string
  description: string
  actions: SequenceAction[]
  triggerType: 'MANUAL' | 'AUTO_ON_STAGE' | 'AUTO_ON_CONDITION'
  triggerStage?: string
  triggerCondition?: any
}

/**
 * Create a new deal sequence template
 */
export async function createSequenceTemplate(
  brokerId: string,
  template: Omit<DealSequenceTemplate, 'id'>
) {
  return await prisma.crmDealSequenceTemplate.create({
    data: {
      brokerId,
      name: template.name,
      description: template.description,
      actions: template.actions as any,
      triggerType: template.triggerType,
      triggerStage: template.triggerStage,
      triggerCondition: template.triggerCondition as any,
    },
  })
}

/**
 * Start a sequence for a deal
 */
export async function startSequence(
  dealId: string,
  templateId: string,
  userId: string
) {
  const template = await prisma.crmDealSequenceTemplate.findUnique({
    where: { id: templateId },
  })

  if (!template) throw new Error('Template not found')

  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    include: { broker: true },
  })

  if (!deal) throw new Error('Deal not found')

  const sequence = await prisma.crmDealSequence.create({
    data: {
      dealId,
      templateId,
      createdBy: userId,
      status: 'ACTIVE',
      startedAt: new Date(),
      actions: [],
    },
  })

  // Schedule first action
  const actions = template.actions as unknown as SequenceAction[]
  if (actions && actions.length > 0) {
    await scheduleNextAction(sequence.id, actions[0])
  }

  return sequence
}

/**
 * Execute next action in sequence
 */
export async function executeSequenceAction(sequenceId: string) {
  const sequence = await prisma.crmDealSequence.findUnique({
    where: { id: sequenceId },
    include: { template: true, deal: true },
  })

  if (!sequence || sequence.status !== 'ACTIVE') return

  const actions = (sequence.template.actions as unknown) as SequenceAction[]
  const currentActionIndex = (sequence.actions as any[]).length
  const currentAction = actions[currentActionIndex]

  if (!currentAction) {
    // Sequence complete
    await prisma.crmDealSequence.update({
      where: { id: sequenceId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
    return
  }

  try {
    // Execute action based on type
    switch (currentAction.type) {
      case 'SEND_EMAIL':
        await sendSequenceEmail(sequence.deal, currentAction)
        break
      case 'SEND_MESSAGE':
        await sendSequenceMessage(sequence.deal, currentAction)
        break
      case 'CALL':
        await logCallActivity(sequence.deal, currentAction)
        break
      case 'LOG_ACTIVITY':
        await logActivity(sequence.deal, currentAction)
        break
      case 'DELAY':
        await scheduleNextAction(sequenceId, actions[currentActionIndex + 1], currentAction.delayDays)
        return
    }

    // Record action execution
    await prisma.crmDealSequence.update({
      where: { id: sequenceId },
      data: {
        actions: [...((sequence.actions as any[]) || []), { ...currentAction, executedAt: new Date() }],
      },
    })

    // Schedule next action
    if (currentActionIndex + 1 < actions.length) {
      const nextAction = actions[currentActionIndex + 1]
      await scheduleNextAction(sequenceId, nextAction)
    } else {
      await prisma.crmDealSequence.update({
        where: { id: sequenceId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
    }
  } catch (error) {
    console.error('Sequence action failed:', error)
    await prisma.crmDealSequence.update({
      where: { id: sequenceId },
      data: { status: 'FAILED', failedAt: new Date() },
    })
  }
}

/**
 * Schedule next action execution
 */
async function scheduleNextAction(sequenceId: string, action: SequenceAction, delayDays = 0) {
  const scheduleTime = addDays(new Date(), delayDays + (action.delayDays || 0))

  // This would typically use a job queue like Bull or Agenda
  // For now, we'll store it for polling/webhook execution
  await prisma.crmDealSequenceExecution.create({
    data: {
      sequenceId,
      scheduledFor: scheduleTime,
      action: action as any,
      status: 'PENDING',
    },
  })
}

/**
 * Send email action
 */
async function sendSequenceEmail(deal: any, action: SequenceAction) {
  // Integration with email service
  console.log(`Sending email for deal ${deal.id} with template: ${action.template}`)
  // Would implement actual email sending here
}

/**
 * Send message action
 */
async function sendSequenceMessage(deal: any, action: SequenceAction) {
  // Integration with messaging service
  console.log(`Sending message for deal ${deal.id}`)
}

/**
 * Log call activity
 */
async function logCallActivity(deal: any, action: SequenceAction) {
  await prisma.crmActivity.create({
    data: {
      dealId: deal.id,
      contactId: deal.contacts?.[0]?.contactId,
      type: 'LLAMADA',
      title: 'Llamada automática desde secuencia',
      brokerId: deal.brokerId,
    },
  })
}

/**
 * Log activity
 */
async function logActivity(deal: any, action: SequenceAction) {
  await prisma.crmActivity.create({
    data: {
      dealId: deal.id,
      contactId: deal.contacts?.[0]?.contactId,
      type: 'NOTA',
      title: action.template || 'Actividad desde secuencia',
      description: 'Actividad generada automáticamente desde secuencia',
      brokerId: deal.brokerId,
    },
  })
}

/**
 * Get all sequence templates for broker
 */
export async function getSequenceTemplates(brokerId: string) {
  return await prisma.crmDealSequenceTemplate.findMany({
    where: { brokerId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get active sequences for deal
 */
export async function getDealSequences(dealId: string) {
  return await prisma.crmDealSequence.findMany({
    where: { dealId },
    include: { template: true },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Pause a running sequence
 */
export async function pauseSequence(sequenceId: string) {
  return await prisma.crmDealSequence.update({
    where: { id: sequenceId },
    data: { status: 'PAUSED', pausedAt: new Date() },
  })
}

/**
 * Resume a paused sequence
 */
export async function resumeSequence(sequenceId: string) {
  return await prisma.crmDealSequence.update({
    where: { id: sequenceId },
    data: { status: 'ACTIVE', pausedAt: null },
  })
}

/**
 * Cancel a sequence
 */
export async function cancelSequence(sequenceId: string) {
  return await prisma.crmDealSequence.update({
    where: { id: sequenceId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })
}
