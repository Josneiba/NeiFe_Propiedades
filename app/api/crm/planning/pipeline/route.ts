import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { executeSavedView } from '@/lib/crm-saved-views'
import { getISOWeekRange, getCurrentWeekNumber, getCurrentYear } from '@/lib/goal-engine'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const brokerId = session.user.id
  const now = new Date()
  const { start, end } = getISOWeekRange(getCurrentWeekNumber(now), getCurrentYear(now))

  // Category definitions: map to saved-view filters (entity = DEALS or CONTACTS)
  const categories: Array<{ key: string; label: string; savedViewQuery: any; mapping: { model: string; plannedRule: string } }> = [
    { key: 'new_leads', label: 'New Leads', savedViewQuery: { entity: 'CONTACTS', filters: { brokerId } }, mapping: { model: 'CrmContact', plannedRule: 'contacts with activities this week' } },
    { key: 'visitas_programadas', label: 'Visitas Programadas', savedViewQuery: { entity: 'CONTACTS', filters: { futureVisitsOnly: true, brokerId } }, mapping: { model: 'CrmContact', plannedRule: 'contacts with scheduled visits' } },
    { key: 'negociaciones', label: 'Negociaciones', savedViewQuery: { entity: 'DEALS', filters: { stage: 'NEGOCIANDO', brokerId } }, mapping: { model: 'CrmDeal', plannedRule: 'deals with activities/tasks this week' } },
    { key: 'contratos', label: 'Contratos', savedViewQuery: { entity: 'DEALS', filters: { stage: 'FIRMA_CONTRATO', status: 'ACTIVE', brokerId } }, mapping: { model: 'CrmDeal', plannedRule: 'deals with tasks this week' } },
    { key: 'propiedades_disponibles', label: 'Propiedades Disponibles', savedViewQuery: { entity: 'PROPERTIES', filters: { agentId: brokerId } }, mapping: { model: 'Property', plannedRule: 'properties with visits scheduled this week' } },
    { key: 'captacion', label: 'Captación', savedViewQuery: { entity: 'DEALS', filters: { stage: 'PROPIEDAD_CAPTADA', brokerId } }, mapping: { model: 'CrmDeal', plannedRule: 'deals with capture activities this week' } },
    { key: 'cobranza', label: 'Cobranza', savedViewQuery: { entity: 'PAYMENTS', filters: { property: { managedBy: brokerId } } }, mapping: { model: 'Payment', plannedRule: 'payments with dueDate this week' } },
    { key: 'renovaciones', label: 'Renovaciones', savedViewQuery: { entity: 'MANDATES', filters: { brokerId } }, mapping: { model: 'Mandate', plannedRule: 'mandates expiring this week' } },
    { key: 'mantenciones', label: 'Mantenciones', savedViewQuery: { entity: 'MAINTENANCE', filters: { property: { managedBy: brokerId } } }, mapping: { model: 'Maintenance', plannedRule: 'open maintenance requests' } },
  ]

  const rows: any[] = []

  for (const cat of categories) {
    try {
      // Execute saved view to reuse filtering logic and return example items
      const result = await executeSavedView(prisma, brokerId, cat.savedViewQuery)
      const items: any[] = Array.isArray(result.results) ? result.results : []
      const activeItems = result.count ?? items.length

      // Compute plannedThisWeek: count of items that have an activity or task created this week
      let plannedThisWeek = 0
      if (cat.savedViewQuery.entity === 'DEALS') {
        const ids = items.map((i: any) => i.id).filter(Boolean)
        if (ids.length > 0) {
          const rowsWithPlan = await prisma.crmActivity.findMany({
            where: { dealId: { in: ids }, createdAt: { gte: start, lt: end } },
            select: { dealId: true },
          })
          const uniqueDealIds = new Set(rowsWithPlan.map((r) => r.dealId))
          plannedThisWeek = uniqueDealIds.size
        }
      } else if (cat.savedViewQuery.entity === 'CONTACTS') {
        const ids = items.map((i: any) => i.id).filter(Boolean)
        if (ids.length > 0) {
          const rowsWithPlan = await prisma.crmActivity.findMany({
            where: { contactId: { in: ids }, createdAt: { gte: start, lt: end } },
            select: { contactId: true },
          })
          const uniqueContactIds = new Set(rowsWithPlan.map((r) => r.contactId))
          plannedThisWeek = uniqueContactIds.size
        }
      } else if (cat.savedViewQuery.entity === 'PROPERTIES') {
        const ids = items.map((i: any) => i.id).filter(Boolean)
        if (ids.length > 0) {
          // CrmActivity doesn't have propertyId. Find deals tied to these properties, then activities for those deals.
          const deals = await prisma.crmDeal.findMany({ where: { propertyId: { in: ids } }, select: { id: true } })
          const dealIds = deals.map((d) => d.id).filter(Boolean)
          if (dealIds.length > 0) {
            const rowsWithPlan = await prisma.crmActivity.findMany({
              where: { dealId: { in: dealIds }, createdAt: { gte: start, lt: end } },
              select: { dealId: true },
            })
            const uniqueDealIds = new Set(rowsWithPlan.map((r) => r.dealId))
            plannedThisWeek = uniqueDealIds.size
          } else {
            plannedThisWeek = 0
          }
        }
      } else {
        plannedThisWeek = 0
      }

      rows.push({
        key: cat.key,
        category: cat.label,
        plannedThisWeek,
        activeItems,
        savedViewQuery: cat.savedViewQuery,
        mapping: cat.mapping,
        items: items.slice(0, 200),
      })
    } catch (error) {
      console.error('Error building pipeline category', cat.key, error)
      rows.push({ key: cat.key, category: cat.label, plannedThisWeek: 0, activeItems: 0, savedViewQuery: cat.savedViewQuery, mapping: cat.mapping, items: [] })
    }
  }

  return NextResponse.json({ rows })
}

