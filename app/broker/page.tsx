import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Building2, Wrench, AlertTriangle, TrendingUp, Plus, MapPin, Eye, FileText } from 'lucide-react'
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
    const [mandates, mandateStats, paidPayments, pendingPayments, activeMaintenances] =
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

        {/* Properties Grid */}
        {mandateStats > 0 && (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-[#FAF6F2] mb-4">Propiedades que Administras</h2>
              <div className="space-y-3">
                {mandates.slice(0, 5).map((mandate) => {
                  const currentPayment = mandate.property.payments[0]
                  const paymentStatus = currentPayment?.status || 'PENDING'
                  const statusLabel = statusConfig[paymentStatus]

                  return (
                    <Link
                      key={mandate.id}
                      href={`/broker/propiedades/${mandate.property.id}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#1C1917] hover:bg-[#1C1917]/80 transition-colors"
                    >
                      <div>
                        <p className="text-[#FAF6F2] font-medium">{mandate.property.address}</p>
                        <div className="flex items-center gap-2 text-sm text-[#9C8578]">
                          <MapPin className="h-4 w-4" />
                          {mandate.property.commune}
                        </div>
                        {mandate.property.landlord && (
                          <p className="text-xs text-[#9C8578] mt-1">
                            Propietario: {mandate.property.landlord.name}
                          </p>
                        )}
                        {mandate.property.tenant && (
                          <p className="text-xs text-[#9C8578]">
                            Arrendatario: {mandate.property.tenant.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={statusLabel?.className || 'bg-gray-600'}>
                          {statusLabel?.label || 'Sin estado'}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
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
