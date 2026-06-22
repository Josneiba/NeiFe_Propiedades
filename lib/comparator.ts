import { prisma } from '@/lib/prisma'

export interface ComparisonData {
  id: string
  type: 'deal' | 'contact' | 'property'
  data: Record<string, any>
}

export interface ComparisonResult {
  items: ComparisonData[]
  fields: {
    name: string
    values: (string | number | null)[]
    highlights: number[] // Indices of highest values
  }[]
  analysis: {
    bestValue: string
    pros: string[]
    cons: string[]
  }
}

/**
 * Compare multiple deals
 */
export async function compareDeals(dealIds: string[]): Promise<ComparisonResult> {
  const deals = await prisma.crmDeal.findMany({
    where: { id: { in: dealIds } },
    include: {
      contacts: { include: { contact: true } },
      property: true,
      activities: true,
    },
  })

  const items: ComparisonData[] = deals.map((deal) => ({
    id: deal.id,
    type: 'deal',
    data: {
      code: deal.code,
      title: deal.title,
      phase: deal.phase,
      status: deal.status,
      value: deal.estimatedValue || 0,
      daysActive: Math.floor(
        (new Date().getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      contactCount: deal.contacts.length,
      activityCount: deal.activities.length,
      lastActivity: deal.activities.length > 0 ? deal.activities[0].createdAt : null,
      propertyAddress: deal.property?.address || 'N/A',
      nextAction: deal.activities.length > 0 ? deal.activities[0].title : 'No definida',
    },
  }))

  const fields = [
    { name: 'Fase', key: 'phase' },
    { name: 'Estado', key: 'status' },
    { name: 'Valor Estimado', key: 'value' },
    { name: 'Días Activo', key: 'daysActive' },
    { name: 'Contactos', key: 'contactCount' },
    { name: 'Actividades', key: 'activityCount' },
    { name: 'Propiedad', key: 'propertyAddress' },
  ]

  const comparisonFields = fields.map((field) => {
    const values = items.map((item) => item.data[field.key])
    const numericValues = values.map((v) => (typeof v === 'number' ? v : 0))
    const maxIndex = numericValues.reduce((maxIdx, val, idx) =>
      val > numericValues[maxIdx] ? idx : maxIdx,
      0
    )

    return {
      name: field.name,
      values,
      highlights: numericValues.map((_, idx) => (idx === maxIndex ? 1 : 0)),
    }
  })

  return {
    items,
    fields: comparisonFields,
    analysis: analyzeComparison(items),
  }
}

/**
 * Compare multiple contacts
 */
export async function compareContacts(contactIds: string[]): Promise<ComparisonResult> {
  const contacts = await prisma.crmContact.findMany({
    where: { id: { in: contactIds } },
    include: {
      score: true,
      deals: true,
      activities: true,
    },
  })

  const items: ComparisonData[] = contacts.map((contact) => ({
    id: contact.id,
    type: 'contact',
    data: {
      code: contact.code,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      score: contact.score?.score || 0,
      dealCount: contact.deals.length,
      activityCount: contact.activities.length,
      lastContact: contact.activities.length > 0 ? new Date(contact.activities[0].createdAt).toLocaleDateString() : 'Nunca',
      interactionRate: contact.activities.length > 0
        ? Math.round((contact.activities.length / Math.max(1, contact.deals.length)) * 100)
        : 0,
    },
  }))

  const fields = [
    { name: 'Email', key: 'email' },
    { name: 'Teléfono', key: 'phone' },
    { name: 'Score', key: 'score' },
    { name: 'Negocios', key: 'dealCount' },
    { name: 'Actividades', key: 'activityCount' },
    { name: 'Tasa Interacción', key: 'interactionRate' },
  ]

  const comparisonFields = fields.map((field) => {
    const values = items.map((item) => item.data[field.key])
    return {
      name: field.name,
      values,
      highlights: [],
    }
  })

  return {
    items,
    fields: comparisonFields,
    analysis: analyzeComparison(items),
  }
}

/**
 * Compare multiple properties
 */
export async function compareProperties(propertyIds: string[]): Promise<ComparisonResult> {
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    include: {
      contracts: true,
    },
  })

  const items: ComparisonData[] = properties.map((property) => ({
    id: property.id,
    type: 'property',
    data: {
      address: property.address,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      rent: property.monthlyRentCLP || 0,
      contracts: property.contracts.length,
      status: property.isActive ? 'Activa' : 'Inactiva',
    },
  }))

  const fields = [
    { name: 'Dormitorios', key: 'bedrooms' },
    { name: 'Baños', key: 'bathrooms' },
    { name: 'Renta', key: 'rent' },
    { name: 'Contratos', key: 'contracts' },
  ]

  const comparisonFields = fields.map((field) => {
    const values = items.map((item) => item.data[field.key])
    return {
      name: field.name,
      values,
      highlights: [],
    }
  })

  return {
    items,
    fields: comparisonFields,
    analysis: analyzeComparison(items),
  }
}

/**
 * Analyze comparison for insights
 */
function analyzeComparison(items: ComparisonData[]): ComparisonResult['analysis'] {
  const bestValue = items.length > 0 ? items[0].id : 'N/A'

  const pros: string[] = []
  const cons: string[] = []

  if (items.length > 1) {
    // Calculate pros/cons based on numeric data
    const values = Object.values(items[0].data)
    if (values.some((v) => typeof v === 'number' && v > 100)) {
      pros.push('Valor alto')
    }
    if (values.some((v) => typeof v === 'number' && v > 10)) {
      pros.push('Actividad frecuente')
    }
  }

  return {
    bestValue,
    pros: pros.length > 0 ? pros : ['Datos consistentes'],
    cons: cons.length > 0 ? cons : ['Revisar oportunidades de mejora'],
  }
}

/**
 * Get market comparison (properties similar to given property)
 */
export async function getMarketComparison(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })

  if (!property) throw new Error('Property not found')

  // Find similar properties in same area with similar characteristics
  const similar = await prisma.property.findMany({
    where: {
      AND: [
        { id: { not: propertyId } },
        { commune: property.commune },
        { bedrooms: property.bedrooms },
        { bathrooms: property.bathrooms },
      ],
    },
    take: 5,
    orderBy: { monthlyRentCLP: 'desc' },
  })

  const avgRent = similar.length > 0 ? similar.reduce((sum, p) => sum + (p.monthlyRentCLP || 0), 0) / similar.length : 0
  const rents = similar.map((p) => p.monthlyRentCLP || 0)

  return {
    reference: property,
    similar,
    marketAnalysis: {
      avgRent,
      priceRange: {
        min: rents.length > 0 ? Math.min(...rents) : 0,
        max: rents.length > 0 ? Math.max(...rents) : 0,
      },
      recommendation: property.monthlyRentCLP && property.monthlyRentCLP > 0
        ? `Renta actual está ${
          property.monthlyRentCLP > avgRent
            ? 'arriba'
            : 'abajo'
          } del promedio del mercado`
        : 'Establecer renta de mercado',
    },
  }
}

/**
 * Get deal comparison report
 */
export async function getDealComparisonReport(brokerId: string, dealIds?: string[]) {
  const deals = await prisma.crmDeal.findMany({
    where: dealIds ? { id: { in: dealIds } } : { brokerId },
    include: { contacts: { include: { contact: true } }, activities: true },
    orderBy: { estimatedValue: 'desc' },
    take: 10,
  })

  const comparison = await compareDeals(deals.map((d) => d.id))

  return {
    deals: comparison.items,
    metrics: {
      totalValue: deals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0),
      avgValue: deals.length > 0
        ? Math.round(deals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0) / deals.length)
        : 0,
      avgDaysActive: deals.length > 0
        ? Math.round(
          deals.reduce(
            (sum, d) =>
              sum +
              Math.floor((new Date().getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
            0
          ) / deals.length
        )
        : 0,
    },
    comparison,
  }
}
