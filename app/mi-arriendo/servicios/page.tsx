import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Droplets,
  Zap,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { ConsumoServiciosChart } from "@/components/mi-arriendo/ConsumoServiciosChart"

interface MonthlyService {
  month: number
  year: number
  water: number
  electricity: number
  gas?: number
  garbage?: number
  commonExpenses?: number
  other?: number
  otherLabel?: string | null
  waterBillUrl?: string | null
  lightBillUrl?: string | null
  gasBillUrl?: string | null
  garbageBillUrl?: string | null
  commonBillUrl?: string | null
}

export default async function ServiciosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "TENANT") redirect("/mi-arriendo")

  const property = await prisma.property.findFirst({
    where: { tenantId: session.user.id },
    select: { id: true },
  })

  if (!property?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Servicios Básicos</h1>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No tienes una propiedad asignada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get 12 months of service data
  const currentDate = new Date()
  const services = (await prisma.monthlyService.findMany({
    where: {
      propertyId: property.id,
    },
    select: {
      month: true,
      year: true,
      water: true,
      electricity: true,
      gas: true,
      garbage: true,
      commonExpenses: true,
      other: true,
      otherLabel: true,
      waterBillUrl: true,
      lightBillUrl: true,
      gasBillUrl: true,
      garbageBillUrl: true,
      commonBillUrl: true,
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  })) as unknown as MonthlyService[]

  // Get payments to show status
  const payments = await prisma.payment.findMany({
    where: {
      propertyId: property.id,
    },
    select: {
      month: true,
      year: true,
      status: true,
    },
  })

  const getMonthName = (month: number) => {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    return months[month - 1]
  }

  // Calculate averages and trends
  const avgWater = services.length > 0
    ? Math.round(services.reduce((acc, s) => acc + s.water, 0) / services.length)
    : 0
  const avgElectricity = services.length > 0
    ? Math.round(services.reduce((acc, s) => acc + s.electricity, 0) / services.length)
    : 0

  const lastService = services[services.length - 1]
  const prevService = services[services.length - 2]
  
  const waterTrend = prevService
    ? (((lastService?.water || 0) - prevService.water) / prevService.water * 100).toFixed(1)
    : "0"
  const electricityTrend = prevService
    ? (((lastService?.electricity || 0) - prevService.electricity) / prevService.electricity * 100).toFixed(1)
    : "0"

  // Prepare chart data (last 6 months)
  const chartData = services.slice(-6).map((s) => ({
    month: getMonthName(s.month).slice(0, 3),
    water: s.water,
    electricity: s.electricity,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Servicios Básicos</h1>
        <p className="text-muted-foreground">Consumo y boletas de agua, luz, gas y otros cargos del arriendo</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Droplets className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agua - Este mes</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${(lastService?.water || 0).toLocaleString("es-CL")}
                  </p>
                </div>
              </div>
              {prevService && (
                <div className={`flex items-center gap-1 text-sm ${
                  Number(waterTrend) > 0 ? "text-[#C27F79]" : "text-[#5E8B8C]"
                }`}>
                  {Number(waterTrend) > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {waterTrend}%
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Promedio ultimos {services.length} meses: ${avgWater.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Luz - Este mes</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${(lastService?.electricity || 0).toLocaleString("es-CL")}
                  </p>
                </div>
              </div>
              {prevService && (
                <div className={`flex items-center gap-1 text-sm ${
                  Number(electricityTrend) > 0 ? "text-[#C27F79]" : "text-[#5E8B8C]"
                }`}>
                  {Number(electricityTrend) > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {electricityTrend}%
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Promedio ultimos {services.length} meses: ${avgElectricity.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Consumo Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsumoServiciosChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Historial de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay historial de servicios registrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mes</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Agua</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Luz</th>
                    {services.some(s => s.gas && s.gas > 0) && (
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gas</th>
                    )}
                    {services.some(s => s.commonExpenses && s.commonExpenses > 0) && (
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gasto común</th>
                    )}
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total servicios</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Boletas</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-border/50 hover:bg-muted/20"
                    >
                      <td className="py-4 px-4 font-medium text-foreground">
                        {getMonthName(service.month)} {service.year}
                      </td>
                      <td className="py-4 px-4 text-right text-foreground">
                        ${service.water.toLocaleString("es-CL")}
                      </td>
                      <td className="py-4 px-4 text-right text-foreground">
                        ${service.electricity.toLocaleString("es-CL")}
                      </td>
                      {services.some(s => s.gas && s.gas > 0) && (
                        <td className="py-4 px-4 text-right text-foreground">
                          ${(service.gas || 0).toLocaleString("es-CL")}
                        </td>
                      )}
                      {services.some(s => s.commonExpenses && s.commonExpenses > 0) && (
                        <td className="py-4 px-4 text-right text-foreground">
                          ${(service.commonExpenses || 0).toLocaleString("es-CL")}
                        </td>
                      )}
                      <td className="py-4 px-4 text-right font-semibold text-foreground">
                        ${(
                          service.water +
                          service.electricity +
                          (service.gas || 0) +
                          (service.garbage || 0) +
                          (service.commonExpenses || 0) +
                          (service.other || 0)
                        ).toLocaleString("es-CL")}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                          {service.waterBillUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={service.waterBillUrl} target="_blank" rel="noopener noreferrer">
                                Agua
                              </a>
                            </Button>
                          ) : null}
                          {service.lightBillUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={service.lightBillUrl} target="_blank" rel="noopener noreferrer">
                                Luz
                              </a>
                            </Button>
                          ) : null}
                          {service.gasBillUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={service.gasBillUrl} target="_blank" rel="noopener noreferrer">
                                Gas
                              </a>
                            </Button>
                          ) : null}
                          {service.commonBillUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={service.commonBillUrl} target="_blank" rel="noopener noreferrer">
                                GC
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
