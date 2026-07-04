import type { PrismaClient } from '@prisma/client'

export type CrmSavedViewEntity = 'CONTACTS' | 'DEALS' | 'PROPERTIES' | 'MANDATES' | 'PAYMENTS' | 'MAINTENANCE'

export interface SavedViewFilters {
  [key: string]: unknown
}

export interface SavedViewQueryPayload {
  entity: CrmSavedViewEntity
  filters?: SavedViewFilters
  sortBy?: string | null
  sortOrder?: string | null
}

export interface SavedViewRecord {
  id: string
  name: string
  entity: CrmSavedViewEntity
  filters: SavedViewFilters
  sortBy?: string | null
  sortOrder?: string | null
  isStandard?: boolean
  updatedAt?: Date
}

function sortDirection(sortOrder?: string | null) {
  return sortOrder === 'desc' ? 'desc' : 'asc'
}

export async function ensureStandardSavedViews(prisma: PrismaClient, brokerId: string) {
  const standardViews = [
    { name: 'Todos los clientes', entity: 'CONTACTS', filters: {}, sortBy: 'updatedAt', sortOrder: 'desc' },
    { name: 'Todas las oportunidades', entity: 'DEALS', filters: {}, sortBy: 'updatedAt', sortOrder: 'desc' },
    { name: 'Todas las propiedades', entity: 'PROPERTIES', filters: {}, sortBy: 'updatedAt', sortOrder: 'desc' },
    { name: 'Todos los contratos', entity: 'MANDATES', filters: {}, sortBy: 'expiresAt', sortOrder: 'asc' },
    { name: 'Todos los pagos', entity: 'PAYMENTS', filters: {}, sortBy: 'createdAt', sortOrder: 'desc' },
    { name: 'Todas las mantenciones', entity: 'MAINTENANCE', filters: {}, sortBy: 'createdAt', sortOrder: 'desc' },
  ] as const

  const existing = await prisma.crmSavedView.findMany({
    where: { brokerId, isStandard: true },
    select: { entity: true, name: true },
  })
  const existingKeys = new Set(existing.map((view) => `${view.entity}:${view.name}`))
  const missingViews = standardViews.filter((view) => !existingKeys.has(`${view.entity}:${view.name}`))
  if (missingViews.length === 0) return []

  await prisma.crmSavedView.createMany({
    data: missingViews.map((view) => ({
      brokerId,
      name: view.name,
      entity: view.entity,
      filters: view.filters,
      sortBy: view.sortBy,
      sortOrder: view.sortOrder,
      isStandard: true,
    })),
  })

  return []
}

export async function executeSavedView(prisma: PrismaClient, brokerId: string, payload: SavedViewQueryPayload) {
  const { entity, filters = {}, sortBy, sortOrder } = payload
  const direction = sortDirection(sortOrder)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86_400_000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000)

  if (entity === 'CONTACTS') {
    const where: Record<string, unknown> = { brokerId }

    if (Array.isArray(filters.clientType) && filters.clientType.length) {
      where.type = { in: filters.clientType as string[] }
    }
    if (filters.source) {
      where.source = filters.source
    }
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.priority) {
      where.priority = filters.priority
    }
    if (filters.vipOnly) {
      where.priority = 'HIGH'
    }
    if (filters.todayVisitsOnly) {
      where.activities = { some: { type: 'VISITA', scheduledAt: { gte: todayStart, lt: todayEnd } } }
    }
    if (filters.futureVisitsOnly) {
      where.activities = { some: { type: 'VISITA', scheduledAt: { gte: now } } }
    }
    if (filters.noFutureVisits) {
      where.activities = { none: { type: 'VISITA', scheduledAt: { gte: now } } }
    }
    if (filters.lastContactIsNull) {
      // Contacts with no recent activity in the last 30 days (includes contacts with no activities)
      where.activities = { none: { createdAt: { gte: thirtyDaysAgo } } }
    }
    if (filters.createdAt && typeof filters.createdAt === 'object') {
      const range = filters.createdAt as { gte?: string | Date; lt?: string | Date; lte?: string | Date }
      where.createdAt = {
        ...(range.gte ? { gte: new Date(range.gte) } : {}),
        ...(range.lt ? { lt: new Date(range.lt) } : {}),
        ...(range.lte ? { lte: new Date(range.lte) } : {}),
      }
    }

    const contacts = await prisma.crmContact.findMany({
      where,
      include: {
        deals: { include: { deal: { select: { id: true, code: true, title: true, stage: true, operationType: true } } }, take: 3 },
        activities: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      },
      orderBy: sortBy === 'name' ? { name: direction } : sortBy === 'updatedAt' ? { updatedAt: direction } : { createdAt: direction },
    })

    const results = contacts.map((contact) => ({
      ...contact,
      stallReason: contact.status === 'INACTIVE'
        ? 'NO_INTERESADO'
        : contact.activities[0]?.createdAt
          ? null
          : 'SIN_CONTACTO_RECIENTE',
    }))

    return { results, count: results.length }
  }

  if (entity === 'DEALS') {
    const where: Record<string, unknown> = { brokerId }

    if (filters.stage) where.stage = filters.stage
    if (filters.operationType) where.operationType = filters.operationType
    if (filters.status) where.status = filters.status
    if (filters.brokerId) where.brokerId = filters.brokerId
    if (filters.workflowStageId) {
      where.AND = [
        ...((where.AND as unknown[]) ?? []),
        { workflowInstance: { currentStageId: filters.workflowStageId } },
      ]
    }
    if (filters.currentStageId) {
      where.AND = [
        ...((where.AND as unknown[]) ?? []),
        { workflowInstance: { currentStageId: filters.currentStageId } },
      ]
    }
    if (filters.wonAt && typeof filters.wonAt === 'object') {
      const range = filters.wonAt as { gte?: string | Date; lt?: string | Date; lte?: string | Date }
      where.wonAt = {
        ...(range.gte ? { gte: new Date(range.gte) } : {}),
        ...(range.lt ? { lt: new Date(range.lt) } : {}),
        ...(range.lte ? { lte: new Date(range.lte) } : {}),
      }
    }
    if (filters.createdAt && typeof filters.createdAt === 'object') {
      const range = filters.createdAt as { gte?: string | Date; lt?: string | Date; lte?: string | Date }
      where.createdAt = {
        ...(range.gte ? { gte: new Date(range.gte) } : {}),
        ...(range.lt ? { lt: new Date(range.lt) } : {}),
        ...(range.lte ? { lte: new Date(range.lte) } : {}),
      }
    }

    const deals = await prisma.crmDeal.findMany({
      where,
      include: {
        broker: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, code: true, address: true, type: true } },
        contacts: { include: { contact: { select: { id: true, code: true, name: true, priority: true } } }, take: 3 },
        activities: {
          where: { isDone: false },
          orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
          take: 1,
          select: { id: true, title: true, type: true, scheduledAt: true, createdAt: true },
        },
        tasks: {
          where: { isCompleted: false },
          orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
          take: 1,
          select: { id: true, title: true, dueDate: true, priority: true },
        },
        workflowInstance: {
          include: {
            stages: { include: { stage: true }, orderBy: { stage: { order: 'asc' } } },
          },
        },
      },
      orderBy: sortBy === 'dueDate'
        ? { dueDate: direction }
        : sortBy === 'createdAt'
          ? { createdAt: direction }
          : { updatedAt: direction },
    } as any)

    const fixedStageOrder = [
      'NUEVO_LEAD',
      'CONTACTO_INICIADO',
      'VISITA_AGENDADA',
      'PROPIEDAD_CAPTADA',
      'PUBLICADA',
      'MOSTRANDO',
      'OFERTA_RECIBIDA',
      'DOCS_REVISION',
      'NEGOCIANDO',
      'FIRMA_CONTRATO',
      'ENTREGA_LLAVES',
      'ADMINISTRAR',
    ]

    const results = deals.map((deal: any) => {
      const workflowStages = deal.workflowInstance?.stages ?? []
      const completedWorkflowStages = workflowStages.filter((stage: any) => stage.isCompleted).length
      const completionPercentage = workflowStages.length > 0
        ? Math.round((completedWorkflowStages / workflowStages.length) * 100)
        : Math.round(((fixedStageOrder.indexOf(deal.stage) + 1) / fixedStageOrder.length) * 100)
      const currentWorkflowStage = workflowStages.find((stage: any) => stage.stageId === deal.workflowInstance?.currentStageId)
        ?? workflowStages.find((stage: any) => !stage.isCompleted)
      const nextTask = deal.tasks[0]
      const nextActivity = deal.activities[0]
      const nextAction = nextTask?.title ?? nextActivity?.title ?? 'Sin próxima acción definida'
      const daysToDueDate = deal.dueDate
        ? Math.ceil((new Date(deal.dueDate).getTime() - now.getTime()) / 86_400_000)
        : null
      const hasRecentActivity = deal.updatedAt && new Date(deal.updatedAt).getTime() >= thirtyDaysAgo.getTime()
      const riskScore = daysToDueDate === null
        ? (hasRecentActivity ? 35 : 55)
        : Math.max(0, Math.min(100, (daysToDueDate < 0 ? 60 : daysToDueDate <= 3 ? 35 : 10) + (hasRecentActivity ? 0 : 30)))
      const priority = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW'

      return {
        ...deal,
        client: deal.contacts[0]?.contact ?? null,
        assignedAgent: deal.broker,
        workflowStageLabel: currentWorkflowStage?.stage?.name ?? deal.stage,
        nextAction,
        priority,
        riskScore,
        completionPercentage,
      }
    })

    return { results, count: results.length }
  }

  if (entity === 'PROPERTIES') {
    const where: Record<string, unknown> = { managedBy: brokerId }

    if (Array.isArray(filters.propertyType) && filters.propertyType.length) {
      where.type = { in: filters.propertyType as string[] }
    }
    if (filters.status) {
      where.isActive = filters.status === 'DISPONIBLE' || filters.status === 'PUBLICADA'
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.monthlyRentCLP = {}
      if (filters.priceMin !== undefined) (where.monthlyRentCLP as any).gte = Number(filters.priceMin)
      if (filters.priceMax !== undefined) (where.monthlyRentCLP as any).lte = Number(filters.priceMax)
    }
    if (Array.isArray(filters.communes) && filters.communes.length) {
      where.commune = { in: filters.communes as string[] }
    }
    if (filters.agentId) {
      where.managedBy = filters.agentId
    }
    if (filters.noPhotos) {
      where.photos = { none: {} }
    }
    if (filters.unpublished) {
      where.isPublished = false
    }
    if (filters.noVisits) {
      where.activityLogs = { none: { type: 'VISITA' } }
    }
    if (filters.maintenanceOpenOnly) {
      where.maintenance = { some: { status: { in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'] } } }
    }

    const properties = await prisma.property.findMany({
      where,
      include: { photos: { orderBy: { order: 'asc' }, take: 1, select: { url: true } }, landlord: { select: { name: true } } },
      orderBy: sortBy === 'price' ? { monthlyRentCLP: direction } : sortBy === 'name' ? { name: direction } : { updatedAt: direction },
    })

    return { results: properties, count: properties.length }
  }

  if (entity === 'MANDATES') {
    const where: Record<string, unknown> = { brokerId }

    if (filters.status) {
      where.status = filters.status
    }
    if (filters.expiresInDays !== undefined || filters.renewalInDays !== undefined) {
      const days = Number(filters.expiresInDays ?? filters.renewalInDays ?? 30)
      where.expiresAt = { lte: new Date(Date.now() + days * 86_400_000) }
    }

    const mandates = await prisma.mandate.findMany({
      where,
      include: { property: { select: { address: true, commune: true } }, owner: { select: { name: true } } },
      orderBy: sortBy === 'expiresAt' ? { expiresAt: direction } : { createdAt: direction },
    })

    return { results: mandates, count: mandates.length }
  }

  if (entity === 'PAYMENTS') {
    const where: Record<string, unknown> = {
      property: { managedBy: brokerId },
    }
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.overdueOnly) {
      where.status = 'OVERDUE'
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { property: { select: { address: true } } },
      orderBy: sortBy === 'amountCLP' ? { amountCLP: direction } : { createdAt: direction },
    })

    return { results: payments, count: payments.length }
  }

  if (entity === 'MAINTENANCE') {
    const where: Record<string, unknown> = {
      property: { managedBy: brokerId },
    }

    if (filters.status) {
      where.status = filters.status
    }

    const maintenance = await prisma.maintenanceRequest.findMany({
      where,
      include: { property: { select: { address: true } } },
      orderBy: sortBy === 'updatedAt' ? { updatedAt: direction } : { createdAt: direction },
    })

    return { results: maintenance, count: maintenance.length }
  }

  return { results: [], count: 0 }
}
