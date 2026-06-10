// lib/crm-scoring.ts
import { prisma } from '@/lib/prisma'
import { CrmDealStage } from '@prisma/client'

const STAGE_WEIGHTS: Record<CrmDealStage, number> = {
  NUEVO_LEAD: 0,
  CONTACTO_INICIADO: 3,
  VISITA_AGENDADA: 6,
  PROPIEDAD_CAPTADA: 9,
  PUBLICADA: 12,
  MOSTRANDO: 15,
  OFERTA_RECIBIDA: 18,
  DOCS_REVISION: 21,
  NEGOCIANDO: 24,
  FIRMA_CONTRATO: 27,
  ENTREGA_LLAVES: 30,
  ADMINISTRAR: 33,
}

export async function recalculateAllScores(brokerId: string) {
  const contacts = await prisma.crmContact.findMany({
    where: { brokerId, status: 'ACTIVE' },
    include: {
      activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      deals: { 
        include: { 
          deal: { 
            include: { property: true } 
          } 
        },
        where: { deal: { status: 'ACTIVE' } }
      },
    },
  })

  for (const contact of contacts) {
    let score = 50

    // Días sin actividad
    const lastActivity = contact.activities[0]
    const daysSince = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity.createdAt).getTime()) / 86_400_000)
      : 999
    if (daysSince > 7) score -= 20
    else if (daysSince > 3) score -= 10
    else if (daysSince === 0) score += 10

    // Tiene propiedad vinculada en algún deal
    const hasProperty = contact.deals.some((dc) => dc.deal.property !== null)
    if (hasProperty) score += 15

    // Etapa más avanzada de sus deals activos
    const maxWeight = contact.deals.reduce((max, dc) => {
      const w = STAGE_WEIGHTS[dc.deal.stage] ?? 0
      return w > max ? w : max
    }, 0)
    score += maxWeight

    // Completud de datos
    if (contact.phone) score += 5
    if (contact.email) score += 5
    if (contact.rut) score += 5

    score = Math.min(100, Math.max(0, score))

    const urgencyLevel = daysSince > 7 ? 'HIGH' : daysSince > 3 ? 'MEDIUM' : 'LOW'
    const recommendation = buildRecommendation(contact, daysSince)

    await prisma.crmContactScore.upsert({
      where: { contactId: contact.id },
      create: {
        contactId: contact.id,
        score,
        lastActivityDays: daysSince,
        urgencyLevel,
        recommendation,
      },
      update: {
        score,
        lastActivityDays: daysSince,
        urgencyLevel,
        recommendation,
        calculatedAt: new Date(),
      },
    })
  }
}

function buildRecommendation(contact: any, daysSince: number): string {
  if (daysSince > 7) {
    return `⚠️ ${contact.name} lleva ${daysSince} días sin contacto — riesgo de perder el lead`
  }
  if (contact.type === 'ARRENDATARIO') {
    const hasProperty = contact.deals.some((dc: any) => dc.deal.property !== null)
    if (!hasProperty) {
      return `🔍 [${contact.code}] ${contact.name} busca arriendo pero no tiene propiedad asignada`
    }
  }
  if (contact.type === 'PROPIETARIO') {
    const hasPendingMandate = contact.deals.some(
      (dc: any) => dc.deal.stage === 'PROPIEDAD_CAPTADA'
    )
    if (hasPendingMandate) {
      return `📋 [${contact.code}] ${contact.name} — propiedad captada, solicitar firma de mandato`
    }
  }
  return `✅ [${contact.code}] ${contact.name} — al día`
}
