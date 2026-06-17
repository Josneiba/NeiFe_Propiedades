// app/broker/crm/metricas/page.tsx — Server component
import { auth } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MetricasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const brokerId = session.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    dealsByPhase,
    wonThisMonth,
    lostThisMonth,
    topRisks,
    commissionEstimated,
    staleDeals,
    unpairedTenants,
  ] = await Promise.all([
    prisma.crmDeal.groupBy({
      by: ["phase"],
      where: { brokerId, status: "ACTIVE" },
      _count: true,
    }),
    prisma.crmDeal.count({
      where: { brokerId, status: "WON", wonAt: { gte: monthStart } },
    }),
    prisma.crmDeal.count({
      where: { brokerId, status: "LOST", updatedAt: { gte: monthStart } },
    }),
    prisma.crmContactScore.findMany({
      where: { contact: { brokerId, status: "ACTIVE" } },
      include: { contact: true },
      orderBy: { score: "asc" },
      take: 20,
    }),
    prisma.crmDeal.aggregate({
      where: { brokerId, status: "ACTIVE" },
      _sum: { commission: true },
    }),
    // Deals en venta sin actividad reciente
    prisma.crmDeal.findMany({
      where: {
        brokerId,
        status: "ACTIVE",
        phase: { in: ["VENTA", "POST_VENTA"] },
        activities: {
          none: {
            createdAt: { gte: new Date(Date.now() - 3 * 86_400_000) },
          },
        },
      },
      include: {
        property: { select: { code: true, address: true } },
        contacts: {
          include: { contact: { select: { code: true, name: true } } },
          take: 2,
        },
      },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    // Arrendatarios sin propiedad vinculada
    prisma.crmContact.findMany({
      where: {
        brokerId,
        type: "ARRENDATARIO",
        status: "ACTIVE",
        deals: { none: { deal: { propertyId: { not: null } } } },
      },
      take: 3,
    }),
  ]);

  const conversionRate =
    wonThisMonth + lostThisMonth > 0
      ? Math.round((wonThisMonth / (wonThisMonth + lostThisMonth)) * 100)
      : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#FAF6F2]">Métricas</h1>
        <p className="text-xs text-[#9C8578] mt-0.5">
          Análisis de desempeño del CRM
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
          <p className="text-xs text-[#9C8578] mb-1">Tasa de conversión</p>
          <p className="text-3xl font-bold text-[#5E8B8C]">{conversionRate}%</p>
          <p className="text-[10px] text-[#9C8578] mt-1">Este mes</p>
        </div>
        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
          <p className="text-xs text-[#9C8578] mb-1">Ganados</p>
          <p className="text-3xl font-bold text-[#22c55e]">{wonThisMonth}</p>
          <p className="text-[10px] text-[#9C8578] mt-1">Este mes</p>
        </div>
        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
          <p className="text-xs text-[#9C8578] mb-1">Perdidos</p>
          <p className="text-3xl font-bold text-[#ef4444]">{lostThisMonth}</p>
          <p className="text-[10px] text-[#9C8578] mt-1">Este mes</p>
        </div>
        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
          <p className="text-xs text-[#9C8578] mb-1">Comisión estimada</p>
          <p className="text-3xl font-bold text-[#B8965A]">
            $
            {commissionEstimated._sum.commission
              ? new Intl.NumberFormat("es-CL").format(
                  commissionEstimated._sum.commission,
                )
              : "0"}
          </p>
          <p className="text-[10px] text-[#9C8578] mt-1">En pipeline</p>
        </div>
      </div>

      {/* Distribución por fase */}
      <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[#FAF6F2] mb-4">
          Distribución por fase
        </h2>
        <div className="space-y-3">
          {dealsByPhase.map((item) => {
            const phaseLabel =
              item.phase === "PRE_VENTA"
                ? "Pre-Venta"
                : item.phase === "VENTA"
                  ? "Venta"
                  : item.phase === "POST_VENTA"
                    ? "Post-Venta"
                    : item.phase;
            const phaseColor =
              item.phase === "PRE_VENTA"
                ? "#1a3a5c"
                : item.phase === "VENTA"
                  ? "#0e4d3a"
                  : item.phase === "POST_VENTA"
                    ? "#4a1a5c"
                    : "#5E8B8C";
            return (
              <div key={item.phase} className="flex items-center gap-4">
                <span className="text-xs text-[#9C8578] w-24">
                  {phaseLabel}
                </span>
                <div className="flex-1 bg-[#2D3C3C] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(item._count / dealsByPhase.reduce((sum, d) => sum + d._count, 0)) * 100}%`,
                      backgroundColor: phaseColor,
                    }}
                  />
                </div>
                <span className="text-xs text-[#FAF6F2] w-8">
                  {item._count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOTOR DE ACCIONES RECOMENDADAS */}
      <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[#FAF6F2] mb-1">
          ⚡ Próximas acciones
        </h2>
        <p className="text-xs text-[#9C8578] mb-4">
          Lo que necesitas hacer hoy para no perder oportunidades
        </p>

        <div className="space-y-2">
          {/* Deals en venta sin actividad reciente */}
          {staleDeals.map((deal) => {
            const mainContact = deal.contacts[0];
            return (
              <a
                key={deal.id}
                href={`/broker/crm/workspace`}
                className="flex items-center justify-between text-xs bg-[#2D3C3C]/60 rounded-lg px-3 py-2.5 hover:bg-[#2D3C3C] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg">
                    <Lightning className="h-5 w-5 text-[#B8965A]" />
                  </div>
                  <div>
                    <div className="text-[#FAF6F2] font-medium">
                      Contactar sobre {deal.title}
                    </div>
                    <div className="text-[#9C8578] text-[9px] mt-0.5">
                      Deal en{" "}
                      <strong>
                        {deal.phase === "VENTA" ? "Venta" : "Post-Venta"}
                      </strong>{" "}
                      sin actividad reciente
                      {mainContact &&
                        ` — contactar a ${mainContact.contact.name}`}
                    </div>
                  </div>
                </div>
                <div className="text-[#9C8578] group-hover:text-[#D5C3B6]">
                  →
                </div>
              </a>
            );
          })}

          {/* Arrendatarios sin propiedad */}
          {unpairedTenants.map((c) => (
            <a
              key={c.id}
              href={`/broker/crm/contactos/${c.id}`}
              className="flex items-center justify-between text-xs bg-[#2D3C3C]/60 rounded-lg px-3 py-2.5 hover:bg-[#2D3C3C] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="text-lg">
                  <Search className="h-5 w-5 text-[#B8965A]" />
                </div>
                <div>
                  <div className="text-[#FAF6F2] font-medium">
                    Asignar propiedad a [{c.code}] {c.name}
                  </div>
                  <div className="text-[#9C8578] text-[9px] mt-0.5">
                    Arrendatario activo sin propiedad vinculada — no puede
                    avanzar en el funnel
                  </div>
                </div>
              </div>
              <div className="text-[#9C8578] group-hover:text-[#D5C3B6]">→</div>
            </a>
          ))}

          {staleDeals.length === 0 && unpairedTenants.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs text-[#9C8578]">
                🎯 Sin acciones urgentes por ahora — buen trabajo
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de scoring */}
      <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[#FAF6F2] mb-4">
          Contactos en riesgo (bajo score)
        </h2>
        <div className="space-y-2">
          {topRisks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-[#9C8578]">
                ✅ Todos los contactos están al día
              </p>
            </div>
          ) : (
            topRisks.map((s) => (
              <a
                key={s.id}
                href={`/broker/crm/contactos/${s.contactId}`}
                className="flex items-center justify-between text-xs bg-[#2D3C3C]/60 rounded-lg px-3 py-2.5 hover:bg-[#2D3C3C] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {/* Score visual circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[9px] ${
                      s.score < 30
                        ? "bg-red-500/20 text-red-400"
                        : s.score < 50
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {Math.round(s.score)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#B8965A]">
                        {s.contact.code}
                      </span>
                      <span className="text-[#D5C3B6]">{s.contact.name}</span>
                    </div>
                    <div
                      className={`text-[9px] mt-0.5 ${
                        s.lastActivityDays > 7
                          ? "text-red-400"
                          : s.lastActivityDays > 3
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {s.lastActivityDays === 999
                        ? "Sin actividad"
                        : `${s.lastActivityDays}d sin contacto`}
                    </div>
                  </div>
                </div>
                {s.recommendation && (
                  <div className="text-[10px] text-[#9C8578] group-hover:text-[#D5C3B6] transition-colors max-w-xs text-right">
                    {s.recommendation}
                  </div>
                )}
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
