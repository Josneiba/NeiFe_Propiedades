import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  CreditCard,
  Wrench,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { ContractProgressChart } from "@/components/charts/contract-progress"

export default async function MiArriendoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "TENANT") redirect("/mi-arriendo")

  // Get the property assigned to this tenant and current month payment
  const tenant = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { propertyId: true },
  })

  if (!tenant?.propertyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Mi Arriendo</h1>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No tienes una propiedad asignada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Get property details, current month payment, and recent activity
  const [property, currentPayment, currentServices, recentPayments, recentMaintenance] = await Promise.all([
    prisma.property.findUnique({
      where: { id: tenant.propertyId },
      select: {
        id: true,
        address: true,
        monthlyRentCLP: true,
        contractStart: true,
        contractEnd: true,
        landlord: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.payment.findFirst({
      where: {
        propertyId: tenant.propertyId,
        month: currentMonth,
        year: currentYear,
      },
      select: {
        id: true,
        status: true,
        amountCLP: true,
        createdAt: true,
      },
    }),
    prisma.monthlyService.findFirst({
      where: {
        propertyId: tenant.propertyId,
        month: currentMonth,
        year: currentYear,
      },
      select: {
        water: true,
        electricity: true,
        gas: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        propertyId: tenant.propertyId,
        status: "PAID",
      },
      select: {
        id: true,
        month: true,
        year: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.maintenanceRequest.findMany({
      where: {
        propertyId: tenant.propertyId,
      },
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ])

  if (!property) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Mi Arriendo</h1>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No se encontró información de tu propiedad</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      PAID: { bg: "bg-green-100", text: "text-green-700", label: "Pagado" },
      PENDING: { bg: "bg-amber-100", text: "text-amber-700", label: "Pendiente" },
      OVERDUE: { bg: "bg-red-100", text: "text-red-700", label: "Atrasado" },
      PROCESSING: { bg: "bg-blue-100", text: "text-blue-700", label: "En revisión" },
    }
    const config = statusMap[status] || statusMap.PENDING
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getMonthName = (month: number) => {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    return months[month - 1]
  }

  const water = currentServices?.water ?? 0
  const electricity = currentServices?.electricity ?? 0
  const gas = currentServices?.gas ?? 0
  const currentTotal = (property.monthlyRentCLP || 0) + water + electricity + gas

  // Build activity items
  const activityItems = [
    ...recentPayments.map((p) => ({
      type: "payment" as const,
      description: `Pago de ${getMonthName(p.month)} ${p.year} confirmado`,
      date: p.createdAt,
      status: "success" as const,
    })),
    ...recentMaintenance.map((m) => ({
      type: "maintenance" as const,
      description: `Solicitud de ${m.category} - ${m.status === "COMPLETED" ? "completada" : m.status === "IN_PROGRESS" ? "en progreso" : "pendiente"}`,
      date: m.createdAt,
      status: m.status === "COMPLETED" ? ("success" as const) : ("pending" as const),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3)

  const alerts = []
  if (!currentPayment || currentPayment.status === "PENDING") {
    alerts.push({
      type: "payment",
      message: "Tu pago del mes está pendiente",
      icon: CreditCard,
      color: "text-[#C27F79]",
      bgColor: "bg-[#C27F79]/20",
    })
  }
  if (property.contractEnd) {
    const daysLeft = Math.floor((new Date(property.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft > 0 && daysLeft <= 90) {
      alerts.push({
        type: "contract",
        message: `Tu contrato vence en ${Math.ceil(daysLeft / 30)} meses`,
        icon: FileText,
        color: "text-[#5E8B8C]",
        bgColor: "bg-[#5E8B8C]/20",
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif text-foreground">Mi Arriendo</h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <Home className="h-4 w-4" />
          {property.address}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 p-4 rounded-lg ${alert.bgColor}`}
            >
              <alert.icon className={`h-5 w-5 ${alert.color}`} />
              <span className="text-foreground">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Month Payment */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
                  Estado del Mes
                </CardTitle>
                {currentPayment && getStatusBadge(currentPayment.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Arriendo</p>
                  <p className="text-lg font-bold text-foreground">
                    ${(property.monthlyRentCLP || 0).toLocaleString("es-CL")}
                  </p>
                </div>
                {water > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Agua</p>
                    <p className="text-lg font-bold text-foreground">
                      ${water.toLocaleString("es-CL")}
                    </p>
                  </div>
                )}
                {electricity > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Luz</p>
                    <p className="text-lg font-bold text-foreground">
                      ${electricity.toLocaleString("es-CL")}
                    </p>
                  </div>
                )}
                {gas > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Gas</p>
                    <p className="text-lg font-bold text-foreground">
                      ${gas.toLocaleString("es-CL")}
                    </p>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-[#5E8B8C]/20">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-[#5E8B8C]">
                    ${currentTotal.toLocaleString("es-CL")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Próximo vencimiento</p>
                  <p className="font-medium text-foreground">
                    {currentMonth === 12 ? "1 de Enero" : `1 de ${getMonthName(currentMonth + 1)}`}
                  </p>
                </div>
                <Button 
                  className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
                  asChild
                >
                  <Link href="/mi-arriendo/pagos">
                    Pagar ahora
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {activityItems.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityItems.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.status === "success" 
                          ? "bg-green-100" 
                          : "bg-amber-100"
                      }`}>
                        {activity.status === "success" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/mi-arriendo/pagos">
              <Card className="bg-card border-border hover:border-[#5E8B8C]/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <CreditCard className="h-8 w-8 text-[#5E8B8C] mb-2" />
                  <p className="font-medium text-foreground text-sm">Ver Pagos</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/mi-arriendo/servicios">
              <Card className="bg-card border-border hover:border-[#5E8B8C]/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <AlertCircle className="h-8 w-8 text-[#5E8B8C] mb-2" />
                  <p className="font-medium text-foreground text-sm">Servicios</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/mi-arriendo/mantenciones">
              <Card className="bg-card border-border hover:border-[#5E8B8C]/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <Wrench className="h-8 w-8 text-[#5E8B8C] mb-2" />
                  <p className="font-medium text-foreground text-sm">Mantenciones</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/mi-arriendo/contrato">
              <Card className="bg-card border-border hover:border-[#5E8B8C]/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <FileText className="h-8 w-8 text-[#5E8B8C] mb-2" />
                  <p className="font-medium text-foreground text-sm">Contrato</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Progress */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Mi Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractProgressChart 
                startDate={property.contractStart}
                endDate={property.contractEnd}
                size="large"
              />
            </CardContent>
          </Card>

          {/* Property Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="text-foreground">{property.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Arrendador</p>
                <p className="text-foreground">{property.landlord.name || "Sin asignar"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Arriendo mensual</p>
                <p className="text-lg font-bold text-[#5E8B8C]">
                  ${(property.monthlyRentCLP || 0).toLocaleString("es-CL")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
