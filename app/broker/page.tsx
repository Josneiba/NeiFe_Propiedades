import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, DollarSign, Wrench, AlertTriangle, Plus, Eye, FileText, BellRing, Receipt } from 'lucide-react'
import { getErrorMessage } from '@/lib/error-handler'
import { paymentStatus } from '@/lib/broker-design'
import Link from 'next/link'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

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

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return null
  const positive = pct > 0

  return (
    <span className={positive ? "text-[10px] font-semibold text-[#5E8B8C]" : "text-[10px] font-semibold text-[#C27F79]"}>
      {positive ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  )
}

async function BrokerKPIs({ brokerId }: { brokerId: string }) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

  const [mandateStats, paidPayments, pendingPayments, activeMaintenances, prevPaidPayments] = await Promise.all([
    prisma.mandate.count({
      where: { brokerId, status: 'ACTIVE' },
    }),
    prisma.payment.aggregate({
      where: {
        property: {
          mandates: {
            some: {
              brokerId,
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
              brokerId,
              status: 'ACTIVE'
            }
          }
        },
        status: 'PENDING',
        month: currentMonth,
        year: currentYear,
      },
      _count: true,
      _sum: { amountCLP: true },
    }),
    prisma.maintenanceRequest.count({
      where: {
        property: {
          mandates: {
            some: {
              brokerId,
              status: 'ACTIVE'
            }
          }
        },
        status: {
          in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        property: {
          mandates: {
            some: {
              brokerId,
              status: 'ACTIVE'
            }
          }
        },
        status: 'PAID',
        month: prevMonth,
        year: prevYear,
      },
      _sum: { amountCLP: true },
    }),
  ])

  const totalRecaudadoCLP = paidPayments._sum.amountCLP || 0
  const pagosPendientesCLP = pendingPayments._sum.amountCLP || 0
  const prevTotalRecaudadoCLP = prevPaidPayments._sum.amountCLP || 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        {
          label: 'Propiedades',
          value: mandateStats,
          sub: `${mandateStats} administradas`,
          accent: '#5E8B8C',
          icon: Building2,
        },
        {
          label: 'Recaudado este mes',
          value: totalRecaudadoCLP >= 1_000_000
            ? `$${(totalRecaudadoCLP / 1_000_000).toFixed(1)}M`
            : `$${(totalRecaudadoCLP / 1_000).toFixed(0)}K`,
          sub: formatCLP(totalRecaudadoCLP),
          accent: '#B8965A',
          icon: DollarSign,
        },
        {
          label: 'Por cobrar',
          value: pagosPendientesCLP > 0
            ? `$${(pagosPendientesCLP / 1_000).toFixed(0)}K`
            : '$0',
          sub: pagosPendientesCLP > 0 ? 'Requiere atención' : 'Al día',
          accent: pagosPendientesCLP > 0 ? '#C27F79' : '#5E8B8C',
          icon: AlertTriangle,
        },
        {
          label: 'Mantenciones',
          value: activeMaintenances,
          sub: activeMaintenances > 0 ? 'requieren acción' : 'todo en orden',
          accent: activeMaintenances > 0 ? '#F2C94C' : '#5E8B8C',
          icon: Wrench,
        },
      ].map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-2xl border p-4"
          style={{ borderColor: `${kpi.accent}30`, backgroundColor: `${kpi.accent}08` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9C8578]">{kpi.label}</p>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${kpi.accent}20` }}
            >
              <kpi.icon className="h-3.5 w-3.5" style={{ color: kpi.accent }} />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums text-[#FAF6F2]">{kpi.value}</p>
          {kpi.label === 'Recaudado este mes' ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-xs text-[#9C8578]">{kpi.sub}</p>
              <Trend current={totalRecaudadoCLP} previous={prevTotalRecaudadoCLP} />
            </div>
          ) : (
            <p className="mt-1 text-xs text-[#9C8578]">{kpi.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}

async function BrokerPropertyList({ brokerId }: { brokerId: string }) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const contractsCutoff = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

  const [mandates, recentStatements, overduePayments, expiringContracts] = await Promise.all([
    prisma.mandate.findMany({
      where: {
        brokerId,
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
    prisma.brokerStatement.findMany({
      where: { brokerId },
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
    prisma.payment.findMany({
      where: {
        property: {
          mandates: { some: { brokerId, status: 'ACTIVE' } }
        },
        status: 'OVERDUE',
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.property.findMany({
      where: {
        mandates: { some: { brokerId, status: 'ACTIVE' } },
        contractEnd: {
          gte: new Date(),
          lte: contractsCutoff,
        },
      },
      select: {
        id: true,
        name: true,
        address: true,
        contractEnd: true,
      },
      take: 3,
      orderBy: { contractEnd: 'asc' },
    }),
  ])

  const mandateStats = mandates.length
  return (
    <>
      {mandateStats > 0 && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-[#FAF6F2]">Cartera consolidada</CardTitle>
                <p className="text-sm text-[#9C8578] mt-0.5">
                  Estado operativo de cada propiedad.
                </p>
              </div>
              <Badge className="bg-[#5E8B8C]/20 text-[#5E8B8C] text-sm font-semibold px-3 py-1 border border-[#5E8B8C]/30">
                {mandates.length} propiedades
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto [scrollbar-color:rgba(213,195,182,0.2)_transparent] [scrollbar-width:thin]">
              <table className="min-w-full text-sm">
                <thead className="border-y border-[#D5C3B6]/10 text-left text-[#9C8578]">
                  <tr>
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wide">Propiedad</th>
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wide">Arrendatario</th>
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wide">Pago mes</th>
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wide">Estado</th>
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {mandates.map((mandate) => {
                    const property = mandate.property
                    const currentPayment = property.payments[0]
                    const pStatus =
                      paymentStatus[currentPayment?.status as keyof typeof paymentStatus] ??
                      paymentStatus.PENDING
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
                          <Badge className={pStatus.badge}>{pStatus.label}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-[#D5C3B6]">
                              {contractHint === null
                                ? 'Sin fecha'
                                : contractHint < 0
                                  ? <span className="text-[#C27F79]">Contrato vencido</span>
                                  : contractHint <= 90
                                    ? <span className="text-[#F2C94C]">Vence en {contractHint}d</span>
                                    : 'Contrato vigente'}
                            </span>
                            {(property._count?.maintenance ?? 0) > 0 && (
                              <span className="text-[10px] text-[#F2C94C]">
                                ⚠ {property._count.maintenance} mantención{property._count.maintenance > 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/broker/propiedades/${property.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#5E8B8C]/10 hover:bg-[#5E8B8C]/20 px-3 py-1.5 text-xs font-medium text-[#5E8B8C] transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
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

      {mandateStats > 0 && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="text-[#FAF6F2]">Rendiciones recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentStatements.length === 0 ? (
                <div className="rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917] p-5 text-center">
                  <p className="text-sm font-medium text-[#FAF6F2]">Todavía no has generado rendiciones.</p>
                  <p className="mt-2 text-sm text-[#9C8578]">
                    Crea tu primera rendición para compartir al propietario el cierre mensual.
                  </p>
                  <Button className="mt-4 bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]" asChild>
                    <Link href="/broker/rendiciones">Crear tu primera rendición</Link>
                  </Button>
                </div>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#FAF6F2]">Alertas del día</CardTitle>
                {(overduePayments.length + expiringContracts.length) > 0 && (
                  <Badge className="bg-[#C27F79]/20 text-[#C27F79] border border-[#C27F79]/30">
                    {overduePayments.length + expiringContracts.length} pendientes
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {overduePayments.length === 0 && expiringContracts.length === 0 ? (
                <div className="rounded-lg bg-[#1C1917] p-5 text-center">
                  <p className="text-sm font-medium text-[#5E8B8C]">✓ Todo en orden</p>
                  <p className="mt-1 text-xs text-[#9C8578]">No hay alertas urgentes hoy.</p>
                </div>
              ) : (
                <>
                  {overduePayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg bg-[#C27F79]/10 border border-[#C27F79]/20 px-4 py-3 gap-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-[#FAF6F2]">
                          Pago vencido — {payment.property.name || payment.property.address}
                        </p>
                      </div>
                      <Link href="/broker/pagos" className="text-[10px] font-semibold text-[#C27F79] hover:underline">
                        Gestionar
                      </Link>
                    </div>
                  ))}
                  {expiringContracts.map((property) => {
                    const days = Math.ceil(
                      (new Date(property.contractEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <div
                        key={property.id}
                        className="flex items-center justify-between rounded-lg bg-[#F2C94C]/10 border border-[#F2C94C]/20 px-4 py-3 gap-3"
                      >
                        <div>
                          <p className="text-xs font-medium text-[#FAF6F2]">
                            Contrato vence en {days} días
                          </p>
                          <p className="text-[10px] text-[#9C8578]">
                            {property.name || property.address}
                          </p>
                        </div>
                        <Link href="/broker/contratos" className="text-[10px] font-semibold text-[#F2C94C] hover:underline">
                          Revisar
                        </Link>
                      </div>
                    )
                  })}
                </>
              )}
              <Button variant="outline" className="w-full border-[#D5C3B6]/10 text-[#9C8578] hover:text-[#FAF6F2] text-xs mt-2" asChild>
                <Link href="/broker/avisos">Ver historial de avisos</Link>
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
              Vincula primero al propietario y luego solicita el mandato por propiedad para empezar a administrar su cartera.
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
    </>
  )
}

export default async function BrokerDashboardPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'BROKER' && session.user.role !== 'OWNER')) {
    redirect('/login')
  }

  try {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs text-[#9C8578] capitalize">{formatDate()}</p>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#FAF6F2]">
              {getGreeting()},{' '}
              <span className="text-[#D5C3B6]">{session.user.name?.split(' ')[0]}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/broker/avisos"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#9C8578] hover:text-[#D5C3B6] hover:bg-[#D5C3B6]/5 transition-colors"
            >
              <BellRing className="h-3.5 w-3.5" />
              Avisos
            </Link>
            <Link
              href="/broker/rendiciones"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#9C8578] hover:text-[#D5C3B6] hover:bg-[#D5C3B6]/5 transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              Rendiciones
            </Link>
            <Link
              href="/broker/mandatos/nuevo"
              className="flex items-center gap-1.5 rounded-xl bg-[#75524C] hover:bg-[#75524C]/90 px-4 py-2 text-sm font-semibold text-[#FAF6F2] transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nuevo mandato
            </Link>
          </div>
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-[#2A2520] animate-pulse" />
            ))}
          </div>
        }>
          <BrokerKPIs brokerId={session.user.id} />
        </Suspense>

        <Suspense fallback={
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#2A2520] animate-pulse" />
            ))}
          </div>
        }>
          <BrokerPropertyList brokerId={session.user.id} />
        </Suspense>
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
