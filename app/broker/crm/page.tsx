// app/broker/crm/page.tsx — Server Component
import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, AlertCircle, Users, Kanban } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CrmDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const brokerId = session.user.id
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    activeDeals,
    wonThisMonth,
    contactsAtRisk,
    topScores,
    dealsPreVenta,
    dealsVenta,
    dealsPostVenta,
  ] = await Promise.all([
    prisma.crmDeal.count({ where: { brokerId, status: 'ACTIVE' } }),
    prisma.crmDeal.count({ where: { brokerId, status: 'WON', wonAt: { gte: monthStart } } }),
    prisma.crmContactScore.count({
      where: { contact: { brokerId, status: 'ACTIVE' }, lastActivityDays: { gte: 5 } },
    }),
    prisma.crmContactScore.findMany({
      where: { contact: { brokerId, status: 'ACTIVE' } },
      include: { contact: true },
      orderBy: { score: 'asc' },
      take: 5,
    }),
    prisma.crmDeal.count({ where: { brokerId, status: 'ACTIVE', phase: 'PRE_VENTA' } }),
    prisma.crmDeal.count({ where: { brokerId, status: 'ACTIVE', phase: 'VENTA' } }),
    prisma.crmDeal.count({ where: { brokerId, status: 'ACTIVE', phase: 'POST_VENTA' } }),
  ])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#FAF6F2]">Centro CRM</h1>
          <p className="text-xs text-[#9C8578] mt-0.5">Tu embudo de ventas en tiempo real</p>
        </div>
        <Button asChild size="sm" className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80">
          <Link href="/broker/crm/workspace">
            <Kanban className="h-3.5 w-3.5 mr-1.5" />
            Ir al Workspace
          </Link>
        </Button>
      </div>

      {/* KPIs del embudo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pre-Venta', count: dealsPreVenta, color: '#1a3a5c', href: '/broker/crm/workspace' },
          { label: 'Venta activa', count: dealsVenta, color: '#0e4d3a', href: '/broker/crm/workspace' },
          { label: 'Post-Venta', count: dealsPostVenta, color: '#4a1a5c', href: '/broker/crm/workspace' },
          { label: 'Ganados este mes', count: wonThisMonth, color: '#B8965A', href: '/broker/crm/metricas' },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href}
            className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4 hover:border-[#D5C3B6]/25 transition-colors"
          >
            <p className="text-xs text-[#9C8578] mb-1">{kpi.label}</p>
            <p className="text-3xl font-bold" style={{ color: kpi.color === '#1a3a5c' ? '#5E8B8C' : kpi.color }}>
              {kpi.count}
            </p>
          </Link>
        ))}
      </div>

      {/* Contactos en riesgo */}
      {contactsAtRisk > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">
              {contactsAtRisk} contacto{contactsAtRisk > 1 ? 's' : ''} sin actividad por más de 5 días
            </span>
          </div>
          <div className="space-y-2">
            {topScores.filter((s) => s.lastActivityDays >= 5).slice(0, 3).map((s) => (
              <Link key={s.id} href={`/broker/crm/contactos/${s.contactId}`}
                className="flex items-center justify-between text-xs bg-red-900/30 rounded-lg px-3 py-2 hover:bg-red-900/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#B8965A]">{s.contact.code}</span>
                  <span className="text-[#D5C3B6]">{s.contact.name}</span>
                </div>
                <span className="text-red-400">{s.lastActivityDays}d sin contacto</span>
              </Link>
            ))}
          </div>
          <Link href="/broker/crm/metricas" className="text-[10px] text-[#9C8578] hover:text-[#D5C3B6] flex items-center gap-1 mt-2">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/broker/crm/workspace"
          className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4 flex items-center gap-3 hover:border-[#5E8B8C]/50 transition-colors group"
        >
          <Kanban className="h-6 w-6 text-[#5E8B8C]" />
          <div>
            <p className="text-sm font-medium text-[#FAF6F2]">Workspace</p>
            <p className="text-[10px] text-[#9C8578]">{activeDeals} deals activos</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#9C8578] ml-auto group-hover:text-[#5E8B8C] transition-colors" />
        </Link>
        <Link href="/broker/crm/contactos"
          className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-4 flex items-center gap-3 hover:border-[#5E8B8C]/50 transition-colors group"
        >
          <Users className="h-6 w-6 text-[#5E8B8C]" />
          <div>
            <p className="text-sm font-medium text-[#FAF6F2]">Contactos</p>
            <p className="text-[10px] text-[#9C8578]">Directorio completo</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#9C8578] ml-auto group-hover:text-[#5E8B8C] transition-colors" />
        </Link>
      </div>
    </div>
  )
}
