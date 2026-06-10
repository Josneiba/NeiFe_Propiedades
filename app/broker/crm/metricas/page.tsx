// app/broker/crm/metricas/page.tsx — Server component
import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function MetricasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const brokerId = session.user.id

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    dealsByPhase,
    wonThisMonth,
    lostThisMonth,
    topRisks,
    commissionEstimated,
  ] = await Promise.all([
    prisma.crmDeal.groupBy({
      by: ['phase'],
      where: { brokerId, status: 'ACTIVE' },
      _count: true,
    }),
    prisma.crmDeal.count({ where: { brokerId, status: 'WON', wonAt: { gte: monthStart } } }),
    prisma.crmDeal.count({ where: { brokerId, status: 'LOST', updatedAt: { gte: monthStart } } }),
    prisma.crmContactScore.findMany({
      where: { contact: { brokerId, status: 'ACTIVE' } },
      include: { contact: true },
      orderBy: { score: 'asc' },
      take: 20,
    }),
    prisma.crmDeal.aggregate({
      where: { brokerId, status: 'ACTIVE' },
      _sum: { commission: true },
    }),
  ])

  const conversionRate = wonThisMonth + lostThisMonth > 0
    ? Math.round((wonThisMonth / (wonThisMonth + lostThisMonth)) * 100)
    : 0

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#FAF6F2]">Métricas</h1>
        <p className="text-xs text-[#9C8578] mt-0.5">Análisis de desempeño del CRM</p>
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
            ${commissionEstimated._sum.commission ? new Intl.NumberFormat('es-CL').format(commissionEstimated._sum.commission) : '0'}
          </p>
          <p className="text-[10px] text-[#9C8578] mt-1">En pipeline</p>
        </div>
      </div>

      {/* Distribución por fase */}
      <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[#FAF6F2] mb-4">Distribución por fase</h2>
        <div className="space-y-3">
          {dealsByPhase.map((item) => (
            <div key={item.phase} className="flex items-center gap-4">
              <span className="text-xs text-[#9C8578] w-24">{item.phase}</span>
              <div className="flex-1 bg-[#2D3C3C] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#5E8B8C] h-full transition-all"
                  style={{ width: `${(item._count / dealsByPhase.reduce((sum, d) => sum + d._count, 0)) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[#FAF6F2] w-8">{item._count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de scoring */}
      <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[#FAF6F2] mb-4">Contactos en riesgo (bajo score)</h2>
        <div className="space-y-2">
          {topRisks.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs bg-[#2D3C3C]/60 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#B8965A]">{s.contact.code}</span>
                <span className="text-[#D5C3B6]">{s.contact.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#9C8578]">{s.lastActivityDays}d sin actividad</span>
                <span className={`font-semibold ${s.score < 30 ? 'text-red-400' : s.score < 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {s.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
