import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import type { MaintenanceStatus, Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchFilter } from "@/components/ui/search-filter"
import { MaintenanceStatusActions } from "@/components/maintenance/maintenance-status-actions"
import { maintenanceStatus } from "@/lib/broker-design"
import {
  Wrench,
  Building2,
  User,
  Calendar,
  Check,
  X,
  Clock,
  Image as ImageIcon,
} from "lucide-react"

const maintenanceInclude = {
  property: {
    select: {
      id: true,
      address: true,
      tenant: {
        select: {
          name: true,
        },
      },
      providers: {
        include: {
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
  provider: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.MaintenanceRequestInclude

type MaintenanceWithProperty = Prisma.MaintenanceRequestGetPayload<{
  include: typeof maintenanceInclude
}>

const statusIcons = {
  REQUESTED: Clock,
  REVIEWING: Clock,
  APPROVED: Check,
  IN_PROGRESS: Wrench,
  COMPLETED: Check,
  REJECTED: X,
} as const

const categoryConfig: Record<string, { icon: string; label: string }> = {
  PLUMBING: { icon: "🔧", label: "Plomería" },
  ELECTRICAL: { icon: "⚡", label: "Electricidad" },
  STRUCTURAL: { icon: "🏠", label: "Estructura" },
  APPLIANCES: { icon: "🧺", label: "Electrodomésticos" },
  CLEANING: { icon: "🧼", label: "Limpieza" },
  OTHER: { icon: "📋", label: "Otro" },
}

function mantencionesQueryHref(status: string, propertyId?: string, qParam?: string) {
  const qs = new URLSearchParams()
  if (propertyId) qs.set("property", propertyId)
  if (status !== "all") qs.set("status", status)
  if (qParam) qs.set("q", qParam)
  const s = qs.toString()
  return `/broker/mantenciones${s ? `?${s}` : ""}`
}

export default async function BrokerMantencionesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; property?: string; q?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/dashboard")
  }

  const sp = await searchParams
  const statusFilter = sp.status || "all"
  const filterPropertyId = sp.property?.trim() || undefined
  const q = sp.q?.trim()
  const normalizedStatusFilter =
    statusFilter !== "all" ? (statusFilter.toUpperCase() as MaintenanceStatus) : undefined

  const basePropertyWhere =
    session.user.role === "BROKER"
      ? {
          OR: [
            { managedBy: session.user.id },
            {
              mandates: {
                some: {
                  brokerId: session.user.id,
                  status: "ACTIVE" as const,
                },
              },
            },
          ],
        }
      : {
          managedBy: session.user.id,
        }

  const filterProperty =
    filterPropertyId != null && filterPropertyId !== ""
      ? await prisma.property.findFirst({
          where: { id: filterPropertyId, ...basePropertyWhere },
          select: { id: true, name: true, address: true },
        })
      : null

  if (filterPropertyId && !filterProperty) {
    redirect("/broker/mantenciones")
  }

  const properties = await prisma.property.findMany({
    where: {
      ...basePropertyWhere,
      isActive: true,
    },
    select: { id: true, name: true, address: true },
    orderBy: { createdAt: "desc" },
  })

  const activeMaintenanceCount = await prisma.maintenanceRequest.count({
    where: {
      property: basePropertyWhere,
      status: { notIn: ["COMPLETED", "REJECTED"] },
    },
  })

  const requests: MaintenanceWithProperty[] = await prisma.maintenanceRequest.findMany({
    where: {
      property: {
        ...basePropertyWhere,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
      ...(normalizedStatusFilter ? { status: normalizedStatusFilter } : {}),
      ...(q
        ? {
            OR: [
              { description: { contains: q, mode: "insensitive" } },
              { property: { address: { contains: q, mode: "insensitive" } } },
              { property: { tenant: { name: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: maintenanceInclude,
    orderBy: {
      createdAt: "desc",
    },
  })

  const statusTabs = [
    { id: "all", label: "Todos" },
    { id: "REQUESTED", label: "Solicitadas" },
    { id: "REVIEWING", label: "En revisión" },
    { id: "APPROVED", label: "Aprobadas" },
    { id: "IN_PROGRESS", label: "En ejecución" },
    { id: "COMPLETED", label: "Completadas" },
    { id: "REJECTED", label: "Rechazadas" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Mantenciones</h1>
          <p className="text-sm text-[#9C8578] mt-0.5">
            Solicitudes de reparación de tus propiedades administradas
          </p>
        </div>
        {activeMaintenanceCount > 0 && (
          <span className="text-sm text-[#9C8578] shrink-0">{activeMaintenanceCount} solicitud(es)</span>
        )}
      </div>

      {filterProperty && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917]/40 px-4 py-3 text-sm">
          <span className="text-[#FAF6F2]">
            Filtrado por: <strong>{filterProperty.name || filterProperty.address}</strong>
          </span>
          <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10" asChild>
            <a href={mantencionesQueryHref(statusFilter, undefined, q)}>Quitar filtro de propiedad</a>
          </Button>
          <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10" asChild>
            <a href={`/broker/propiedades/${filterProperty.id}`}>Ir al detalle</a>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const active = statusFilter === tab.id
          return (
            <Link
              key={tab.id}
              href={mantencionesQueryHref(tab.id, filterPropertyId, q)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                active ? "bg-[#5E8B8C]/20 text-[#5E8B8C]" : "text-[#9C8578] hover:text-[#D5C3B6]"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-4">
          <div className="mb-4">
            <SearchFilter placeholder="Buscar por descripcion, propiedad o arrendatario..." />
          </div>
          <form className="grid gap-3 sm:grid-cols-3" action="/broker/mantenciones" method="GET">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#9C8578] uppercase tracking-wider" htmlFor="property">Propiedad</label>
              <select
                id="property"
                name="property"
                defaultValue={filterPropertyId ?? ""}
                className="w-full rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2.5 text-sm text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]"
              >
                <option value="">Todas las propiedades</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.address}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9C8578] uppercase tracking-wider" htmlFor="status">Estado</label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2.5 text-sm text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]"
              >
                <option value="all">Todos</option>
                <option value="REQUESTED">Solicitadas</option>
                <option value="REVIEWING">En revisión</option>
                <option value="APPROVED">Aprobadas</option>
                <option value="IN_PROGRESS">En ejecución</option>
                <option value="COMPLETED">Completadas</option>
                <option value="REJECTED">Rechazadas</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-2 pt-1">
              <button type="submit"
                className="rounded-lg bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] px-4 py-2 text-sm font-medium transition-colors">
                Aplicar
              </button>
              {(filterPropertyId || statusFilter !== "all" || q) && (
                <a href="/broker/mantenciones"
                  className="rounded-lg border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/5 px-4 py-2 text-sm font-medium transition-colors">
                  Limpiar
                </a>
              )}
            </div>
          </form>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#5E8B8C]/10 flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-6 w-6 text-[#5E8B8C]/50" />
              </div>
              <h3 className="text-lg font-medium text-[#FAF6F2] mb-2">
                Sin mantenciones activas
              </h3>
              <p className="text-sm text-[#9C8578] max-w-md mx-auto">
                Cuando un arrendatario reporte una falla o necesites coordinar un trabajo, lo verás aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const status = maintenanceStatus[request.status as keyof typeof maintenanceStatus] ?? maintenanceStatus.REQUESTED
            const StatusIcon = statusIcons[request.status as keyof typeof statusIcons] ?? Clock
            const category = categoryConfig[request.category] || categoryConfig.OTHER

            return (
              <Card key={request.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#D5C3B6]/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#1C1917] flex items-center justify-center text-xl">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-[#FAF6F2]">
                          {category.label}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-[#9C8578]">
                          <Building2 className="h-4 w-4 shrink-0" />
                          {request.property.address}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.badge}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={request.isLandlordResp
                          ? "border-[#75524C] text-[#75524C]"
                          : "border-[#5E8B8C] text-[#5E8B8C]"
                        }
                      >
                        {request.isLandlordResp ? "Arrendador" : "Arrendatario"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#FAF6F2]">{request.description}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#9C8578]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0" />
                      {request.property.tenant?.name || "Sin arrendatario"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {request.createdAt.toLocaleDateString("es-CL")}
                    </div>
                    {request.photos && request.photos.length > 0 && (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 shrink-0" />
                        {request.photos.length} foto(s)
                      </div>
                    )}
                  </div>

                  {request.status === "IN_PROGRESS" && request.provider && (
                    <div className="rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917]/60 p-3">
                      <p className="text-xs text-[#9C8578]">Proveedor asignado:</p>
                      <p className="font-medium text-[#FAF6F2]">{request.provider.name}</p>
                    </div>
                  )}

                  <MaintenanceStatusActions
                    requestId={request.id}
                    currentStatus={request.status}
                    providers={request.property.providers.map((item) => item.provider)}
                  />
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
