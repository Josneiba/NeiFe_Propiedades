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
import { ServiceRecordCard } from "@/components/services/service-record-card"

interface MonthlyService {
  id?: string
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
  extraItems?: Array<{
    label: string
    amount: number
    billUrl?: string | null
  }> | null
  notes?: string | null
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
          <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Servicios Básicos</h1>
        </div>
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-10 text-center">
            <p className="text-[#9C8578]">No tienes una propiedad asignada</p>
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
      extraItems: true,
      notes: true,
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
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Servicios Básicos</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">Consumo y boletas de agua, luz, gas y otros cargos del arriendo</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#5E8B8C]/20 flex items-center justify-center">
                  <Droplets className="h-4 w-4 text-[#5E8B8C]" />
                </div>
                <div>
                  <p className="text-xs text-[#9C8578]">Agua - Este mes</p>
                  <p className="text-xl font-semibold text-[#FAF6F2]">
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
            <p className="text-xs text-[#9C8578]">
              Promedio últimos {services.length} meses: ${avgWater.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F2C94C]/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-[#F2C94C]" />
                </div>
                <div>
                  <p className="text-xs text-[#9C8578]">Luz - Este mes</p>
                  <p className="text-xl font-semibold text-[#FAF6F2]">
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
            <p className="text-xs text-[#9C8578]">
              Promedio últimos {services.length} meses: ${avgElectricity.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">Consumo mensual</p>
            <ConsumoServiciosChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">Historial de servicios</p>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#9C8578]">No hay historial de servicios registrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...services].reverse().map((service, index) => (
                <ServiceRecordCard
                  key={service.id ?? `${service.month}-${service.year}-${index}`}
                  record={service}
                  monthLabel={`${getMonthName(service.month)} ${service.year}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
