/**
 * Motor de recomendaciones inteligentes para corredores
 * Analiza el contexto del corredor y genera sugerencias accionables
 */

import { prisma } from "./prisma";

export interface Recommendation {
  id: string;
  type:
    | "FOLLOWUP"
    | "DEADLINE"
    | "STALE"
    | "MATCH"
    | "RENEWAL"
    | "RISK"
    | "CLOSING";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  dealId?: string;
  contactId?: string;
  createdAt: Date;
}

/**
 * Generar recomendaciones basadas en reglas de negocio
 */
export async function getRecommendations(
  brokerId: string
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const now = new Date();

  try {
    // 1. Deals sin actividad reciente (>5 días) — URGENTE
    const staleDeals = await prisma.crmDeal.findMany({
      where: {
        brokerId,
        status: "ACTIVE",
      },
      include: {
        contacts: { include: { contact: true }, take: 1 },
        property: { select: { address: true, code: true } },
        activities: {
          where: { createdAt: { gte: new Date(now.getTime() - 5 * 86_400_000) } },
          select: { id: true },
        },
      },
      take: 10,
    });

    staleDeals
      .filter((deal) => deal.activities.length === 0)
      .forEach((deal) => {
        const contact = deal.contacts[0]?.contact.name || "Contacto";
        const days = Math.floor(
          (now.getTime() - new Date(deal.updatedAt).getTime()) / 86_400_000
        );
        recommendations.push({
          id: `stale-${deal.id}`,
          type: "FOLLOWUP",
          priority: days > 10 ? "HIGH" : "MEDIUM",
          title: "Follow-up urgente",
          message: `${contact} no tiene actividad hace ${days} días en ${deal.code}. El 60% de los leads se pierden sin seguimiento.`,
          actionLabel: "Ver operación",
          actionUrl: `/broker/crm/workspace`,
          dealId: deal.id,
          createdAt: now,
        });
      });

    // 2. Fechas venciendo en <3 días — CRÍTICO
    const urgentDeals = await prisma.crmDeal.findMany({
      where: {
        brokerId,
        status: "ACTIVE",
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 3 * 86_400_000),
        },
      },
      take: 5,
    });

    urgentDeals.forEach((deal) => {
      const days = Math.ceil(
        (deal.dueDate!.getTime() - now.getTime()) / 86_400_000
      );
      recommendations.push({
        id: `deadline-${deal.id}`,
        type: "DEADLINE",
        priority: "HIGH",
        title: "⏰ Fecha objetivo próxima",
        message: `"${deal.title}" (${deal.code}) vence en ${days} día${days !== 1 ? "s" : ""}. ¿Ya están firmando?`,
        actionLabel: "Revisar",
        actionUrl: `/broker/crm/workspace`,
        dealId: deal.id,
        createdAt: now,
      });
    });

    // 3. Deals estancados en la misma etapa >10 días
    const stagnantDeals = await prisma.crmDeal.findMany({
      where: {
        brokerId,
        status: "ACTIVE",
      },
      include: {
        contacts: { include: { contact: true }, take: 1 },
      },
      take: 10,
    });

    stagnantDeals
      .filter((deal) => {
        const daysSinceStageChange = Math.floor(
          (now.getTime() - new Date(deal.updatedAt || deal.createdAt).getTime()) /
            86_400_000
        );
        return daysSinceStageChange > 10;
      })
      .slice(0, 3)
      .forEach((deal) => {
        const daysSinceStageChange = Math.floor(
          (now.getTime() - new Date(deal.updatedAt || deal.createdAt).getTime()) /
            86_400_000
        );
        const contact = deal.contacts[0]?.contact.name || "Lead";
        recommendations.push({
          id: `stagnant-${deal.id}`,
          type: "STALE",
          priority: "MEDIUM",
          title: "💤 Deal estancado",
          message: `${contact} lleva ${daysSinceStageChange} días en esta etapa. Sugiere agendar reunión presencial para destrabar.`,
          actionLabel: "Agendar seguimiento",
          actionUrl: `/broker/crm/workspace`,
          dealId: deal.id,
          createdAt: now,
        });
      });

    // 4. Contratos próximos a vencer (renovaciones)
    const expiringContracts = await prisma.contract.findMany({
      where: {
        property: { managedBy: brokerId },
        status: "ACTIVE",
        endDate: {
          gte: now,
          lte: new Date(now.getTime() + 60 * 86_400_000),
        },
      },
      include: { property: { select: { address: true, name: true } } },
      take: 3,
    });

    expiringContracts.forEach((contract) => {
      const days = Math.ceil(
        (contract.endDate!.getTime() - now.getTime()) / 86_400_000
      );
      recommendations.push({
        id: `renewal-${contract.id}`,
        type: "RENEWAL",
        priority: days < 30 ? "HIGH" : days < 45 ? "MEDIUM" : "LOW",
        title: "🔄 Renovación próxima",
        message: `Contrato de ${contract.property.address} vence en ${days} días. Inicia la renovación ahora antes de que busque otra opción.`,
        actionLabel: "Ver contrato",
        actionUrl: `/broker/contratos`,
        createdAt: now,
      });
    });

    // 5. Riesgo de pérdida — score bajo + deadline próximo
    const riskDeals = await prisma.crmDeal.findMany({
      where: {
        brokerId,
        status: "ACTIVE",
        dueDate: { lte: new Date(now.getTime() + 7 * 86_400_000) },
      },
      include: {
        contacts: {
          include: { contact: { include: { score: true } } },
          take: 1,
        },
      },
      take: 5,
    });

    riskDeals
      .filter((deal) => {
        const score = deal.contacts[0]?.contact.score?.score || 50;
        return score < 35;
      })
      .forEach((deal) => {
        const days = Math.ceil(
          (deal.dueDate!.getTime() - now.getTime()) / 86_400_000
        );
        const score = deal.contacts[0]?.contact.score?.score || 50;
        recommendations.push({
          id: `risk-${deal.id}`,
          type: "RISK",
          priority: "HIGH",
          title: "⚠️ Cierre en riesgo",
          message: `Score bajo (${score}/100) + vencimiento en ${days} días. Riesgo de pérdida muy alto. Prioriza hoy.`,
          actionLabel: "Tomar acción",
          actionUrl: `/broker/crm/workspace`,
          dealId: deal.id,
          createdAt: now,
        });
      });

    // 6. Oportunidad de comisión — deals próximos a cerrar
    const closingDeals = await prisma.crmDeal.findMany({
      where: {
        brokerId,
        status: "ACTIVE",
        phase: "POST_VENTA",
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 15 * 86_400_000),
        },
      },
      take: 3,
    });

    closingDeals.forEach((deal) => {
      const commissionFormatted = deal.commission
        ? `$${deal.commission.toLocaleString("es-CL")}`
        : "a confirmar";
      recommendations.push({
        id: `closing-${deal.id}`,
        type: "CLOSING",
        priority: "MEDIUM",
        title: "💰 Comisión próxima",
        message: `${deal.code} está en post-venta y vence en ${Math.ceil((deal.dueDate!.getTime() - now.getTime()) / 86_400_000)} días. Comisión: ${commissionFormatted}`,
        actionLabel: "Confirmar",
        actionUrl: `/broker/crm/workspace`,
        dealId: deal.id,
        createdAt: now,
      });
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
  }

  // Ordenar por prioridad
  return recommendations.sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.priority] - order[b.priority];
  });
}
