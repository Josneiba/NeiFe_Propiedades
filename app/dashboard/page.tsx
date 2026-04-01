import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  Building2, 
  Wrench, 
  AlertTriangle,
  Eye,
  Plus,
  MapPin,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ContractProgressChart } from "@/components/charts/contract-progress"

const statusConfig = {
  PAID: { label: "Pagado", className: "bg-[#5E8B8C] text-[#FAF6F2]" },
  PENDING: { label: "Pendiente", className: "bg-[#C27F79] text-[#FAF6F2]" },
  OVERDUE: { label: "Atrasado", className: "bg-red-600 text-[#FAF6F2]" },
  PROCESSING: { label: "Procesando", className: "bg-[#F2C94C] text-[#FAF6F2]" }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 18) return "Buenas tardes"
  return "Buenas noches"
}

function formatDate() {
  return new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Fetch real data
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [properties, stats, paymentHistory, maintenanceStats] = await Promise.all([
    prisma.property.findMany({
      where: { landlordId: session.user.id, isActive: true },
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        payments: {
          where: { month: currentMonth, year: currentYear },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.payment.groupBy({
      by: ['status'],
      where: { property: { landlordId: session.user.id }, month: currentMonth, year: currentYear },
      _sum: { amountCLP: true, amountUF: true }
    }),
    prisma.payment.findMany({
      where: { property: { landlordId: session.user.id } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { property: { select: { name: true } } }
    }),
    prisma.maintenanceRequest.count({
      where: { property: { landlordId: session.user.id }, status: { in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'] } }
    })
  ])

  // Calculate KPIs
  const paidThisMonth = stats.find(s => s.status === 'PAID')?._sum.amountCLP || 0
  const pendingThisMonth = stats.find(s => s.status === 'PENDING')?._sum.amountCLP || 0
  const totalRent = properties.reduce((sum, p) => sum + (p.monthlyRentCLP || 0), 0)

  const statsCards = [
    {
      title: "Total Recaudado",
      value: `UF ${((paidThisMonth || 0) / 36000).toFixed(1)}`,
      subValue: `$${(paidThisMonth || 0).toLocaleString('es-CL')}`,
      change: `Mes ${new Date().getMonth() + 1}`,
      icon: DollarSign,
      color: "text-[#5E8B8C]",
      bgColor: "bg-[#5E8B8C]/20"
    },
    {
      title: "Propiedades Activas",
      value: properties.length.toString(),
      subValue: `${properties.filter(p => p.payments[0]?.status === 'PAID').length} pagadas`,
      change: null,
      icon: Building2,
      color: "text-[#75524C]",
      bgColor: "bg-[#75524C]/20"
    },
    {
      title: "Pagos Pendientes",
      value: `UF ${((pendingThisMonth || 0) / 36000).toFixed(1)}`,
      subValue: `$${(pendingThisMonth || 0).toLocaleString('es-CL')}`,
      change: `${pendingThisMonth > 0 ? 'Hay pendientes' : 'Sin pendientes'}`,
      icon: AlertTriangle,
      color: "text-[#C27F79]",
      bgColor: "bg-[#C27F79]/20"
    },
    {
      title: "Mantenciones Activas",
      value: maintenanceStats.toString(),
      subValue: "En proceso",
      change: null,
      icon: Wrench,
      color: "text-[#F2C94C]",
      bgColor: "bg-[#F2C94C]/20"
    }
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
          <p className="text-[#9C8578] mt-1">Aquí está el resumen de tus propiedades</p>
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
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-serif font-semibold text-[#FAF6F2] truncate">{stat.value}</p>
              <p className="text-xs sm:text-sm font-mono text-[#9C8578] truncate">{stat.subValue}</p>
              <p className="text-xs text-[#9C8578] mt-1 sm:mt-2 line-clamp-2">{stat.title}</p>
              {stat.change && (
                <p className="text-xs text-[#5E8B8C] mt-1 line-clamp-1">{stat.change}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif font-semibold text-[#FAF6F2]">Propiedades</h2>
            <p className="text-sm text-[#9C8578]">{properties.length} propiedades activas</p>
          </div>
          <Link href="/dashboard/propiedades" className="text-sm text-[#5E8B8C] hover:text-[#5E8B8C]/80 transition-colors">
            Ver todas
          </Link>
        </div>
        {properties.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-[#9C8578]/50 mx-auto mb-3" />
              <p className="text-[#9C8578]">No tienes propiedades registradas aún</p>
              <Link href="/dashboard/propiedades">
                <Button className="mt-4 bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar tu primera propiedad
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {properties.map((property) => {
              const currentPayment = property.payments[0]
              const paymentLabel = currentPayment?.status || 'PENDING'
              const status = statusConfig[paymentLabel as keyof typeof statusConfig] || statusConfig.PENDING
              
              return (
                <Card key={property.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10 overflow-hidden hover:border-[#B8965A]/30 transition-all duration-300 group">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-36 h-full bg-gradient-to-br from-[#1C1917] to-[#2D3C3C] flex items-center justify-center flex-shrink-0 relative">
                        <Building2 className="h-10 w-10 text-[#D5C3B6]/30" />
                        <div className="absolute top-2 left-2">
                          <Badge className={status.className + " text-xs"}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1 p-5">
                        <div className="mb-3">
                          <h3 className="font-semibold text-[#FAF6F2] mb-1 line-clamp-2">
                            {property.address}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-[#9C8578]">
                            <span>{property.commune}</span>
                            <span className="text-[#D5C3B6]/30">|</span>
                            <span className="line-clamp-1">{property.tenant?.name || 'Sin inquilino'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2 mb-4">
                          <p className="text-xl font-serif font-semibold text-[#FAF6F2]">
                            UF {property.monthlyRentUF}
                          </p>
                          <p className="text-sm font-mono text-[#9C8578]">
                            / ${property.monthlyRentCLP?.toLocaleString("es-CL")}
                          </p>
                        </div>

                        <Link href={`/dashboard/propiedades/${property.id}`}>
                          <Button variant="outline" size="sm" className="w-full border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 group-hover:border-[#5E8B8C]/50 transition-all duration-300">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
                          Ver detalle
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
