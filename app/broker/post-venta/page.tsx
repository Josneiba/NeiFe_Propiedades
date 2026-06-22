import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PostVentaDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Get all post-venta deals
  const deals = await prisma.crmDeal.findMany({
    where: {
      brokerId: session.user.id,
      phase: 'POST_VENTA',
    },
    include: {
      contacts: { include: { contact: true } },
      property: true,
      activities: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
    orderBy: { dueDate: 'asc' },
  })

  // Calculate metrics
  const totalPostVenta = deals.length
  const expiredDeals = deals.filter(d => d.dueDate && d.dueDate < new Date()).length
  const dueSoonDeals = deals.filter(d => 
    d.dueDate && 
    d.dueDate > new Date() && 
    d.dueDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length
  const totalValue = deals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0)

  // Get maintenance issues
  const maintenanceIssues = await prisma.maintenanceRequest.findMany({
    where: {
      status: { in: ['REQUESTED', 'IN_PROGRESS'] },
    },
    include: { property: true },
    take: 10,
  })

  // Get upcoming payments
  const upcomingPayments = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
    },
    include: { property: true },
    orderBy: { month: 'asc' },
    take: 10,
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-semibold text-[#FAF6F2]">
          📋 Dashboard Post-Venta
        </h1>
        <p className="text-sm text-[#9C8578] mt-1">
          Seguimiento de negocios después del cierre y gestión de post-venta
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1C2828] border-[#D5C3B6]/10">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#9C8578] text-sm">Negocios Post-Venta</p>
                <p className="text-2xl font-bold text-[#D5C3B6] mt-2">{totalPostVenta}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-[#5E8B8C]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1C2828] border-[#D5C3B6]/10">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#9C8578] text-sm">Vencimientos Próximos</p>
                <p className="text-2xl font-bold text-[#B8965A] mt-2">{dueSoonDeals}</p>
              </div>
              <Clock className="h-8 w-8 text-[#B8965A]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1C2828] border-[#D5C3B6]/10">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#9C8578] text-sm">Vencidos</p>
                <p className="text-2xl font-bold text-[#C27F79] mt-2">{expiredDeals}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-[#C27F79]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1C2828] border-[#D5C3B6]/10">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#9C8578] text-sm">Valor Total</p>
                <p className="text-lg font-bold text-[#D5C3B6] mt-2">
                  ${(totalValue / 1_000_000).toFixed(1)}M
                </p>
              </div>
              <ArrowRight className="h-8 w-8 text-[#5E8B8C]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Negocios Post-Venta */}
      <Card className="bg-[#1C2828] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">Negocios Post-Venta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#9C8578]">Sin negocios en post-venta</p>
              </div>
            ) : (
              deals.map((deal) => {
                const isExpired = deal.dueDate && deal.dueDate < new Date()
                const isDueSoon = deal.dueDate && 
                  deal.dueDate > new Date() && 
                  deal.dueDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                return (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-4 bg-[#2D3C3C]/50 rounded-lg border border-[#D5C3B6]/5 hover:bg-[#2D3C3C] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-[#B8965A] text-sm">{deal.code}</span>
                        <span className="text-[#FAF6F2] font-medium">{deal.title}</span>
                        {isExpired && (
                          <Badge className="bg-[#C27F79]/20 text-[#FF9F9F]">Vencido</Badge>
                        )}
                        {isDueSoon && !isExpired && (
                          <Badge className="bg-[#B8965A]/20 text-[#D4AF37]">Próximo a vencer</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#9C8578]">
                        <span>📍 {deal.property?.address || 'Sin propiedad'}</span>
                        <span>👥 {deal.contacts.length} contacto(s)</span>
                        {deal.dueDate && (
                          <span>📅 Vence: {deal.dueDate.toLocaleDateString('es-CL')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#D5C3B6] font-semibold">
                        ${(deal.estimatedValue || 0).toLocaleString()}
                      </p>
                      <a
                        href={`/broker/crm/contactos/${deal.id}`}
                        className="text-[#5E8B8C] hover:text-[#D5C3B6] text-sm"
                      >
                        Ver detalles →
                      </a>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid: Maintenance & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Issues */}
        <Card className="bg-[#1C2828] border-[#D5C3B6]/10">
          <CardHeader>
            <CardTitle className="text-[#FAF6F2]">Mantenciones Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceIssues.length === 0 ? (
                <p className="text-[#9C8578] text-sm">Sin mantenciones pendientes</p>
              ) : (
                maintenanceIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-[#2D3C3C]/50 rounded-lg border border-[#D5C3B6]/5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[#FAF6F2] font-medium text-sm">{issue.description}</p>
                        <p className="text-[#9C8578] text-xs mt-1">
                          {issue.property?.address}
                        </p>
                        <Badge className="mt-2 bg-[#B8965A]/20 text-[#D4AF37]" variant="outline">
                          {issue.category}
                        </Badge>
                      </div>
                      <span className="text-[#5E8B8C] text-xs">
                        {issue.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="bg-[#1C2828] border-[#D5C3B6]/10">
          <CardHeader>
            <CardTitle className="text-[#FAF6F2]">Próximos Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.length === 0 ? (
                <p className="text-[#9C8578] text-sm">Sin pagos próximos</p>
              ) : (
                upcomingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 bg-[#2D3C3C]/50 rounded-lg border border-[#D5C3B6]/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#FAF6F2] font-medium text-sm">
                          ${payment.amountCLP?.toLocaleString() || 'N/A'}
                        </p>
                        <p className="text-[#9C8578] text-xs mt-1">
                          {payment.property?.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#D5C3B6] text-sm">
                          {payment.month}/{payment.year}
                        </p>
                        <Badge
                          className={`mt-1 ${
                            payment.status === 'PAID'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-[#1C2828] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">Actividades Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {deals.length === 0 ? (
              <p className="text-[#9C8578] text-sm">Sin actividades</p>
            ) : (
              deals
                .flatMap((deal) =>
                  deal.activities.map((activity) => ({
                    ...activity,
                    dealCode: deal.code,
                    dealTitle: deal.title,
                  }))
                )
                .slice(0, 8)
                .map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="text-lg mt-0.5">
                      {activity.type === 'LLAMADA' && '📞'}
                      {activity.type === 'EMAIL' && '📧'}
                      {activity.type === 'NOTA' && '📝'}
                      {activity.type === 'WHATSAPP' && '💬'}
                      {activity.type === 'VISITA' && '🏠'}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#D5C3B6]">
                        {activity.dealCode} - {activity.description}
                      </p>
                      <p className="text-[#9C8578] text-xs">
                        {activity.createdAt.toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
