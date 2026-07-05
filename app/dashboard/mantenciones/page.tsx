import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import type { MaintenanceStatus, Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { NativeSelect } from "@/components/ui/native-select"
import { SearchFilter } from "@/components/ui/search-filter"
import { MaintenanceStatusActions } from "@/components/maintenance/maintenance-status-actions"
import { maintenanceStatusConfig } from "@/lib/status-config"
import {
  Wrench, 
  Building2,
  User,
  Calendar,
  Check,
  X,
  Clock,
  Image as ImageIcon,
  Home,
  FileText,
  Zap,
} from "lucide-react"
import { formatDateCompact } from "@/lib/utils"

const MAX_MAINTENANCE_RESULTS = 100

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

const statusConfig = {
  REQUESTED: {
    ...maintenanceStatusConfig.REQUESTED,
    icon: Clock,
  },
  REVIEWING: {
    ...maintenanceStatusConfig.REVIEWING,
    icon: Clock,
  },
  REQUESTED_INFO: {
    ...maintenanceStatusConfig.REQUESTED_INFO,
    icon: Clock,
  },
  APPROVED: {
    ...maintenanceStatusConfig.APPROVED,
    icon: Check,
  },
  IN_PROGRESS: {
    ...maintenanceStatusConfig.IN_PROGRESS,
    icon: Wrench,
  },
  COMPLETED: {
    ...maintenanceStatusConfig.COMPLETED,
    icon: Check,
  },
  REJECTED: {
    ...maintenanceStatusConfig.REJECTED,
    icon: X,
  },
}

const categoryConfig: Record<string, { icon: JSX.Element; label: string }> = {
  PLUMBING: { icon: <Wrench />, label: "Plomería" },
  ELECTRICAL: { icon: <Zap />, label: "Electricidad" },
  STRUCTURAL: { icon: <Home />, label: "Estructura" },
  APPLIANCES: { icon: <ImageIcon />, label: "Electrodomésticos" },
  CLEANING: { icon: <FileText />, label: "Limpieza" },
  OTHER: { icon: <FileText />, label: "Otro" },
}

function mantencionesQueryHref(status: string, propertyId?: string) {
  const q = new URLSearchParams()
  if (propertyId) q.set("property", propertyId)
  if (status !== "all") q.set("status", status)
  const s = q.toString()
  return `/dashboard/mantenciones${s ? `?${s}` : ""}`
}

export default async function MantencionesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; property?: string; q?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role === "BROKER") {
    redirect("/broker")
  }
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const sp = await searchParams
  const statusFilter = sp.status || "all"
  const filterPropertyId = sp.property?.trim() || undefined
  const q = sp.q?.trim()
  const normalizedStatusFilter =
    statusFilter !== "all" ? (statusFilter.toUpperCase() as MaintenanceStatus) : undefined

  const filterProperty =
    filterPropertyId != null && filterPropertyId !== ""
      ? await prisma.property.findFirst({
          where: { id: filterPropertyId, landlordId: session.user.id },
          select: { id: true, name: true, address: true },
        })
      : null

  if (filterPropertyId && !filterProperty) {
    redirect("/dashboard/mantenciones")
  }

  const properties = await prisma.property.findMany({
    where: { landlordId: session.user.id, isActive: true },
    select: { id: true, name: true, address: true },
    orderBy: { createdAt: "desc" },
  })

  // Get maintenance requests for all properties of current landlord
  const requests: MaintenanceWithProperty[] = await prisma.maintenanceRequest.findMany({
    where: {
      property: {
        landlordId: session.user.id,
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
    take: MAX_MAINTENANCE_RESULTS,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <PageHeader
          title="Mantenciones"
          description="Gestiona las solicitudes de mantención de tus propiedades"
        />
        {filterProperty && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#D5C3B6]/10 bg-[#2D3C3C] px-4 py-3 text-sm">
            <span className="text-[#FAF6F2]">
              Filtrado por:{" "}
              <strong>{filterProperty.name || filterProperty.address}</strong>
            </span>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
              <a href={mantencionesQueryHref(statusFilter)}>Quitar filtro de propiedad</a>
            </Button>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
              <a href={`/dashboard/propiedades/${filterProperty.id}`}>Ir al detalle</a>
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2A2520] p-4">
        <div className="mb-4">
          <SearchFilter placeholder="Buscar por descripcion, propiedad o arrendatario..." />
        </div>
        <form className="grid gap-3 sm:grid-cols-3" action="/dashboard/mantenciones" method="GET">
          {q ? <input type="hidden" name="q" value={q} /> : null}
          <div className="sm:col-span-2">
            <NativeSelect label="Propiedad" name="property" id="property" defaultValue={filterPropertyId ?? ""}>
              <option value="">Todas las propiedades</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.address}
                </option>
              ))}
            </NativeSelect>
          </div>
          <NativeSelect label="Estado" name="status" id="status" defaultValue={statusFilter}>
            <option value="all">Todos los estados</option>
            <option value="REQUESTED">Solicitadas</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="IN_PROGRESS">En ejecución</option>
            <option value="COMPLETED">Completadas</option>
            <option value="REJECTED">Rechazadas</option>
          </NativeSelect>
          <div className="flex gap-3 sm:col-span-3 sm:justify-end">
            <button
              type="submit"
              className="rounded-lg bg-[#5E8B8C] px-4 py-2 text-sm font-medium text-[#FAF6F2] transition-colors hover:bg-[#5E8B8C]/90"
            >
              Aplicar filtros
            </button>
            {(filterPropertyId || statusFilter !== "all" || q) && (
              <Button variant="outline" className="border-[#D5C3B6]/15 text-[#D5C3B6]" asChild>
                <a href="/dashboard/mantenciones">Limpiar</a>
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === MAX_MAINTENANCE_RESULTS && (
          <div className="rounded-lg border border-[#F2C94C]/20 bg-[#F2C94C]/10 px-4 py-3 text-sm text-[#D5C3B6]">
            Mostrando las 100 mantenciones más recientes. Aplica filtros para acotar el historial.
          </div>
        )}
        {requests.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#5E8B8C]/10 flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-6 w-6 text-[#5E8B8C]/50" />
              </div>
              <h3 className="text-lg font-medium text-[#FAF6F2] mb-2">
                Sin mantenciones activas
              </h3>
              <p className="text-sm text-[#9C8578] max-w-sm mx-auto">
                ¡Todo en orden! Aquí verás los reportes de fallas cuando sean enviados.
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.REQUESTED
            const StatusIcon = status.icon
            const category = categoryConfig[request.category] || categoryConfig.OTHER

            return (
              <Card key={request.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#D5C3B6]/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#2D3C3C] flex items-center justify-center text-xl">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-[#FAF6F2]">
                          {category.label}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-[#9C8578]">
                          <Building2 className="h-4 w-4" />
                          {request.property.address}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.className}>
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
                      <User className="h-4 w-4" />
                      {request.property.tenant?.name || "Sin arrendatario"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDateCompact(request.createdAt)}
                    </div>
                    {request.photos && request.photos.length > 0 && (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {request.photos.length} foto(s)
                      </div>
                    )}
                  </div>

                  {request.photos && request.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {request.photos.map((photo) => (
                        <a key={photo} href={photo} target="_blank" rel="noopener noreferrer" className="block">
                          <img
                            src={photo}
                            alt="Foto de mantención"
                            className="h-20 w-20 rounded-lg border border-[#D5C3B6]/10 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {request.status === "IN_PROGRESS" && request.provider && (
                    <div className="bg-[#1C1917]/60 border border-[#D5C3B6]/10 rounded-lg p-3">
                      <p className="text-xs text-[#9C8578]">Proveedor asignado:</p>
                      <p className="text-sm font-medium text-[#FAF6F2]">{request.provider.name}</p>
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
