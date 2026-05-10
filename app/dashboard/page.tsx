import { redirect } from 'next/navigation'
import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PropertyCard } from '@/components/properties/property-card'
import { LocalizedDateGreeting } from '@/components/layout/localized-date-greeting'
import { 
  DollarSign, 
  Building2, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  MapPin, 
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import DashboardLoading from "./loading"

export const dynamic = 'force-dynamic'

const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Pagado', className: 'bg-[#5E8B8C] text-[#FAF6F2]' },
  PENDING: { label: 'Pendiente', className: 'bg-[#C27F79] text-[#FAF6F2]' },
  OVERDUE: { label: 'Atrasado', className: 'bg-red-600 text-[#FAF6F2]' },
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

async function DashboardKPIs({ landlordId }: { landlordId: string }) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [stats, paidPayments, pendingPayments, activeMaintenances] = await Promise.all([
    prisma.property.count({
      where: { landlordId, isActive: true },
    }),
    prisma.payment.aggregate({
      where: {
        property: { landlordId },
        status: 'PAID',
        month: currentMonth,
        year: currentYear,
      },
      _sum: { amountCLP: true, amountUF: true },
    }),
    prisma.payment.aggregate({
      where: {
        property: { landlordId },
        status: 'PENDING',
        month: currentMonth,
        year: currentYear,
      },
      _sum: { amountCLP: true },
    }),
    prisma.maintenanceRequest.count({
      where: {
        property: { landlordId },
        status: {
          in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
        },
      },
    }),
  ])

  const totalRecaudadoCLP = paidPayments._sum.amountCLP || 0
  const pagosPendientesCLP = pendingPayments._sum.amountCLP || 0

  const kpiStats = [
    {
      title: 'Total Recaudado',
      value: `$${(totalRecaudadoCLP / 1000000).toFixed(1)}M`,
      subValue: formatCLP(totalRecaudadoCLP),
      change: null,
      icon: DollarSign,
      color: 'text-[#5E8B8C]',
      bgColor: 'bg-[#5E8B8C]/20',
    },
    {
      title: 'Propiedades Activas',
      value: stats.toString(),
      subValue: `${stats} propiedades`,
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
      urgency: pagosPendientesCLP > 0 ? 'high' : 'none',
      icon: AlertTriangle,
      color: pagosPendientesCLP > 0 ? 'text-[#C27F79]' : 'text-[#5E8B8C]',
      bgColor: pagosPendientesCLP > 0 ? 'bg-[#C27F79]/20' : 'bg-[#5E8B8C]/20',
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
    <div id="kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {kpiStats.map((stat, index) => (
        <Card
          key={index}
          className={cn(
            "bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300",
            stat.urgency === 'high' && "border-[#C27F79]/40 shadow-lg shadow-[#C27F79]/10"
          )}
        >
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div
                className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center shrink-0`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-2">
                {stat.urgency === 'high' && (
                  <Badge className="border-[#C27F79]/30 bg-[#C27F79]/20 text-xs font-semibold text-[#C27F79]">
                    Revisar
                  </Badge>
                )}
                {stat.change && (
                  <TrendingUp className="h-4 w-4 text-[#5E8B8C] flex-shrink-0" />
                )}
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#FAF6F2]">
              {stat.value}
            </p>
            <p className="text-xs text-[#9C8578]">{stat.subValue}</p>
            <p className="text-xs text-[#9C8578] mt-1">{stat.title}</p>
            {stat.change && (
              <p
                className={cn(
                  "text-xs mt-1 line-clamp-1",
                  stat.urgency === 'high' ? 'font-medium text-[#C27F79]' : 'text-[#5E8B8C]'
                )}
              >
                {stat.change}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function DashboardPropertyList({ landlordId }: { landlordId: string }) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [properties, allPaymentsYear, overdueCount, brokerStatements] = await Promise.all([
    prisma.property.findMany({
      where: { landlordId, isActive: true },
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
    prisma.payment.findMany({
      where: {
        property: { landlordId },
        year: currentYear,
        status: 'PAID',
      },
      select: { amountCLP: true, month: true },
    }),
    prisma.payment.count({
      where: {
        property: { landlordId },
        status: 'OVERDUE',
      },
    }),
    prisma.brokerStatement.findMany({
      where: {
        landlordId,
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
  const newStatementsCount = brokerStatements.filter((statement) => {
    const createdAt = new Date(statement.createdAt)
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return ageInDays <= 7
  }).length

  return (
    <>
      <Card className="mt-6 border-[#D5C3B6]/5 bg-[#1C1917]/50 backdrop-blur-sm">
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-[#B8965A]">Métricas del portafolio</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2A2520] p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-[#9C8578]">Ocupación</p>
              <div className="mb-2 flex items-end gap-2">
                <span className="text-2xl font-semibold text-[#FAF6F2]">{occupancyRate}%</span>
                <span className="mb-1 text-sm text-[#9C8578]">de propiedades</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#1C1917]">
                <div
                  className="h-full rounded-full bg-[#5E8B8C] transition-all duration-500"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#9C8578]">
                {rentedProperties.length} de {properties.length} arrendadas
              </p>
            </div>

            <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2A2520] p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-[#9C8578]">Cobro del mes</p>
              <div className="mb-2 flex items-end gap-2">
                <span
                  className={cn(
                    "text-2xl font-semibold",
                    collectionRate >= 80
                      ? 'text-[#5E8B8C]'
                      : collectionRate >= 50
                        ? 'text-[#F2C94C]'
                        : 'text-[#C27F79]'
                  )}
                >
                  {collectionRate}%
                </span>
                <span className="mb-1 text-sm text-[#9C8578]">pagado</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#1C1917]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    collectionRate >= 80
                      ? 'bg-[#5E8B8C]'
                      : collectionRate >= 50
                        ? 'bg-[#F2C94C]'
                        : 'bg-[#C27F79]'
                  )}
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              {overdueCount > 0 && (
                <p className="mt-2 text-xs font-medium text-[#C27F79]">
                  {overdueCount} pago{overdueCount > 1 ? 's' : ''} atrasado{overdueCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2A2520] p-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-[#9C8578]">
                Cobrado en {currentYear}
              </p>
              <p className="mb-1 text-2xl font-semibold text-[#FAF6F2]">{formatCLP(totalCollectedYear)}</p>
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
                      className={cn(
                        "h-1.5 flex-1 rounded-full",
                        hasPayment ? 'bg-[#B8965A]' : 'bg-[#1C1917]'
                      )}
                      title={`${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}: ${hasPayment ? 'cobrado' : 'sin cobro'}`}
                    />
                  )
                })}
              </div>
              <p className="mt-1 text-xs text-[#9C8578]">Meses con cobro en {currentYear}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid - Separating Broker-Managed from Owner-Managed */}
      {properties.length > 0 && (
        <div className="space-y-6">
          {brokerStatements.length > 0 && (
            <Card id="rendiciones-recibidas" className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A]">
                    Rendiciones recibidas de corredores
                  </p>
                  {newStatementsCount > 0 && (
                    <Badge className="bg-[#B8965A]/20 text-[#B8965A]">
                      {newStatementsCount} nueva{newStatementsCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {brokerStatements.map((statement) => {
                    const createdAt = new Date(statement.createdAt)
                    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
                    const isNew = ageInDays <= 7

                    return (
                      <div
                        key={statement.id}
                        className={cn(
                          "flex flex-col gap-3 rounded-lg border p-4 transition-all md:flex-row md:items-center md:justify-between",
                          isNew
                            ? "border-[#B8965A]/30 bg-[#B8965A]/10"
                            : "border-[#D5C3B6]/10 bg-[#1C1917]"
                        )}
                      >
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <p className="font-medium text-[#FAF6F2]">
                              {statement.property.name || statement.property.address}
                            </p>
                            {isNew && (
                              <Badge className="bg-[#B8965A] text-xs font-bold text-[#1C1917]">
                                NUEVO
                              </Badge>
                            )}
                          </div>
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
                            className="inline-flex items-center gap-2 rounded-md bg-[#B8965A]/20 px-3 py-1.5 text-xs font-medium text-[#B8965A] transition-colors hover:bg-[#B8965A]/30"
                          >
                            Ver PDF
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Broker-Managed Properties */}
          {properties.some((p) => p.mandates.length > 0) && (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">
                  Propiedades administradas por corredor
                </p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {properties
                    .filter((p) => p.mandates.length > 0)
                    .map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        statusConfig={statusConfig}
                        isManagedByBroker
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owner-Managed Properties */}
          {properties.some((p) => p.mandates.length === 0) && (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">
                  Propiedades que gestionas
                </p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {properties
                    .filter((p) => p.mandates.length === 0)
                    .map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        statusConfig={statusConfig}
                        isManagedByBroker={false}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {properties.length === 0 && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-10 text-center">
            <Building2 className="h-10 w-10 text-[#9C8578] mx-auto mb-4 opacity-50" />
            <p className="text-[#9C8578] text-base mb-4">
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
    </>
  )
}

async function DashboardContent({ session }: { session: any }) {
  try {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <LocalizedDateGreeting
            name={session.user.name}
            subtitle="Aquí está el resumen de tus propiedades"
            dateClassName="text-[#9C8578] text-sm mb-1"
            headingClassName="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2]"
            subtitleClassName="text-[#9C8578] mt-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/mapa">
              <Button className="bg-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/30">
                <MapPin className="mr-2 h-4 w-4" />
                Mapa
              </Button>
            </Link>
            <Link href="/dashboard/pagos">
              <Button className="bg-[#5E8B8C]/20 text-[#5E8B8C] hover:bg-[#5E8B8C]/30">
                <CreditCard className="mr-2 h-4 w-4" />
                Pagos
              </Button>
            </Link>
            <Link href="/dashboard/propiedades" id="btn-nueva-propiedad">
              <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] shadow-lg shadow-[#75524C]/20 transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Propiedad
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs - Suspense boundary */}
        <Suspense fallback={
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-[#2A2520] animate-pulse" />
            ))}
          </div>
        }>
          <DashboardKPIs landlordId={session.user.id} />
        </Suspense>

        {/* Property List - Suspense boundary */}
        <Suspense fallback={
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-[#2A2520] animate-pulse" />
            ))}
          </div>
        }>
          <DashboardPropertyList landlordId={session.user.id} />
        </Suspense>
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
