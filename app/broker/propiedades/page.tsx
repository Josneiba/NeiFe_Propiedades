import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchFilter } from "@/components/ui/search-filter"
import { Building2, Eye, MapPin, User } from "lucide-react"
import Link from "next/link"
import { ContractProgressChart } from "@/components/charts/contract-progress"

interface PropertyWithPaymentStatus {
  id: string
  name: string
  address: string
  commune: string
  monthlyRentCLP: number | null
  landlord: {
    name: string | null
    email: string
  } | null
  tenant: {
    name: string | null
    email: string
  } | null
  contractStart: Date
  contractEnd: Date
  payments: Array<{
    status: string
    month: number
    year: number
  }>
}

export default async function BrokerPropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/dashboard")
  }
  const { q } = await searchParams

  // Get all properties of mandates where the current user is the broker
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const mandates = await prisma.mandate.findMany({
    where: {
      brokerId: session.user.id,
      status: 'ACTIVE',
      ...(q
        ? {
            property: {
              OR: [
                { address: { contains: q, mode: "insensitive" } },
                { commune: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { tenant: { name: { contains: q, mode: "insensitive" } } },
                { landlord: { name: { contains: q, mode: "insensitive" } } },
              ],
            },
          }
        : {}),
    },
    include: {
      property: {
        include: {
          landlord: {
            select: {
              name: true,
              email: true,
            },
          },
          tenant: {
            select: {
              name: true,
              email: true,
            },
          },
          payments: {
            where: {
              month: currentMonth,
              year: currentYear,
            },
            select: {
              status: true,
              month: true,
              year: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const properties = mandates.map(m => ({
    ...m.property,
  })) as PropertyWithPaymentStatus[]

  const getPaymentStatus = (payments: Array<{ status: string }>) => {
    const payment = payments[0]
    if (!payment) return "pending"
    const statusMap: Record<string, "paid" | "pending" | "overdue"> = {
      PAID: "paid",
      PENDING: "pending",
      OVERDUE: "overdue",
      PROCESSING: "pending",
      CANCELLED: "pending",
    }
    return statusMap[payment.status] || "pending"
  }

  const statusConfig = {
    paid: { label: "Pagado", className: "bg-[#5E8B8C] text-white" },
    pending: { label: "Pendiente", className: "bg-[#C27F79] text-white" },
    overdue: { label: "Atrasado", className: "bg-red-600 text-white" },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FAF6F2]">Propiedades</h1>
          <p className="text-[#9C8578]">Propiedades que administras</p>
        </div>
      </div>
      <div>
        <SearchFilter placeholder="Buscar por direccion, comuna, propietario o arrendatario..." />
      </div>

      {/* Properties Grid */}
      <div className="grid gap-4">
        {properties.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-[#9C8578] mx-auto mb-3 opacity-50" />
              <p className="text-[#9C8578] mb-4">No administras propiedades aún</p>
              <Link href="/broker/mandatos">
                <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                  Solicitar Administración
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          properties.map((property) => {
            const paymentStatus = getPaymentStatus(property.payments)
            const status = statusConfig[paymentStatus]

            return (
              <Card key={property.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Property Icon */}
                    <div className="w-full lg:w-40 h-32 bg-[#1C1917] rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="h-12 w-12 text-[#D5C3B6]/50" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-[#FAF6F2]">
                            {property.name || property.address}
                          </h3>
                          <div className="flex items-center gap-2 text-[#9C8578] text-sm">
                            <MapPin className="h-4 w-4" />
                            {property.commune}
                          </div>
                          {property.landlord && (
                            <p className="text-xs text-[#9C8578] mt-1">
                              Propietario: {property.landlord.name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={status.className}>
                            {status.label}
                          </Badge>
                          {!property.tenant && (
                            <Badge variant="outline" className="text-xs border-[#F2C94C]/40 text-[#F2C94C] bg-[#F2C94C]/10">
                              Sin arrendatario
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-[#9C8578]">Arrendatario</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#5E8B8C]" />
                            <span className="font-medium text-[#FAF6F2]">
                              {property.tenant?.name || "Sin asignar"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-[#9C8578]">Arriendo mensual</p>
                          {property.monthlyRentCLP && (
                            <p className="font-bold text-[#FAF6F2]">
                              ${property.monthlyRentCLP.toLocaleString("es-CL")}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          {property.contractStart && property.contractEnd ? (
                            <ContractProgressChart 
                              startDate={new Date(property.contractStart)}
                              endDate={new Date(property.contractEnd)}
                              size="small"
                            />
                          ) : (
                            <p className="text-xs text-[#9C8578]">Sin fechas de contrato</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 lg:flex-none text-[#FAF6F2] border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/10"
                        asChild
                      >
                        <Link href={`/broker/propiedades/${property.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver ficha
                        </Link>
                      </Button>
                      <Button 
                        className="flex-1 lg:flex-none bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
                        asChild
                      >
                        <Link href={`/broker/propiedades/${property.id}#gestion`}>
                          Gestionar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
