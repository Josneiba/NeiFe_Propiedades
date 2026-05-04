import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, DollarSign, Wrench, AlertTriangle, Plus, MapPin, Eye, FileText, BellRing, Receipt } from 'lucide-react'
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

async function BrokerKPIs({ brokerId }: { brokerId: string }) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [mandateStats, propertyPaidCount, paidPayments, pendingPayments, activeMaintenances] = await Promise.all([
    prisma.mandate.count({
      where: { brokerId, status: 'ACTIVE' },
    }),
    prisma.payment.count({
      where: {
        property: {
          mandates: {
            some: {
              brokerId,
              status: 'ACTIVE',
            },
          },
        },
        status: 'PAID',
        month: currentMonth,
        year: currentYear,
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
  ])

  const totalRecaudadoCLP = paidPayments._sum.amountCLP || 0
  const pagosPendientesCLP = pendingPayments._sum.amountCLP || 0

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
          <p className="mt-1 text-xs text-[#9C8578]">{kpi.sub}</p>
        </div>
      ))}
    </div>
  )
}

async function BrokerPropertyList({ brokerId }: { brokerId: string }) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [mandates, recentStatements, recentMessages] = await Promise.all([
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
    prisma.brokerMessage.findMany({
      where: { senderId: brokerId },
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

  const mandateStats = mandates.length
  return (
    <>
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
              <CardTitle className="text-[#FAF6F2]">Avisos recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMessages.length === 0 ? (
                <div className="rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917] p-5 text-center">
                  <p className="text-sm font-medium text-[#FAF6F2]">Todavía no has enviado avisos a arrendatarios.</p>
                  <p className="mt-2 text-sm text-[#9C8578]">
                    Usa esta sección para mandar recordatorios de pago o coordinaciones operativas.
                  </p>
                  <Button className="mt-4 bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]" asChild>
                    <Link href="/broker/avisos">Enviar tu primer aviso</Link>
                  </Button>
                </div>
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
              className="flex items-center gap-1.5 rounded-lg border border-[#5E8B8C]/30 bg-[#5E8B8C]/10 px-3 py-1.5 text-xs font-medium text-[#5E8B8C] hover:bg-[#5E8B8C]/20 transition-colors"
            >
              <BellRing className="h-3.5 w-3.5" />
              Avisos
            </Link>
            <Link
              href="/broker/rendiciones"
              className="flex items-center gap-1.5 rounded-lg border border-[#B8965A]/30 bg-[#B8965A]/10 px-3 py-1.5 text-xs font-medium text-[#B8965A] hover:bg-[#B8965A]/20 transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              Rendiciones
            </Link>
            <Link
              href="/broker/mandatos/nuevo"
              className="flex items-center gap-1.5 rounded-lg bg-[#75524C] hover:bg-[#75524C]/90 px-3 py-1.5 text-xs font-medium text-[#FAF6F2] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
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
