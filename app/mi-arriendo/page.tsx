import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { paymentStatusConfig } from "@/lib/status-config"
import {
  Home,
  CreditCard,
  Wrench,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
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
      commune: true,
      region: true,
      monthlyRentCLP: true,
      monthlyRentUF: true,
      contractStart: true,
      contractEnd: true,
      landlord: {
        select: {
          name: true,
          phone: true,
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
    <div className="overflow-hidden rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C]">
      <div className="border-b border-[#D5C3B6]/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5E8B8C]/15">
            <Home className="h-5 w-5 text-[#5E8B8C]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-[#FAF6F2]">{property.address}</h2>
            <p className="mt-0.5 text-xs text-[#9C8578]">
              {property.commune}, {property.region}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-[#D5C3B6]/8">
        <div className="p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#9C8578]">Propietario</p>
          <p className="truncate text-sm font-medium text-[#FAF6F2]">{property.landlord.name}</p>
          {property.landlord.phone && (
            <a
              href={`tel:${property.landlord.phone}`}
              className="mt-0.5 block text-xs text-[#5E8B8C] hover:underline"
            >
              {property.landlord.phone}
            </a>
          )}
        </div>
        <div className="p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#9C8578]">Renta mensual</p>
          <p className="text-sm font-semibold tabular-nums text-[#FAF6F2]">
            {property.monthlyRentCLP ? `$${property.monthlyRentCLP.toLocaleString("es-CL")}` : "—"}
          </p>
          {property.monthlyRentUF && (
            <p className="mt-0.5 text-xs text-[#9C8578]">UF {property.monthlyRentUF.toFixed(2)}</p>
          )}
        </div>
        {contractDates && (
          <>
            <div className="p-4">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[#9C8578]">Inicio contrato</p>
              <p className="text-sm text-[#D5C3B6]">
                {new Date(contractDates.start).toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="p-4">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[#9C8578]">Término contrato</p>
              <p className="text-sm text-[#D5C3B6]">
                {new Date(contractDates.end).toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </>
        )}
      </div>

      {contractDates && (
        <div className="border-t border-[#D5C3B6]/10 p-4">
          <ContractProgressChart
            startDate={new Date(contractDates.start)}
            endDate={new Date(contractDates.end)}
          />
        </div>
      )}
    </div>
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
      <div
        className={`rounded-2xl border-2 p-4 sm:p-5 ${
          !currentPayment
            ? "border-[#D5C3B6]/10 bg-[#2D3C3C]"
            : currentPayment.status === "PAID"
              ? "border-[#5E8B8C]/30 bg-[#5E8B8C]/5"
              : currentPayment.status === "OVERDUE"
                ? "border-[#C27F79]/40 bg-[#C27F79]/5"
                : "border-[#F2C94C]/30 bg-[#F2C94C]/5"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#9C8578]">
              Pago {getMonthName(new Date().getMonth() + 1)} {new Date().getFullYear()}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#FAF6F2]">
              {currentPayment
                ? `$${(currentPayment.amountCLP + water + electricity + gas).toLocaleString("es-CL")}`
                : "Sin información"}
            </p>
          </div>
          {currentPayment && (
            <Badge className={paymentStatusConfig[currentPayment.status as keyof typeof paymentStatusConfig]?.className}>
              {paymentStatusConfig[currentPayment.status as keyof typeof paymentStatusConfig]?.label}
            </Badge>
          )}
        </div>

        {currentPayment && (
          <div className="mb-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#9C8578]">Arriendo</span>
              <span className="tabular-nums text-[#FAF6F2]">
                ${currentPayment.amountCLP.toLocaleString("es-CL")}
              </span>
            </div>
            {(water + electricity + gas) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9C8578]">Servicios</span>
                <span className="tabular-nums text-[#FAF6F2]">
                  ${(water + electricity + gas).toLocaleString("es-CL")}
                </span>
              </div>
            )}
          </div>
        )}

        {currentPayment && (currentPayment.status === "PENDING" || currentPayment.status === "OVERDUE") && (
          <Link
            href="/mi-arriendo/pagos"
            className="flex w-full items-center justify-center rounded-xl bg-[#75524C] py-2.5 text-sm font-semibold text-[#FAF6F2] transition-colors hover:bg-[#75524C]/90"
          >
            Subir comprobante de pago →
          </Link>
        )}
        {(!currentPayment || currentPayment.status === "PAID") && (
          <Link
            href="/mi-arriendo/pagos"
            className="flex w-full items-center justify-center rounded-xl border border-[#D5C3B6]/15 py-2.5 text-sm font-medium text-[#D5C3B6] transition-colors hover:bg-[#D5C3B6]/5"
          >
            Ver historial de pagos
          </Link>
        )}
      </div>

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

      <div className="space-y-4 sm:space-y-6">
        <Suspense fallback={<div className="h-48 rounded-2xl bg-[#2D3C3C] animate-pulse" />}>
          <TenantPropertyInfo tenantId={session.user.id} />
        </Suspense>

        <Suspense fallback={<div className="h-64 rounded-2xl bg-[#2D3C3C] animate-pulse" />}>
          <TenantPaymentInfo propertyId={property.id} />
        </Suspense>

        <Suspense fallback={<div className="h-64 rounded-2xl bg-[#2D3C3C] animate-pulse" />}>
          <TenantMaintenanceInfo propertyId={property.id} />
        </Suspense>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/mi-arriendo/pagos">
            <Card className="h-full cursor-pointer border-[#D5C3B6]/10 bg-[#2D3C3C] transition-colors hover:border-[#5E8B8C]/50">
              <CardContent className="flex h-full flex-col items-center justify-center p-4 text-center">
                <CreditCard className="mb-2 h-8 w-8 text-[#5E8B8C]" />
                <p className="text-sm font-medium text-[#FAF6F2]">Ver Pagos</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/mi-arriendo/servicios">
            <Card className="h-full cursor-pointer border-[#D5C3B6]/10 bg-[#2D3C3C] transition-colors hover:border-[#5E8B8C]/50">
              <CardContent className="flex h-full flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="mb-2 h-8 w-8 text-[#5E8B8C]" />
                <p className="text-sm font-medium text-[#FAF6F2]">Servicios</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/mi-arriendo/mantenciones">
            <Card className="h-full cursor-pointer border-[#D5C3B6]/10 bg-[#2D3C3C] transition-colors hover:border-[#5E8B8C]/50">
              <CardContent className="flex h-full flex-col items-center justify-center p-4 text-center">
                <Wrench className="mb-2 h-8 w-8 text-[#5E8B8C]" />
                <p className="text-sm font-medium text-[#FAF6F2]">Mantenciones</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/mi-arriendo/contrato">
            <Card className="h-full cursor-pointer border-[#D5C3B6]/10 bg-[#2D3C3C] transition-colors hover:border-[#5E8B8C]/50">
              <CardContent className="flex h-full flex-col items-center justify-center p-4 text-center">
                <FileText className="mb-2 h-8 w-8 text-[#5E8B8C]" />
                <p className="text-sm font-medium text-[#FAF6F2]">Contrato</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
