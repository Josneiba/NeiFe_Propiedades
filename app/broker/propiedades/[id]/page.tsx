import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, User, Mail, Phone, CreditCard, Wrench, FileText, Calendar, Users, TrendingUp, ExternalLink } from "lucide-react"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { PropertyMiniMap } from "@/components/map/property-mini-map"
import Link from "next/link"

interface Property {
  id: string
  name?: string
  address: string
  commune: string
  lat?: number | null
  lng?: number | null
  description: string | null
  monthlyRentCLP: number | null
  monthlyRentUF: number | null
  contractStart: string
  contractEnd: string
  landlordId: string
  landlord?: {
    name: string | null
    email: string
  } | null
  tenant?: {
    id: string
    name: string
    email: string
    phone: string | null
    rut: string | null
  } | null
  agentName: string | null
  agentRut: string | null
  agentEmail: string | null
  agentPhone: string | null
  agentCompany: string | null
  commissionRate: number | null
  commissionType: string | null
  payments: any[]
  mandates?: Array<{
    id: string
    status: string
    broker: {
      name: string | null
      email: string
      company?: string | null
    }
  }>
}

interface PropertyWithPaymentStatus extends Property {
  payments: Array<{
    status: string
    month: number
    year: number
  }>
}

export default async function BrokerPropertyDetailPage({ params }: { params: { id: string } }) {
  const propertyId = params.id

  // Get property with all related data for broker
  const property = await prisma.property.findFirst({
    where: { 
      id: propertyId,
      mandates: {
        some: {
          brokerId: propertyId,
          status: 'ACTIVE'
        }
      }
    },
    include: {
      landlord: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      tenant: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      payments: {
        where: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
        select: {
          status: true,
          month: true,
          year: true,
        },
        orderBy: {
          month: 'desc',
          year: 'desc',
        },
        take: 6,
      },
      maintenanceRequests: {
        where: {
          status: 'REQUESTED'
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      mandates: {
        where: {
          status: 'ACTIVE'
        },
        include: {
          broker: {
            select: {
              name: true,
              email: true,
              company: true,
            },
          },
        },
      },
    },
  })

  if (!property) {
    redirect('/broker/propiedades')
  }

  // Get current month payment status
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const currentPayment = property.payments?.find(
    p => p.month === currentMonth && p.year === currentYear
  )

  const getPaymentStatus = (status: string) => {
    switch (status) {
      case 'PAID':
        return { label: 'Pagado', className: 'bg-green-100 text-green-800 border-green-200' }
      case 'PENDING':
        return { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
      case 'OVERDUE':
        return { label: 'Atrasado', className: 'bg-red-100 text-red-800 border-red-200' }
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
  }

  const paymentStatus = currentPayment ? getPaymentStatus(currentPayment.status) : null

  return (
    <div className="min-h-screen bg-[#1C1917]">
      {/* Header */}
      <div className="bg-[#1C1917] border-b border-[#2D3C3C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/broker/propiedades" className="text-[#FAF6F2] hover:text-[#D5C3B6] transition-colors">
                <ArrowLeft className="h-6 w-6" />
                Volver a propiedades
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-[#FAF6F2]">Detalles de Propiedad</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Card */}
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#5E8B8C]" />
                  {property.name || property.address}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-48 bg-[#2D3C3C] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-16 w-16 text-[#D5C3B6]/50" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                      <p className="text-foreground">{property.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Arriendo mensual (CLP)</p>
                        <p className="text-2xl font-bold text-foreground">
                          {property.monthlyRentCLP ? `$${property.monthlyRentCLP.toLocaleString("es-CL")}` : "No especificado"}
                        </p>
                      </div>
                      {property.monthlyRentUF && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Arriendo en UF</p>
                          <p className="text-2xl font-bold text-foreground">
                            UF {property.monthlyRentUF?.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant Info */}
            {property.tenant && (
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-[#5E8B8C]" />
                    Arrendatario
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#5E8B8C] flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {property.tenant.name?.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold text-foreground">{property.tenant.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {property.tenant.email}
                        </div>
                        {property.tenant.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {property.tenant.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contract Info */}
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
                  Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Inicio del contrato</p>
                      <p className="text-foreground">{property.contractStart}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Término del contrato</p>
                      <p className="text-foreground">{property.contractEnd}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <ContractProgressChart 
                      startDate={new Date(property.contractStart)}
                      endDate={new Date(property.contractEnd)}
                      size="large"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Landlord Info */}
            {property.landlord && (
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-[#5E8B8C]" />
                    Propietario
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-foreground">{property.landlord.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {property.landlord.email}
                      </div>
                      {property.landlord.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {property.landlord.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Month Payment Status */}
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
                  Estado del Pago Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {paymentStatus ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pago del mes actual</p>
                      <p className="text-2xl font-bold text-foreground">
                        {property.monthlyRentCLP ? `$${property.monthlyRentCLP.toLocaleString("es-CL")}` : "No especificado"}
                      </p>
                    </div>
                    <Badge className={paymentStatus.className}>
                      {paymentStatus.label}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sin pagos registrados</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/broker/propiedades/${propertyId}/inspecciones`} className="block">
                  <Button className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Programar inspección
                  </Button>
                </Link>
                <Link href={`/broker/propiedades/${propertyId}/reajustes`} className="block">
                  <Button variant="outline" className="w-full text-foreground border-border">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Aplicar IPC
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
                  Pagos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.payments && property.payments.length > 0 ? (
                  <div className="space-y-2">
                    {property.payments.slice(0, 6).map((payment) => (
                      <div key={`${payment.month}-${payment.year}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.year, payment.month - 1).toLocaleDateString("es-CL", { 
                              month: "long", 
                              year: "numeric" 
                            })}
                          </p>
                          <p className="font-semibold text-foreground">
                            ${payment.amountCLP?.toLocaleString("es-CL")}
                          </p>
                        </div>
                        <Badge className={getPaymentStatus(payment.status).className}>
                          {getPaymentStatus(payment.status).label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay pagos registrados</p>
                )}
              </CardContent>
            </Card>

            {/* Active Maintenance Requests */}
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-[#5E8B8C]" />
                  Mantenciones Activas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.maintenanceRequests && property.maintenanceRequests.length > 0 ? (
                  <div className="space-y-2">
                    {property.maintenanceRequests.slice(0, 5).map((maintenance) => (
                      <div key={maintenance.id} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{maintenance.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Categoría: {maintenance.category}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {maintenance.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay mantenciones activas</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
