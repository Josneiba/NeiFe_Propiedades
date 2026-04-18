import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Eye, MapPin, User } from "lucide-react"
import Link from "next/link"
import { ContractProgressChart } from "@/components/charts/contract-progress"

interface PropertyWithPaymentStatus {
  id: string
  name: string
  address: string
  commune: string
  monthlyRentCLP: number | null
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

export default async function PropiedadesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  // Get all properties of the current landlord with tenant info and current month payment
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const properties = (await prisma.property.findMany({
    where: {
      landlordId: session.user.id,
      isActive: true,
    },
    include: {
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
    orderBy: {
      createdAt: "desc",
    },
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
    paid: { label: "Pagado", className: "bg-green-600 text-white" },
    pending: { label: "Pendiente", className: "bg-[#C27F79] text-white" },
    overdue: { label: "Atrasado", className: "bg-red-600 text-white" },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Propiedades</h1>
          <p className="text-muted-foreground">Gestiona todas tus propiedades en arriendo</p>
        </div>
        <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]" asChild>
          <Link href="/dashboard/propiedades/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva propiedad
          </Link>
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid gap-4">
        {properties.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-12 w-12 text-[#5E8B8C]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#FAF6F2] mb-3">
                Aún no tienes propiedades registradas
              </h3>
              <p className="text-[#9C8578] mb-8 max-w-md mx-auto">
                Agrega tu primera propiedad para comenzar a gestionar arriendos, pagos y mantenciones.
              </p>
              <Button 
                className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6] px-8 py-3 text-base font-medium" 
                asChild
              >
                <Link href="/dashboard/propiedades/nueva">
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar propiedad
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          properties.map((property) => {
            const paymentStatus = getPaymentStatus(property.payments)
            const status = statusConfig[paymentStatus]

            return (
              <Card key={property.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Property Icon */}
                    <div className="w-full lg:w-40 h-32 bg-[#2D3C3C] rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="h-12 w-12 text-[#D5C3B6]/50" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {property.name || property.address}
                          </h3>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4" />
                            {property.commune}
                          </div>
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
                          <p className="text-sm text-muted-foreground">Arrendatario</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#5E8B8C]" />
                            <span className="font-medium text-foreground">
                              {property.tenant?.name || "Sin asignar"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Arriendo mensual</p>
                          {property.monthlyRentCLP && (
                            <p className="font-bold text-foreground">
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
                            <p className="text-xs text-muted-foreground">Sin fechas de contrato</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 lg:flex-none text-foreground border-border hover:bg-muted"
                        asChild
                      >
                        <Link href={`/dashboard/propiedades/${property.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalle
                        </Link>
                      </Button>
                      <Button 
                        className="flex-1 lg:flex-none bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
                        asChild
                      >
                        <Link href={`/dashboard/pagos?property=${property.id}`}>
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
