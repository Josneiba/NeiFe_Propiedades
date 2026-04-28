import { redirect } from 'next/navigation'
import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Building2, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  MapPin, 
  Eye,
  Home 
} from 'lucide-react'
import Link from 'next/link'
import DashboardLoading from "./loading"

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

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user || session.user.role === 'TENANT') {
    redirect('/login')
  }

  if (session.user.role === 'BROKER') {
    redirect('/broker')
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent session={session} />
    </Suspense>
  )
}

async function DashboardContent({ session }: { session: any }) {
  try {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const [
      properties,
      stats,
      paidPayments,
      pendingPayments,
      activeMaintenances,
      allPaymentsYear,
      overdueCount,
      brokerStatements,
    ] =
      await Promise.all([
        prisma.property.findMany({
          where: { landlordId: session.user.id, isActive: true },
          include: {
            tenant: {
              select: { id: true, name: true, email: true, phone: true },
            },
            payments: {
              where: {
                month: currentMonth,
                year: currentYear,
              },
              take: 1,
            },
            mandates: {
              where: { status: 'ACTIVE' },
              include: {
                broker: { select: { name: true, email: true } },
              },
              take: 1,
            },
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
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.property.count({
          where: { landlordId: session.user.id, isActive: true },
        }),
        prisma.payment.aggregate({
          where: {
            property: { landlordId: session.user.id },
            status: 'PAID',
            month: currentMonth,
            year: currentYear,
          },
          _sum: { amountCLP: true, amountUF: true },
        }),
        prisma.payment.aggregate({
          where: {
            property: { landlordId: session.user.id },
            status: 'PENDING',
            month: currentMonth,
            year: currentYear,
          },
          _sum: { amountCLP: true },
        }),
        prisma.maintenanceRequest.count({
          where: {
            property: { landlordId: session.user.id },
            status: {
              in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
            },
          },
        }),
        prisma.payment.findMany({
          where: {
            property: { landlordId: session.user.id },
            year: currentYear,
            status: 'PAID',
          },
          select: { amountCLP: true, month: true },
        }),
        prisma.payment.count({
          where: {
            property: { landlordId: session.user.id },
            status: 'OVERDUE',
          },
        }),
        prisma.brokerStatement.findMany({
          where: {
            landlordId: session.user.id,
            status: 'SENT',
          },
          include: {
            broker: {
              select: {
                name: true,
                email: true,
              },
            },
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
          orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
          take: 4,
        }),
      ])

    const totalRecaudadoCLP = paidPayments._sum.amountCLP || 0
    const pagosPendientesCLP = pendingPayments._sum.amountCLP || 0
    const rentedProperties = properties.filter((p) => p.tenant)
    const totalCollectedYear = allPaymentsYear.reduce((sum, payment) => sum + payment.amountCLP, 0)
    const occupancyRate =
      properties.length > 0
        ? Math.round((rentedProperties.length / properties.length) * 100)
        : 0
    const collectionRate =
      rentedProperties.length > 0
        ? Math.round(
            (properties.filter((p) => p.payments[0]?.status === 'PAID').length / rentedProperties.length) * 100
          ) || 0
        : 0
    const kpiStats = [
      {
        title: 'Total Recaudado',
        value: `$${(totalRecaudadoCLP / 1000000).toFixed(1)}M`,
        subValue: formatCLP(totalRecaudadoCLP),
        change: `${properties.filter((p) => p.payments[0]?.status === 'PAID').length}/${properties.length} pagadas`,
        icon: DollarSign,
        color: 'text-[#5E8B8C]',
        bgColor: 'bg-[#5E8B8C]/20',
      },
      {
        title: 'Propiedades Activas',
        value: stats.toString(),
        subValue: `${properties.filter((p) => p.tenant).length} arrendadas`,
        change: null,
        icon: Building2,
        color: 'text-[#75524C]',
        bgColor: 'bg-[#75524C]/20',
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
              {properties.length === 0
                ? 'Agrega tu primera propiedad'
                : `Aquí está el resumen de tus ${properties.length} propiedad${properties.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <Link href="/dashboard/propiedades" id="btn-nueva-propiedad">
            <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] shadow-lg shadow-[#75524C]/20 transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              Agregar propiedad
            </Button>
          </Link>
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
                    className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                  {stat.change && (
                    <TrendingUp className="h-4 w-4 text-[#5E8B8C] flex-shrink-0" />
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

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#2A2520] border border-[#D5C3B6]/10 rounded-xl p-4">
            <p className="text-xs text-[#9C8578] uppercase tracking-wider mb-2">Ocupacion</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-[#FAF6F2]">{occupancyRate}%</span>
              <span className="text-sm text-[#9C8578] mb-1">de propiedades</span>
            </div>
            <div className="h-2 bg-[#1C1917] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5E8B8C] rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <p className="text-xs text-[#9C8578] mt-2">
              {rentedProperties.length} de {properties.length} arrendadas
            </p>
          </div>

          <div className="bg-[#2A2520] border border-[#D5C3B6]/10 rounded-xl p-4">
            <p className="text-xs text-[#9C8578] uppercase tracking-wider mb-2">Cobro del mes</p>
            <div className="flex items-end gap-2 mb-2">
              <span
                className={`text-3xl font-bold ${
                  collectionRate >= 80
                    ? 'text-[#5E8B8C]'
                    : collectionRate >= 50
                      ? 'text-[#F2C94C]'
                      : 'text-[#C27F79]'
                }`}
              >
                {collectionRate}%
              </span>
              <span className="text-sm text-[#9C8578] mb-1">pagado</span>
            </div>
            <div className="h-2 bg-[#1C1917] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  collectionRate >= 80
                    ? 'bg-[#5E8B8C]'
                    : collectionRate >= 50
                      ? 'bg-[#F2C94C]'
                      : 'bg-[#C27F79]'
                }`}
                style={{ width: `${collectionRate}%` }}
              />
            </div>
            {overdueCount > 0 && (
              <p className="text-xs text-[#C27F79] mt-2">
                {overdueCount} pago{overdueCount > 1 ? 's' : ''} atrasado{overdueCount > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="bg-[#2A2520] border border-[#D5C3B6]/10 rounded-xl p-4">
            <p className="text-xs text-[#9C8578] uppercase tracking-wider mb-2">Cobrado en {currentYear}</p>
            <p className="text-2xl font-bold text-[#FAF6F2] mb-1">{formatCLP(totalCollectedYear)}</p>
            <p className="text-xs text-[#9C8578]">
              {allPaymentsYear.length} pago{allPaymentsYear.length !== 1 ? 's' : ''} registrado
              {allPaymentsYear.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 12 }, (_, i) => {
                const hasPayment = allPaymentsYear.some((payment) => payment.month === i + 1)
                return (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full ${hasPayment ? 'bg-[#B8965A]' : 'bg-[#1C1917]'}`}
                    title={`${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}: ${hasPayment ? 'cobrado' : 'sin cobro'}`}
                  />
                )
              })}
            </div>
            <p className="text-xs text-[#9C8578] mt-1">Meses con cobro en {currentYear}</p>
          </div>
        </div>

        {/* Properties Grid - Separating Broker-Managed from Owner-Managed */}
        {properties.length > 0 && (
          <div className="space-y-6">
            {brokerStatements.length > 0 && (
              <Card id="rendiciones-recibidas" className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-[#5E8B8C] mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Rendiciones recibidas de corredores
                  </h2>
                  <div className="space-y-3">
                    {brokerStatements.map((statement) => (
                      <div
                        key={statement.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg bg-[#1C1917] p-4"
                      >
                        <div>
                          <p className="text-[#FAF6F2] font-medium">
                            {statement.property.name || statement.property.address}
                          </p>
                          <p className="text-xs text-[#9C8578]">
                            {statement.month}/{statement.year} · {statement.broker.name || statement.broker.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-[#9C8578]">Neto a transferir</p>
                            <p className="font-semibold text-[#FAF6F2]">
                              ${statement.netTransferCLP.toLocaleString('es-CL')}
                            </p>
                          </div>
                          <a
                            href={`/api/broker/statements/${statement.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-[#D5C3B6]/10 px-3 py-2 text-sm text-[#FAF6F2] hover:bg-[#2D3C3C]"
                          >
                            Ver PDF
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Broker-Managed Properties */}
            {properties.some((p) => p.mandates.length > 0) && (
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-[#5E8B8C] mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Propiedades Administradas por Corredor
                  </h2>
                  <div className="space-y-3">
                    {properties
                      .filter((p) => p.mandates.length > 0)
                      .map((property) => {
                        const currentPayment = property.payments[0]
                        const paymentStatus = currentPayment?.status || 'PENDING'
                        const statusLabel = statusConfig[paymentStatus]
                        const broker = property.mandates[0]?.broker

                        return (
                          <Link
                            key={property.id}
                            href={`/dashboard/propiedades/${property.id}`}
                            className="flex items-center justify-between p-4 rounded-lg bg-[#1C1917] hover:bg-[#1C1917]/80 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[#FAF6F2] font-medium">{property.address}</p>
                                <Badge className="bg-[#5E8B8C] text-[#FAF6F2] text-xs">
                                  Administrada por {broker?.name || 'Corredor'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#9C8578]">
                                <MapPin className="h-4 w-4" />
                                {property.commune}
                              </div>
                              {property.tenant && (
                                <p className="text-xs text-[#9C8578] mt-1">
                                  Arrendatario: {property.tenant.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge className={statusLabel?.className || 'bg-gray-600'}>
                                {statusLabel?.label || 'Sin estado'}
                              </Badge>
                              <p className="text-xs text-[#9C8578] mt-2">
                                Mantenciones: {property._count.maintenance}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner-Managed Properties */}
            {properties.some((p) => p.mandates.length === 0) && (
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-[#FAF6F2] mb-4">Propiedades que Gestionas</h2>
                  <div className="space-y-3">
                    {properties
                      .filter((p) => p.mandates.length === 0)
                      .map((property) => {
                        const currentPayment = property.payments[0]
                        const paymentStatus = currentPayment?.status || 'PENDING'
                        const statusLabel = statusConfig[paymentStatus]

                        return (
                          <Link
                            key={property.id}
                            href={`/dashboard/propiedades/${property.id}`}
                            className="flex items-center justify-between p-4 rounded-lg bg-[#1C1917] hover:bg-[#1C1917]/80 transition-colors"
                          >
                            <div>
                              <p className="text-[#FAF6F2] font-medium">{property.address}</p>
                              <div className="flex items-center gap-2 text-sm text-[#9C8578]">
                                <MapPin className="h-4 w-4" />
                                {property.commune}
                              </div>
                              {property.tenant && (
                                <p className="text-xs text-[#9C8578] mt-1">
                                  Arrendatario: {property.tenant.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge className={statusLabel?.className || 'bg-gray-600'}>
                                {statusLabel?.label || 'Sin estado'}
                              </Badge>
                              <p className="text-xs text-[#9C8578] mt-2">
                                Mantenciones: {property._count.maintenance}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {properties.length === 0 && (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-[#9C8578] mx-auto mb-4 opacity-50" />
              <p className="text-[#9C8578] text-lg mb-4">
                No tienes propiedades registradas aún
              </p>
              <Link href="/dashboard/propiedades">
                <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                  Agregar Primera Propiedad
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div className="text-center py-12">
        <p className="text-[#9C8578]">Error al cargar el dashboard</p>
      </div>
    )
  }
}
