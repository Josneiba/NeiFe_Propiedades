import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { PropertyMiniMap } from "@/components/map/property-mini-map"
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  Wrench,
} from "lucide-react"
import { getUserIdentity } from "@/lib/identity-documents"

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

const monthFormatter = new Intl.DateTimeFormat("es-CL", {
  month: "long",
  year: "numeric",
})

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: "Pagado", className: "bg-[#5E8B8C] text-white" },
  PENDING: { label: "Pendiente", className: "bg-[#C27F79] text-white" },
  OVERDUE: { label: "Atrasado", className: "bg-red-600 text-white" },
  PROCESSING: { label: "En revisión", className: "bg-[#F2C94C] text-[#1C1917]" },
  CANCELLED: { label: "Cancelado", className: "bg-[#9C8578] text-white" },
}

const maintenanceStatusConfig: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "Solicitada", className: "bg-[#F2C94C]/15 text-[#F2C94C]" },
  REVIEWING: { label: "En revisión", className: "bg-sky-500/15 text-sky-300" },
  APPROVED: { label: "Aprobada", className: "bg-emerald-500/15 text-emerald-300" },
  IN_PROGRESS: { label: "En curso", className: "bg-[#5E8B8C]/15 text-[#8FC4C5]" },
}

const inspectionTypeLabels: Record<string, string> = {
  ROUTINE: "Rutinaria",
  CHECKIN: "Ingreso",
  CHECKOUT: "Salida",
  MAINTENANCE: "Mantención",
  IPC_REVIEW: "Revisión IPC",
}

const inspectionStatusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reagendada",
}

const brokerScopeBadgeClass: Record<"OPERATE" | "TRACK" | "READ_ONLY", string> = {
  OPERATE: "bg-[#5E8B8C] text-white",
  TRACK: "bg-[#F2C94C] text-[#1C1917]",
  READ_ONLY: "bg-[#D5C3B6]/15 text-[#D5C3B6]",
}

function formatCurrency(value?: number | null) {
  if (value == null) return "No informado"
  return currencyFormatter.format(value)
}

function formatDate(value?: Date | null) {
  if (!value) return "No definida"
  return dateFormatter.format(value)
}

function formatMonth(month: number, year: number) {
  return monthFormatter.format(new Date(year, month - 1, 1))
}

export default async function BrokerPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/dashboard")
  }

  const { id } = await params

  const property = await prisma.property.findFirst({
    where: {
      id,
      isActive: true,
      OR: [
        { managedBy: session.user.id },
        {
          mandates: {
            some: {
              brokerId: session.user.id,
              status: "ACTIVE",
            },
          },
        },
      ],
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
          id: true,
          name: true,
          email: true,
          phone: true,
          rut: true,
          documentType: true,
          documentNumber: true,
          documentNumberNormalized: true,
        },
      },
      payments: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 6,
        select: {
          id: true,
          status: true,
          month: true,
          year: true,
          amountCLP: true,
        },
      },
      services: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 3,
        select: {
          id: true,
          month: true,
          year: true,
          water: true,
          electricity: true,
          gas: true,
          garbage: true,
          commonExpenses: true,
          other: true,
          otherLabel: true,
        },
      },
      maintenance: {
        where: {
          status: {
            in: ["REQUESTED", "REVIEWING", "APPROVED", "IN_PROGRESS"],
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          category: true,
          description: true,
          status: true,
          createdAt: true,
        },
      },
      providers: {
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              specialty: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      inspections: {
        orderBy: {
          scheduledAt: "asc",
        },
        take: 4,
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          type: true,
        },
      },
      mandates: {
        where: {
          brokerId: session.user.id,
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          startsAt: true,
          expiresAt: true,
          notes: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
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
    redirect("/broker/propiedades")
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentPayment =
    property.payments.find(
      (payment) => payment.month === currentMonth && payment.year === currentYear
    ) ?? property.payments[0] ?? null
  const currentPaymentStatus = currentPayment
    ? paymentStatusConfig[currentPayment.status] ?? {
        label: currentPayment.status,
        className: "bg-[#9C8578] text-white",
      }
    : { label: "Sin registro", className: "bg-[#9C8578] text-white" }
  const activeMandate = property.mandates[0] ?? null
  const latestService = property.services[0] ?? null
  const tenantIdentity = property.tenant ? getUserIdentity(property.tenant) : null
  const nextInspection =
    property.inspections.find((inspection) => inspection.scheduledAt >= now) ??
    property.inspections[0] ??
    null
  const summaryCards = [
    {
      label: "Arriendo",
      value: formatCurrency(property.monthlyRentCLP),
      detail: property.monthlyRentUF
        ? `UF ${property.monthlyRentUF.toFixed(2)}`
        : "Canon mensual vigente",
    },
    {
      label: "Pago actual",
      value: currentPayment ? formatCurrency(currentPayment.amountCLP) : "Sin registro",
      detail: currentPayment
        ? `${currentPaymentStatus.label} • ${formatMonth(currentPayment.month, currentPayment.year)}`
        : "Aún no existe pago cargado",
    },
    {
      label: "Mantenciones",
      value: property.maintenance.length.toString(),
      detail:
        property.maintenance.length === 1
          ? "Solicitud abierta"
          : "Solicitudes abiertas",
    },
    {
      label: "Proveedores",
      value: property.providers.length.toString(),
      detail:
        property.providers.length === 1 ? "Proveedor vinculado" : "Proveedores vinculados",
    },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/broker/propiedades"
            className="inline-flex items-center gap-2 text-sm text-[#9C8578] hover:text-[#D5C3B6] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a propiedades
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-[#FAF6F2]">
                {property.name || property.address}
              </h1>
              <Badge className="bg-[#5E8B8C] text-white">Vista corredor</Badge>
              <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">
                Mandato activo
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[#9C8578]">
              <MapPin className="h-4 w-4" />
              <span>
                {property.address}, {property.commune}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
            <Link href={`/broker/propiedades/${property.id}/inspecciones`}>
              <Calendar className="mr-2 h-4 w-4" />
              Inspecciones
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#D5C3B6]/20 text-[#FAF6F2] hover:bg-[#D5C3B6]/10">
            <Link href={`/broker/propiedades/${property.id}/reajustes`}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Reajuste IPC
            </Link>
          </Button>
        </div>
      </div>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,420px)] xl:items-start">
            <div className="space-y-4 xl:pr-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#5E8B8C]/15 p-2.5">
                  <ShieldCheck className="h-5 w-5 text-[#5E8B8C]" />
                </div>
                <div>
                  <p className="text-base font-medium text-[#FAF6F2]">
                    Panel operativo del corredor
                  </p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#9C8578]">
                    Aquí concentras seguimiento, coordinación y control operativo de la propiedad.
                    La alta de propiedades, nuevas aprobaciones y decisiones reservadas siguen del lado del arrendador.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/45 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#9C8578]">
                    En este mandato sí operas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={brokerScopeBadgeClass.OPERATE}>Inspecciones</Badge>
                    <Badge className={brokerScopeBadgeClass.OPERATE}>Reajuste IPC</Badge>
                    <Badge className={brokerScopeBadgeClass.TRACK}>Seguimiento operativo</Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/45 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#9C8578]">
                    Reservado al arrendador
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={brokerScopeBadgeClass.READ_ONLY}>Confirmación de pagos</Badge>
                    <Badge className={brokerScopeBadgeClass.READ_ONLY}>Carga y firma de contratos</Badge>
                    <Badge className={brokerScopeBadgeClass.READ_ONLY}>Aprobaciones nuevas</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917] px-4 py-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#9C8578]">
                    {card.label}
                  </p>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold leading-tight text-[#FAF6F2] xl:text-xl">
                      {card.value}
                    </p>
                    <p className="text-xs leading-5 text-[#9C8578]">{card.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_380px]">
        <div className="space-y-6">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#FAF6F2]">
                <Building2 className="h-5 w-5 text-[#5E8B8C]" />
                Resumen de la propiedad
              </CardTitle>
              <CardDescription className="text-[#9C8578]">
                Información compartida con el arrendador, enfocada en operación y seguimiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-[#9C8578]">Descripción</p>
                  <p className="mt-1 text-[#FAF6F2]">
                    {property.description || "Sin descripción registrada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#9C8578]">Contrato</p>
                  <p className="mt-1 text-[#FAF6F2]">
                    {formatDate(property.contractStart)} al {formatDate(property.contractEnd)}
                  </p>
                  {property.monthlyRentUF ? (
                    <p className="mt-1 text-sm text-[#9C8578]">
                      Canon en UF: UF {property.monthlyRentUF.toFixed(2)}
                    </p>
                  ) : null}
                </div>
              </div>

              {property.contractStart && property.contractEnd ? (
                <ContractProgressChart
                  startDate={property.contractStart}
                  endDate={property.contractEnd}
                  size="large"
                />
              ) : null}

              {property.lat != null && property.lng != null ? (
                <div className="overflow-hidden rounded-xl border border-[#D5C3B6]/10">
                  <PropertyMiniMap
                    lat={property.lat}
                    lng={property.lng}
                    address={`${property.address}, ${property.commune}`}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#FAF6F2]">
                <Users className="h-5 w-5 text-[#5E8B8C]" />
                Personas clave
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-[#1C1917] p-4">
                <p className="text-xs uppercase tracking-wide text-[#9C8578]">Propietario</p>
                <p className="mt-2 font-semibold text-[#FAF6F2]">
                  {property.landlord?.name || "Sin nombre"}
                </p>
                <div className="mt-3 space-y-2 text-sm text-[#D5C3B6]">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#5E8B8C]" />
                    {property.landlord?.email || "Sin correo"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#5E8B8C]" />
                    {property.landlord?.phone || "Sin teléfono"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#1C1917] p-4">
                <p className="text-xs uppercase tracking-wide text-[#9C8578]">Arrendatario</p>
                {property.tenant ? (
                  <>
                    <p className="mt-2 font-semibold text-[#FAF6F2]">{property.tenant.name}</p>
                    <div className="mt-3 space-y-2 text-sm text-[#D5C3B6]">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#5E8B8C]" />
                        {property.tenant.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#5E8B8C]" />
                        {property.tenant.phone || "Sin teléfono"}
                      </p>
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#5E8B8C]" />
                        {tenantIdentity?.value || "Sin documento"}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-[#9C8578]">Sin arrendatario asignado</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#FAF6F2]">
                <Wrench className="h-5 w-5 text-[#5E8B8C]" />
                Mantenciones activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property.maintenance.length === 0 ? (
                <p className="text-sm text-[#9C8578]">No hay mantenciones abiertas.</p>
              ) : (
                <div className="space-y-3">
                  {property.maintenance.map((maintenance) => {
                    const status =
                      maintenanceStatusConfig[maintenance.status] ?? {
                        label: maintenance.status,
                        className: "bg-[#9C8578]/15 text-[#D5C3B6]",
                      }

                    return (
                      <div
                        key={maintenance.id}
                        className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-medium text-[#FAF6F2]">
                              {maintenance.description}
                            </p>
                            <p className="mt-1 text-sm text-[#9C8578]">
                              {maintenance.category} • abierta desde {formatDate(maintenance.createdAt)}
                            </p>
                          </div>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#FAF6F2]">
                <Users className="h-5 w-5 text-[#5E8B8C]" />
                Proveedores asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property.providers.length === 0 ? (
                <p className="text-sm text-[#9C8578]">
                  Esta propiedad aún no tiene proveedores vinculados.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {property.providers.map(({ provider }) => (
                    <div
                      key={provider.id}
                      className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4"
                    >
                      <p className="font-medium text-[#FAF6F2]">{provider.name}</p>
                      <p className="mt-1 text-sm text-[#9C8578]">{provider.specialty}</p>
                      <div className="mt-3 space-y-2 text-sm text-[#D5C3B6]">
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#5E8B8C]" />
                          {provider.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#5E8B8C]" />
                          {provider.email || "Sin correo"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card id="gestion" className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="text-[#FAF6F2]">Acciones del corredor</CardTitle>
              <CardDescription className="text-[#9C8578]">
                Accesos que sí puedes operar desde tu mandato activo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                <Link href={`/broker/propiedades/${property.id}/inspecciones`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Gestionar inspecciones
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#D5C3B6]/20 text-[#FAF6F2] hover:bg-[#D5C3B6]/10">
                <Link href={`/broker/propiedades/${property.id}/reajustes`}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Gestionar reajustes
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#D5C3B6]/20 text-[#FAF6F2] hover:bg-[#D5C3B6]/10">
                <Link href="/broker/calendario">
                  <Calendar className="mr-2 h-4 w-4" />
                  Abrir calendario del corredor
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-[#D5C3B6] hover:bg-[#D5C3B6]/10">
                <Link href="/broker/mandatos">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ver mandato y relación
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="text-[#FAF6F2]">Alcance por módulo</CardTitle>
              <CardDescription className="text-[#9C8578]">
                Qué administras directamente y qué queda como consulta o seguimiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 text-[#5E8B8C]" />
                    <div>
                      <p className="font-medium text-[#FAF6F2]">Inspecciones</p>
                      <p className="text-sm text-[#9C8578]">Programas, confirmas y revisas la agenda operativa.</p>
                    </div>
                  </div>
                  <Badge className={brokerScopeBadgeClass.OPERATE}>Opera</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-4 w-4 text-[#5E8B8C]" />
                    <div>
                      <p className="font-medium text-[#FAF6F2]">Reajuste IPC</p>
                      <p className="text-sm text-[#9C8578]">Gestionas el calendario y aplicación del reajuste del canon.</p>
                    </div>
                  </div>
                  <Badge className={brokerScopeBadgeClass.OPERATE}>Opera</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 h-4 w-4 text-[#F2C94C]" />
                    <div>
                      <p className="font-medium text-[#FAF6F2]">Pagos</p>
                      <p className="text-sm text-[#9C8578]">Ves el estado y el historial, pero la confirmación final queda en el panel del arrendador.</p>
                    </div>
                  </div>
                  <Badge className={brokerScopeBadgeClass.READ_ONLY}>Consulta</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Wrench className="mt-0.5 h-4 w-4 text-[#F2C94C]" />
                    <div>
                      <p className="font-medium text-[#FAF6F2]">Mantenciones</p>
                      <p className="text-sm text-[#9C8578]">Haces seguimiento operativo, pero los cambios de estado y decisiones finales siguen acotados.</p>
                    </div>
                  </div>
                  <Badge className={brokerScopeBadgeClass.TRACK}>Seguimiento</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 text-[#D5C3B6]" />
                    <div>
                      <p className="font-medium text-[#FAF6F2]">Contratos</p>
                      <p className="text-sm text-[#9C8578]">Consultas vigencia y contexto del arriendo, sin cargar ni firmar documentos desde aquí.</p>
                    </div>
                  </div>
                  <Badge className={brokerScopeBadgeClass.READ_ONLY}>Consulta</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#FAF6F2]">
                <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
                Estado financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-[#1C1917] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#9C8578]">
                      {currentPayment ? formatMonth(currentPayment.month, currentPayment.year) : "Mes actual"}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[#FAF6F2]">
                      {currentPayment ? formatCurrency(currentPayment.amountCLP) : "Sin registro"}
                    </p>
                  </div>
                  <Badge className={currentPaymentStatus.className}>
                    {currentPaymentStatus.label}
                  </Badge>
                </div>
              </div>

              {property.payments.length > 0 ? (
                <div className="space-y-2">
                  {property.payments.map((payment) => {
                    const status =
                      paymentStatusConfig[payment.status] ?? {
                        label: payment.status,
                        className: "bg-[#9C8578] text-white",
                      }

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#FAF6F2]">
                            {formatMonth(payment.month, payment.year)}
                          </p>
                          <p className="text-sm text-[#9C8578]">
                            {formatCurrency(payment.amountCLP)}
                          </p>
                        </div>
                        <Badge className={status.className}>{status.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#9C8578]">Aún no hay pagos cargados.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="text-[#FAF6F2]">Mandato y próximas fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-[#1C1917] p-4">
                <p className="text-xs uppercase tracking-wide text-[#9C8578]">Mandato</p>
                <p className="mt-2 font-semibold text-[#FAF6F2]">
                  {activeMandate?.broker.name || session.user.name || session.user.email}
                </p>
                <p className="mt-1 text-sm text-[#9C8578]">
                  Vigente desde {formatDate(activeMandate?.startsAt)} hasta {formatDate(activeMandate?.expiresAt)}
                </p>
                {activeMandate?.notes ? (
                  <p className="mt-3 text-sm text-[#D5C3B6]">{activeMandate.notes}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#9C8578]">Próxima inspección</p>
                  <p className="mt-2 text-sm font-medium text-[#FAF6F2]">
                    {nextInspection
                      ? `${inspectionTypeLabels[nextInspection.type] || nextInspection.type} • ${formatDate(nextInspection.scheduledAt)}`
                      : "Sin inspecciones programadas"}
                  </p>
                  {nextInspection ? (
                    <p className="mt-1 text-sm text-[#9C8578]">
                      Estado: {inspectionStatusLabels[nextInspection.status] || nextInspection.status}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#9C8578]">Próximo IPC</p>
                  <p className="mt-2 text-sm font-medium text-[#FAF6F2]">
                    {formatDate(property.nextIpcDate)}
                  </p>
                  <p className="mt-1 text-sm text-[#9C8578]">
                    Frecuencia configurada: {property.ipcAdjustmentMonths || "No definida"} meses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="text-[#FAF6F2]">Servicios del último período</CardTitle>
            </CardHeader>
            <CardContent>
              {latestService ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#9C8578]">
                    Último período cargado: {formatMonth(latestService.month, latestService.year)}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#1C1917] p-3">
                      <p className="text-xs text-[#9C8578]">Agua</p>
                      <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.water)}</p>
                    </div>
                    <div className="rounded-xl bg-[#1C1917] p-3">
                      <p className="text-xs text-[#9C8578]">Luz</p>
                      <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.electricity)}</p>
                    </div>
                    <div className="rounded-xl bg-[#1C1917] p-3">
                      <p className="text-xs text-[#9C8578]">Gas</p>
                      <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.gas)}</p>
                    </div>
                    <div className="rounded-xl bg-[#1C1917] p-3">
                      <p className="text-xs text-[#9C8578]">Gasto común</p>
                      <p className="mt-1 font-semibold text-[#FAF6F2]">
                        {formatCurrency(latestService.commonExpenses)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#1C1917] p-3">
                      <p className="text-xs text-[#9C8578]">Basura</p>
                      <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.garbage)}</p>
                    </div>
                    <div className="rounded-xl bg-[#1C1917] p-3">
                      <p className="text-xs text-[#9C8578]">
                        {latestService.otherLabel || "Otro"}
                      </p>
                      <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.other)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#9C8578]">
                  Aún no hay servicios mensuales registrados para esta propiedad.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
