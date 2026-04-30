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
  ArrowRight,
  User
} from "lucide-react"
import Link from "next/link"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount)
}

async function TenantPropertyInfo({ tenantId }: { tenantId: string }) {
  const property = await prisma.property.findFirst({
    where: { tenantId },
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
  })

  if (!property) {
    return (
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-16 text-center">
          <div className="w-24 h-24 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-6">
            <Home className="h-12 w-12 text-[#5E8B8C]" />
          </div>
          <h3 className="text-2xl font-semibold text-[#FAF6F2] mb-3">
            No estás vinculado a ninguna propiedad
          </h3>
          <p className="text-[#9C8578] mb-8 max-w-md mx-auto">
            El propietario debe enviarte una invitación por email para conectarte a tu arriendo.
          </p>
        </CardContent>
      </Card>
    )
  }

  const contractDates =
    property.contractStart && property.contractEnd
      ? {
          start: property.contractStart,
          end: property.contractEnd,
        }
      : null

  return (
    <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
      <CardHeader>
        <CardTitle className="text-[#FAF6F2]">Información de Propiedad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#5E8B8C]/20 flex items-center justify-center">
            <Home className="h-6 w-6 text-[#5E8B8C]" />
          </div>
          <div>
            <p className="text-sm text-[#9C8578]">Dirección</p>
            <p className="font-medium text-[#FAF6F2]">{property.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#75524C]/20 flex items-center justify-center">
            <User className="h-6 w-6 text-[#75524C]" />
          </div>
          <div>
            <p className="text-sm text-[#9C8578]">Propietario</p>
            <p className="font-medium text-[#FAF6F2]">{property.landlord.name}</p>
          </div>
        </div>
        {property.monthlyRentCLP && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#B8965A]/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-[#B8965A]" />
            </div>
            <div>
              <p className="text-sm text-[#9C8578]">Arriendo mensual</p>
              <p className="font-medium text-[#FAF6F2]">{formatCLP(property.monthlyRentCLP)}</p>
            </div>
          </div>
        )}
        {contractDates && (
          <div className="pt-4 border-t border-[#D5C3B6]/10">
            <ContractProgressChart
              startDate={new Date(contractDates.start)}
              endDate={new Date(contractDates.end)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function TenantPaymentInfo({ propertyId }: { propertyId: string }) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const [currentPayment, currentServices, recentPayments] = await Promise.all([
    prisma.payment.findFirst({
      where: {
        propertyId,
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
        propertyId,
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
        propertyId,
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
  ])

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

  return (
    <div className="space-y-6">
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">Pago del Mes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPayment ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[#9C8578]">Estado</span>
                {getStatusBadge(currentPayment.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9C8578]">Arriendo</span>
                <span className="font-medium text-[#FAF6F2]">{formatCLP(currentPayment.amountCLP)}</span>
              </div>
              {currentServices && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9C8578]">Agua</span>
                    <span className="font-medium text-[#FAF6F2]">{formatCLP(water)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9C8578]">Electricidad</span>
                    <span className="font-medium text-[#FAF6F2]">{formatCLP(electricity)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9C8578]">Gas</span>
                    <span className="font-medium text-[#FAF6F2]">{formatCLP(gas)}</span>
                  </div>
                </>
              )}
              <div className="pt-4 border-t border-[#D5C3B6]/10 flex items-center justify-between">
                <span className="text-[#9C8578] font-medium">Total</span>
                <span className="text-xl font-bold text-[#FAF6F2]">{formatCLP(currentPayment.amountCLP + water + electricity + gas)}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-[#9C8578] mx-auto mb-3 opacity-50" />
              <p className="text-[#9C8578]">No hay información de pago para este mes</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">Pagos Recientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentPayments.length === 0 ? (
            <p className="text-[#9C8578] text-center py-4">No hay pagos registrados</p>
          ) : (
            recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1C1917]">
                <div>
                  <p className="text-[#FAF6F2] font-medium">{getMonthName(payment.month)} {payment.year}</p>
                  <p className="text-xs text-[#9C8578]">{new Date(payment.createdAt).toLocaleDateString('es-CL')}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[#5E8B8C]" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function TenantMaintenanceInfo({ propertyId }: { propertyId: string }) {
  const recentMaintenance = await prisma.maintenanceRequest.findMany({
    where: { propertyId },
    select: {
      id: true,
      category: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

  return (
    <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
      <CardHeader>
        <CardTitle className="text-[#FAF6F2]">Mantenciones Recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentMaintenance.length === 0 ? (
          <p className="text-[#9C8578] text-center py-4">No hay mantenciones registradas</p>
        ) : (
          recentMaintenance.map((maintenance) => (
            <div key={maintenance.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1C1917]">
              <div>
                <p className="text-[#FAF6F2] font-medium">{maintenance.category}</p>
                <p className="text-xs text-[#9C8578]">{new Date(maintenance.createdAt).toLocaleDateString('es-CL')}</p>
              </div>
              <Badge className={
                maintenance.status === "COMPLETED" ? "bg-[#5E8B8C] text-white" :
                maintenance.status === "IN_PROGRESS" ? "bg-[#F2C94C] text-[#1C1917]" :
                "bg-[#C27F79] text-white"
              }>
                {maintenance.status === "COMPLETED" ? "Completada" :
                 maintenance.status === "IN_PROGRESS" ? "En progreso" :
                 "Pendiente"}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default async function MiArriendoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "TENANT") redirect("/mi-arriendo")

  const property = await prisma.property.findFirst({
    where: { tenantId: session.user.id },
    select: { id: true },
  })

  if (!property) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Mi Arriendo</h1>
        </div>
        <Suspense fallback={
          <div className="h-64 rounded-xl bg-[#2A2520] animate-pulse" />
        }>
          <TenantPropertyInfo tenantId={session.user.id} />
        </Suspense>
      </div>
    )
  }

  const alerts = []
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const currentPayment = await prisma.payment.findFirst({
    where: {
      propertyId: property.id,
      month: currentMonth,
      year: currentYear,
    },
    select: { status: true },
  })

  if (!currentPayment || currentPayment.status === "PENDING") {
    alerts.push({
      type: "payment",
      message: "Tu pago del mes está pendiente",
      icon: CreditCard,
      color: "text-[#C27F79]",
      bgColor: "bg-[#C27F79]/20",
    })
  }

  const propertyFull = await prisma.property.findFirst({
    where: { tenantId: session.user.id },
    select: { contractEnd: true },
  })

  if (propertyFull?.contractEnd) {
    const daysLeft = Math.floor((new Date(propertyFull.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
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
          {/* Property Info - Suspense boundary */}
          <Suspense fallback={
            <div className="h-64 rounded-xl bg-[#2A2520] animate-pulse" />
          }>
            <TenantPropertyInfo tenantId={session.user.id} />
          </Suspense>

          {/* Payment Info - Suspense boundary */}
          <Suspense fallback={
            <div className="h-64 rounded-xl bg-[#2A2520] animate-pulse" />
          }>
            <TenantPaymentInfo propertyId={property.id} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Maintenance Info - Suspense boundary */}
          <Suspense fallback={
            <div className="h-64 rounded-xl bg-[#2A2520] animate-pulse" />
          }>
            <TenantMaintenanceInfo propertyId={property.id} />
          </Suspense>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/mi-arriendo/pagos">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#5E8B8C]/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <CreditCard className="h-8 w-8 text-[#5E8B8C] mb-2" />
                  <p className="font-medium text-[#FAF6F2] text-sm">Ver Pagos</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/mi-arriendo/servicios">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#5E8B8C]/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <AlertCircle className="h-8 w-8 text-[#5E8B8C] mb-2" />
                  <p className="font-medium text-[#FAF6F2] text-sm">Servicios</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/mi-arriendo/mantenciones">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#5E8B8C]/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <Wrench className="h-8 w-8 text-[#5E8B8C] mb-2" />
                  <p className="font-medium text-[#FAF6F2] text-sm">Mantenciones</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/mi-arriendo/contrato">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#5E8B8C]/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <FileText className="h-8 w-8 text-[#5E8B8C] mb-2" />
                  <p className="font-medium text-[#FAF6F2] text-sm">Contrato</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
