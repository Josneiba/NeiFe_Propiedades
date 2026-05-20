import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { paymentStatusConfig } from "@/lib/status-config"
import { cn } from "@/lib/utils"
import { LocalizedDateGreeting } from "@/components/layout/localized-date-greeting"
import {
  Home,
  CreditCard,
  Wrench,
  FileText,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Droplets,
  Zap,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { Suspense } from "react"
import { formatDateCompact } from "@/lib/utils"

export const dynamic = "force-dynamic"

function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount)
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
      managedByUser: {
        select: {
          name: true,
          phone: true,
          email: true,
        },
      },
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
      <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
        <CardContent className="p-10 text-center">
          <div className="mx-auto mb-4 flex w-12 h-12 items-center justify-center rounded-full bg-[#5E8B8C]/20">
            <Home className="h-6 w-6 text-[#5E8B8C]" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-[#FAF6F2]">
            No estás vinculado a ninguna propiedad
          </h3>
          <p className="mx-auto mb-8 max-w-md text-sm text-[#9C8578]">
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
    <div className="overflow-hidden rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] shadow-lg shadow-black/10">
      <div className="border-b border-[#D5C3B6]/10 p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5E8B8C]/15">
            <Home className="h-6 w-6 text-[#5E8B8C]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-semibold text-[#FAF6F2]">{property.address}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#9C8578]">
              <MapPin className="h-4 w-4 text-[#5E8B8C]" />
              {property.commune}, {property.region}
            </p>
            {property.managedByUser && (
              <Badge className="mt-3 bg-[#5E8B8C]/20 text-[#5E8B8C]">
                Administración delegada a {property.managedByUser.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {property.managedByUser && (
            <div className="rounded-xl bg-[#1C1917] p-4">
              <p className="mb-2 text-[10px] uppercase tracking-wide text-[#9C8578]">Corredor administrador</p>
              <p className="truncate text-sm font-semibold text-[#FAF6F2]">{property.managedByUser.name}</p>
              {property.managedByUser.phone && (
                <a href={`tel:${property.managedByUser.phone}`} className="mt-1 block text-xs text-[#5E8B8C] hover:underline">
                  {property.managedByUser.phone}
                </a>
              )}
              {!property.managedByUser.phone && property.managedByUser.email && (
                <p className="mt-1 text-xs text-[#5E8B8C]">{property.managedByUser.email}</p>
              )}
            </div>
          )}

          <div className="rounded-xl bg-[#1C1917] p-4">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-[#9C8578]">Propietario</p>
            <p className="truncate text-sm font-semibold text-[#FAF6F2]">{property.landlord.name}</p>
            {property.landlord.phone && (
              <a href={`tel:${property.landlord.phone}`} className="mt-1 block text-xs text-[#5E8B8C] hover:underline">
                {property.landlord.phone}
              </a>
            )}
          </div>

          <div className="rounded-xl bg-[#1C1917] p-4">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-[#9C8578]">Renta mensual</p>
            <p className="text-sm font-semibold tabular-nums text-[#FAF6F2]">
              {property.monthlyRentCLP ? `$${property.monthlyRentCLP.toLocaleString("es-CL")}` : "—"}
            </p>
            {property.monthlyRentUF && (
              <p className="mt-1 text-xs text-[#9C8578]">UF {property.monthlyRentUF.toFixed(2)}</p>
            )}
          </div>

          {contractDates && (
            <>
              <div className="rounded-xl bg-[#1C1917] p-4">
                <p className="mb-2 text-[10px] uppercase tracking-wide text-[#9C8578]">Inicio contrato</p>
                <p className="text-sm font-semibold text-[#FAF6F2]">
                  {formatDateCompact(contractDates.start)}
                </p>
              </div>

              <div className="rounded-xl bg-[#1C1917] p-4">
                <p className="mb-2 text-[10px] uppercase tracking-wide text-[#9C8578]">Termino contrato</p>
                <p className="text-sm font-semibold text-[#FAF6F2]">
                  {formatDateCompact(contractDates.end)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {contractDates && (
        <div className="border-t border-[#D5C3B6]/10 p-5 sm:p-6">
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
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    return months[month - 1]
  }

  const water = currentServices?.water ?? 0
  const electricity = currentServices?.electricity ?? 0
  const gas = currentServices?.gas ?? 0
  const serviceKPIs = [
    {
      label: "Agua",
      value: water,
      icon: Droplets,
      color: "text-[#5E8B8C]",
      bg: "bg-[#5E8B8C]/10 border-[#5E8B8C]/20",
    },
    {
      label: "Luz",
      value: electricity,
      icon: Zap,
      color: "text-[#F2C94C]",
      bg: "bg-[#F2C94C]/10 border-[#F2C94C]/20",
    },
    {
      label: "Gas",
      value: gas,
      icon: Flame,
      color: "text-[#B8965A]",
      bg: "bg-[#B8965A]/10 border-[#B8965A]/20",
    },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-2xl border-2 p-4 sm:p-5",
          !currentPayment
            ? "border-[#D5C3B6]/10 bg-[#2D3C3C]"
            : currentPayment.status === "PAID"
              ? "border-[#5E8B8C]/30 bg-[#5E8B8C]/5"
              : currentPayment.status === "OVERDUE"
                ? "border-[#C27F79]/40 bg-[#C27F79]/5"
                : "border-[#F2C94C]/30 bg-[#F2C94C]/5"
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#9C8578]">
              Pago {getMonthName(new Date().getMonth() + 1)} {new Date().getFullYear()}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#FAF6F2]">
              {currentPayment
                ? `$${(currentPayment.amountCLP + water + electricity + gas).toLocaleString("es-CL")}`
                : "Sin informacion"}
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

        {serviceKPIs.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {serviceKPIs.map((item) => (
              <div key={item.label} className={cn("rounded-lg border p-4", item.bg)}>
                <div className="flex items-center gap-2">
                  <item.icon className={cn("h-4 w-4", item.color)} />
                  <p className="text-[10px] uppercase tracking-wide text-[#9C8578]">{item.label}</p>
                </div>
                <p className="mt-2 text-lg font-semibold text-[#FAF6F2]">
                  ${item.value.toLocaleString("es-CL")}
                </p>
              </div>
            ))}
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

      <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">Pagos recientes</p>
          <div className="space-y-3">
          {recentPayments.length === 0 ? (
            <p className="py-4 text-center text-[#9C8578]">No hay pagos registrados</p>
          ) : (
            recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg bg-[#1C1917] p-3">
                <div>
                  <p className="font-medium text-[#FAF6F2]">
                    {getMonthName(payment.month)} {payment.year}
                  </p>
                  <p className="text-xs text-[#9C8578]">
                    {formatDateCompact(payment.createdAt)}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[#5E8B8C]" />
              </div>
            ))
          )}
        </div>
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
    <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">Mantenciones recientes</p>
        <div className="space-y-3">
        {recentMaintenance.length === 0 ? (
          <p className="py-4 text-center text-[#9C8578]">No hay mantenciones registradas</p>
        ) : (
          recentMaintenance.map((maintenance) => (
            <div key={maintenance.id} className="flex items-center justify-between rounded-lg bg-[#1C1917] p-3">
              <div>
                <p className="font-medium text-[#FAF6F2]">{maintenance.category}</p>
                <p className="text-xs text-[#9C8578]">
                  {formatDateCompact(maintenance.createdAt)}
                </p>
              </div>
              <Badge
                className={
                  maintenance.status === "COMPLETED"
                    ? "bg-[#5E8B8C] text-[#FAF6F2]"
                    : maintenance.status === "IN_PROGRESS"
                      ? "bg-[#F2C94C] text-[#1C1917]"
                      : "bg-[#C27F79] text-[#FAF6F2]"
                }
              >
                {maintenance.status === "COMPLETED"
                  ? "Completada"
                  : maintenance.status === "IN_PROGRESS"
                    ? "En progreso"
                    : "Pendiente"}
              </Badge>
            </div>
          ))
        )}
        </div>
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
          <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Mi Arriendo</h1>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-[#2A2520]" />}>
          <TenantPropertyInfo tenantId={session.user.id} />
        </Suspense>
      </div>
    )
  }

  const alerts: Array<{
    type: "payment" | "contract"
    message: string
    icon: typeof CreditCard | typeof FileText
  }> = []
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

  if (!currentPayment || currentPayment.status === "PENDING" || currentPayment.status === "OVERDUE") {
    alerts.push({
      type: "payment",
      message:
        currentPayment?.status === "OVERDUE"
          ? "Tu pago del mes esta atrasado"
          : "Tu pago del mes esta pendiente",
      icon: CreditCard,
    })
  }

  const propertyFull = await prisma.property.findFirst({
    where: { tenantId: session.user.id },
    select: { contractEnd: true },
  })

  if (propertyFull?.contractEnd) {
    const daysLeft = Math.floor(
      (new Date(propertyFull.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft > 0 && daysLeft <= 90) {
      alerts.push({
        type: "contract",
        message: `Tu contrato vence en ${Math.ceil(daysLeft / 30)} meses`,
        icon: FileText,
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <LocalizedDateGreeting
          name={session.user.name}
          subtitle="Tu informacion de arriendo y servicios"
          dateClassName="mb-1 text-sm text-[#9C8578]"
          headingClassName="text-3xl font-serif font-semibold text-[#FAF6F2] md:text-4xl"
          subtitleClassName="mt-1 text-[#9C8578]"
        />
        <Badge
          className={cn(
            "px-3 py-1.5 text-sm",
            currentPayment?.status === "PAID"
              ? "bg-[#5E8B8C]/20 text-[#5E8B8C]"
              : "bg-[#C27F79]/20 text-[#C27F79]"
          )}
        >
          {currentPayment?.status === "PAID" ? "Al dia" : "Pago pendiente"}
        </Badge>
      </div>

      {currentPayment && (currentPayment.status === "PENDING" || currentPayment.status === "OVERDUE") ? (
        <Link href="/mi-arriendo/pagos" className="block">
          <Button className="w-full bg-[#C27F79] py-3 text-base font-semibold text-[#FAF6F2] shadow-lg shadow-[#C27F79]/20 hover:bg-[#C27F79]/90">
            Pagar ahora
          </Button>
        </Link>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/mi-arriendo/pagos" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-[#D5C3B6]/10 text-[#D5C3B6] hover:bg-[#D5C3B6]/5 hover:text-[#FAF6F2]"
            >
              Ver pagos
            </Button>
          </Link>
          <Link href="/mi-arriendo/mantenciones" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-[#D5C3B6]/10 text-[#D5C3B6] hover:bg-[#D5C3B6]/5 hover:text-[#FAF6F2]"
            >
              Reportar problema
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link href="/mi-arriendo/pagos">
          <div className="group rounded-xl border border-[#5E8B8C]/20 bg-[#5E8B8C]/5 p-4 sm:p-6 transition-all hover:border-[#5E8B8C]/50 hover:bg-[#5E8B8C]/10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#5E8B8C]/20 group-hover:bg-[#5E8B8C]/30">
              <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
            </div>
            <p className="font-semibold text-[#FAF6F2]">Pagos</p>
            <p className="mt-1 text-xs text-[#9C8578]">Ver historial y comprobar pago</p>
          </div>
        </Link>

        <Link href="/mi-arriendo/servicios">
          <div className="group rounded-xl border border-[#B8965A]/20 bg-[#B8965A]/5 p-4 sm:p-6 transition-all hover:border-[#B8965A]/50 hover:bg-[#B8965A]/10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#B8965A]/20 group-hover:bg-[#B8965A]/30">
              <AlertCircle className="h-5 w-5 text-[#B8965A]" />
            </div>
            <p className="font-semibold text-[#FAF6F2]">Servicios</p>
            <p className="mt-1 text-xs text-[#9C8578]">Agua, luz y gas del mes</p>
          </div>
        </Link>

        <Link href="/mi-arriendo/mantenciones">
          <div className="group rounded-xl border border-[#F2C94C]/20 bg-[#F2C94C]/5 p-4 sm:p-6 transition-all hover:border-[#F2C94C]/50 hover:bg-[#F2C94C]/10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2C94C]/20 group-hover:bg-[#F2C94C]/30">
              <Wrench className="h-5 w-5 text-[#F2C94C]" />
            </div>
            <p className="font-semibold text-[#FAF6F2]">Mantenciones</p>
            <p className="mt-1 text-xs text-[#9C8578]">Reportar problemas</p>
          </div>
        </Link>

        <Link href="/mi-arriendo/contrato">
          <div className="group rounded-xl border border-[#D5C3B6]/20 bg-[#D5C3B6]/5 p-4 sm:p-6 transition-all hover:border-[#D5C3B6]/50 hover:bg-[#D5C3B6]/10">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#D5C3B6]/20 group-hover:bg-[#D5C3B6]/30">
              <FileText className="h-5 w-5 text-[#D5C3B6]" />
            </div>
            <p className="font-semibold text-[#FAF6F2]">Contrato</p>
            <p className="mt-1 text-xs text-[#9C8578]">Descargar o ver documento</p>
          </div>
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 transition-all",
                alert.type === "payment"
                  ? "border-[#C27F79]/30 bg-[#C27F79]/10"
                  : "border-[#F2C94C]/30 bg-[#F2C94C]/10"
              )}
            >
              <alert.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  alert.type === "payment" ? "text-[#C27F79]" : "text-[#F2C94C]"
                )}
              />
              <span className="flex-1 text-[#FAF6F2]">{alert.message}</span>
              <Badge className={alert.type === "payment" ? "bg-[#C27F79]/20 text-[#C27F79]" : "bg-[#F2C94C]/20 text-[#F2C94C]"}>
                {alert.type === "payment" ? "URGENTE" : "ATENCION"}
              </Badge>
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
      </div>
    </div>
  )
}
