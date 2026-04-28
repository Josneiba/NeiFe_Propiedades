import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Building2, Wrench, AlertTriangle, TrendingUp, Plus, MapPin, Eye, FileText, BellRing, Receipt, CalendarClock } from 'lucide-react'
import { getErrorMessage } from '@/lib/error-handler'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Pagado', className: 'bg-[#5E8B8C] text-[#FAF6F2]' },
  PENDING: { label: 'Pendiente', className: 'bg-[#C27F79] text-[#FAF6F2]' },
  OVERDUE: { label: 'Atrasado', className: 'bg-red-600 text-[#FAF6F2]' },
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDate() {
  return new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function BrokerDashboardPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'BROKER' && session.user.role !== 'OWNER')) {
    redirect('/login')
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  try {
    const [mandates, mandateStats, paidPayments, pendingPayments, activeMaintenances, recentStatements, recentMessages] =
      await Promise.all([
        prisma.mandate.findMany({
          where: { 
            brokerId: session.user.id, 
            status: 'ACTIVE'
          },
          include: {
            property: {
              include: {
                tenant: { select: { name: true } },
                landlord: { select: { name: true, email: true } },
                _count: {
                  select: {
                    maintenance: {
                      where: {
                        status: {
                          in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
                        },
                      },
                    },
                  },
                },
                payments: { 
                  where: { month: currentMonth, year: currentYear }, 
                  take: 1 
                },
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.mandate.count({
          where: { brokerId: session.user.id, status: 'ACTIVE' },
        }),
        prisma.payment.aggregate({
          where: {
            property: { 
              mandates: {
                some: {
                  brokerId: session.user.id,
                  status: 'ACTIVE'
                }
              }
            },
            status: 'PAID',
            month: currentMonth,
            year: currentYear,
          },
          _sum: { amountCLP: true, amountUF: true },
        }),
        prisma.payment.aggregate({
          where: {
            property: { 
              mandates: {
                some: {
                  brokerId: session.user.id,
                  status: 'ACTIVE'
                }
              }
            },
            status: 'PENDING',
            month: currentMonth,
            year: currentYear,
          },
          _sum: { amountCLP: true },
        }),
        prisma.maintenanceRequest.count({
          where: {
            property: { 
              mandates: {
                some: {
                  brokerId: session.user.id,
                  status: 'ACTIVE'
                }
              }
            },
            status: {
              in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
            },
          },
        }),
        prisma.brokerStatement.findMany({
          where: { brokerId: session.user.id },
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
            landlord: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
          take: 5,
        }),
        prisma.brokerMessage.findMany({
          where: { senderId: session.user.id },
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
            tenant: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ])

    const totalRecaudadoCLP = paidPayments._sum.amountCLP || 0
    const pagosPendientesCLP = pendingPayments._sum.amountCLP || 0

    // Count properties by some payment status
    const propertyPaidCount = mandates.filter((m) => m.property.payments[0]?.status === 'PAID').length

    const kpiStats = [
      {
        title: 'Propiedades Administradas',
        value: mandateStats.toString(),
        subValue: `${propertyPaidCount}/${mandateStats} pagadas este mes`,
        change: null,
        icon: Building2,
        color: 'text-[#75524C]',
        bgColor: 'bg-[#75524C]/20',
      },
      {
        title: 'Total Recaudado',
        value: `$${(totalRecaudadoCLP / 1000000).toFixed(1)}M`,
        subValue: formatCLP(totalRecaudadoCLP),
        change: `${propertyPaidCount}/${mandateStats} pagadas`,
        icon: DollarSign,
        color: 'text-[#5E8B8C]',
        bgColor: 'bg-[#5E8B8C]/20',
      },
      {
        title: 'Pagos Pendientes',
        value: `$${(pagosPendientesCLP / 1000000).toFixed(1)}M`,
        subValue: formatCLP(pagosPendientesCLP),
        change: pagosPendientesCLP > 0 ? 'Requiere atención' : 'Sin atrasos',
        icon: AlertTriangle,
        color: 'text-[#C27F79]',
        bgColor: 'bg-[#C27F79]/20',
      },
      {
        title: 'Mantenciones Activas',
        value: activeMaintenances.toString(),
        subValue: activeMaintenances > 0 ? 'En proceso' : 'Sin reportes',
        change: null,
        icon: Wrench,
        color: 'text-[#F2C94C]',
        bgColor: 'bg-[#F2C94C]/20',
      },
    ]

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[#9C8578] text-sm mb-1">{formatDate()}</p>
            <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2]">
              {getGreeting()}, <span className="text-[#D5C3B6]">{session.user.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-[#9C8578] mt-1">
              {mandateStats === 0
                ? 'Solicita administración de propiedades'
                : `Aquí está el resumen de ${mandateStats} propiedad${mandateStats !== 1 ? 'es' : ''} que administras`}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#75524C]/20 p-3">
                  <Receipt className="h-5 w-5 text-[#75524C]" />
                </div>
                <div>
                  <p className="text-sm text-[#9C8578]">Rendiciones</p>
                  <p className="text-lg font-semibold text-[#FAF6F2]">Cierre mensual al propietario</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#9C8578]">
                Genera la rendición, descuenta comisión y mantenciones, y descarga el PDF final.
              </p>
              <Button className="mt-4 w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]" asChild>
                <Link href="/broker/rendiciones">Abrir rendiciones</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#5E8B8C]/20 p-3">
                  <BellRing className="h-5 w-5 text-[#5E8B8C]" />
                </div>
                <div>
                  <p className="text-sm text-[#9C8578]">Avisos</p>
                  <p className="text-lg font-semibold text-[#FAF6F2]">Mensajes al arrendatario</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#9C8578]">
                Envía recordatorios de pago o coordinaciones técnicas con notificación y email.
              </p>
              <Button className="mt-4 w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]" asChild>
                <Link href="/broker/avisos">Abrir avisos</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#B8965A]/20 p-3">
                  <CalendarClock className="h-5 w-5 text-[#B8965A]" />
                </div>
                <div>
                  <p className="text-sm text-[#9C8578]">Operación diaria</p>
                  <p className="text-lg font-semibold text-[#FAF6F2]">Cartera consolidada</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#9C8578]">
                Revisa pagos, mantenciones y contratos por vencer en una sola mirada.
              </p>
              <Button className="mt-4 w-full bg-[#B8965A] hover:bg-[#B8965A]/90 text-[#1C1917]" asChild>
                <Link href="/broker/propiedades">Ver cartera</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div id="kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpiStats.map((stat, index) => (
            <Card
              key={index}
              className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300"
            >
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div
                    className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                  {stat.change && (
                    <TrendingUp className="h-4 w-4 text-[#5E8B8C] shrink-0" />
                  )}
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-[#FAF6F2] truncate money">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-[#9C8578] truncate money">{stat.subValue}</p>
                <p className="text-xs text-[#9C8578] mt-1 sm:mt-2 line-clamp-2">{stat.title}</p>
                {stat.change && (
                  <p className="text-xs text-[#5E8B8C] mt-1 line-clamp-1">{stat.change}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {mandateStats > 0 && (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="text-[#FAF6F2]">Cartera consolidada</CardTitle>
              <p className="text-sm text-[#9C8578]">
                Estado operativo de cada propiedad en una sola pantalla.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-y border-[#D5C3B6]/10 text-left text-[#9C8578]">
                    <tr>
                      <th className="px-6 py-3 font-medium">Propiedad</th>
                      <th className="px-6 py-3 font-medium">Arrendatario</th>
                      <th className="px-6 py-3 font-medium">Pago mes</th>
                      <th className="px-6 py-3 font-medium">Mantenciones</th>
                      <th className="px-6 py-3 font-medium">Contrato</th>
                      <th className="px-6 py-3 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mandates.map((mandate) => {
                      const property = mandate.property
                      const currentPayment = property.payments[0]
                      const paymentStatus = currentPayment?.status || 'PENDING'
                      const statusLabel = statusConfig[paymentStatus]
                      const contractEnd = property.contractEnd ? new Date(property.contractEnd) : null
                      const contractHint =
                        contractEnd
                          ? Math.ceil((contractEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          : null

                      return (
                        <tr key={mandate.id} className="border-b border-[#D5C3B6]/10">
                          <td className="px-6 py-4">
                            <p className="font-medium text-[#FAF6F2]">{property.name || property.address}</p>
                            <p className="text-xs text-[#9C8578]">{property.address}</p>
                          </td>
                          <td className="px-6 py-4 text-[#D5C3B6]">
                            {property.tenant?.name || 'Sin asignar'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={statusLabel?.className || 'bg-gray-600'}>
                              {statusLabel?.label || 'Sin estado'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-[#D5C3B6]">
                            {property._count?.maintenance ?? 0} abiertas
                          </td>
                          <td className="px-6 py-4 text-[#D5C3B6]">
                            {contractHint === null
                              ? 'Sin fecha'
                              : contractHint < 0
                                ? 'Vencido'
                                : contractHint <= 90
                                  ? `Vence en ${contractHint} días`
                                  : 'Vigente'}
                          </td>
                          <td className="px-6 py-4">
                            <Link href={`/broker/propiedades/${property.id}`} className="text-[#5E8B8C] hover:text-[#D5C3B6]">
                              Abrir ficha
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties Grid */}
        {mandateStats > 0 && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-[#FAF6F2]">Rendiciones recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentStatements.length === 0 ? (
                  <p className="text-sm text-[#9C8578]">Todavía no has generado rendiciones.</p>
                ) : (
                  recentStatements.map((statement) => (
                    <div key={statement.id} className="rounded-lg bg-[#1C1917] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#FAF6F2]">
                            {statement.property.name || statement.property.address}
                          </p>
                          <p className="text-xs text-[#9C8578]">
                            {statement.month}/{statement.year} · {statement.landlord.name || statement.landlord.email}
                          </p>
                        </div>
                        <Badge className={statement.status === 'SENT' ? 'bg-[#5E8B8C] text-white' : 'bg-[#B8965A] text-[#1C1917]'}>
                          {statement.status === 'SENT' ? 'Enviada' : 'Borrador'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-[#9C8578]">Neto a transferir</span>
                        <span className="font-semibold text-[#FAF6F2]">
                          ${statement.netTransferCLP.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full border-[#D5C3B6]/10 text-[#FAF6F2]" asChild>
                  <Link href="/broker/rendiciones">Ver todas las rendiciones</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-[#FAF6F2]">Avisos recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMessages.length === 0 ? (
                  <p className="text-sm text-[#9C8578]">Todavía no has enviado avisos a arrendatarios.</p>
                ) : (
                  recentMessages.map((message) => (
                    <div key={message.id} className="rounded-lg bg-[#1C1917] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#FAF6F2]">{message.subject}</p>
                          <p className="text-xs text-[#9C8578]">
                            {message.tenant.name || message.tenant.email} · {message.property.name || message.property.address}
                          </p>
                        </div>
                        <Badge className="bg-[#5E8B8C]/20 text-[#5E8B8C]">
                          {message.sendEmail
                            ? message.emailStatus === 'SENT'
                              ? 'Email + app'
                              : 'App + email fallido'
                            : 'Solo app'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full border-[#D5C3B6]/10 text-[#FAF6F2]" asChild>
                  <Link href="/broker/avisos">Ver historial y enviar avisos</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {mandateStats === 0 && (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-[#5E8B8C]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#FAF6F2] mb-3">
                No tienes mandatos activos aún
              </h3>
              <p className="text-[#9C8578] mb-8 max-w-md mx-auto">
                Busca un propietario por email y solicita un mandato de administración.
              </p>
              <Button 
                className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6] px-8 py-3 text-base font-medium" 
                asChild
              >
                <Link href="/broker/mandatos/nuevo">
                  <Plus className="h-5 w-5 mr-2" />
                  Solicitar mandato
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error('Broker dashboard error:', error)
    return (
      <div className="text-center py-12">
        <p className="text-[#9C8578]">{getErrorMessage(error, "Error al cargar el dashboard")}</p>
      </div>
    )
  }
}
