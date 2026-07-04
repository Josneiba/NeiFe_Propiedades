import type { PrismaClient } from '@prisma/client'

export type CrmSavedViewEntity = 'CONTACTS' | 'PROPERTIES' | 'MANDATES' | 'PAYMENTS' | 'MAINTENANCE'

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
  const existing = await prisma.crmSavedView.count({ where: { brokerId, isStandard: true } })
  if (existing > 0) return []

  const standardViews = [
    { name: 'Todos los clientes', entity: 'CONTACTS', filters: {}, sortBy: 'updatedAt', sortOrder: 'desc' },
    { name: 'Todas las propiedades', entity: 'PROPERTIES', filters: {}, sortBy: 'updatedAt', sortOrder: 'desc' },
    { name: 'Todos los contratos', entity: 'MANDATES', filters: {}, sortBy: 'expiresAt', sortOrder: 'asc' },
    { name: 'Todos los pagos', entity: 'PAYMENTS', filters: {}, sortBy: 'createdAt', sortOrder: 'desc' },
    { name: 'Todas las mantenciones', entity: 'MAINTENANCE', filters: {}, sortBy: 'createdAt', sortOrder: 'desc' },
  ] as const

  await prisma.crmSavedView.createMany({
    data: standardViews.map((view) => ({
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
    if (filters.lastContactIsNull) {
      where.OR = [
        { activities: { none: {} } },
        { activities: { none: { createdAt: { not: null } } } },
      ]
    }
    if (filters.missingDocuments) {
      where.notes = { contains: 'document', mode: 'insensitive' }
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

  if (entity === 'PROPERTIES') {
    const where: Record<string, unknown> = { landlordId: brokerId }

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
    const where: Record<string, unknown> = {}
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
    const where: Record<string, unknown> = { requesterId: brokerId }

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
