import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import type { MaintenanceStatus, Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Wrench, 
  Building2,
  User,
  Calendar,
  Check,
  X,
  Clock,
  Image as ImageIcon
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
    label: "Solicitado", 
    className: "bg-[#D5C3B6] text-[#2D3C3C]",
    icon: Clock
  },
  REQUESTED_INFO: { 
    label: "Solicitar info", 
    className: "bg-[#F2C94C] text-[#2D3C3C]",
    icon: Clock
  },
  APPROVED: { 
    label: "Aprobado", 
    className: "bg-[#5E8B8C]/70 text-white",
    icon: Check
  },
  IN_PROGRESS: { 
    label: "En ejecución", 
    className: "bg-[#F2C94C] text-[#2D3C3C]",
    icon: Wrench
  },
  COMPLETED: { 
    label: "Completado", 
    className: "bg-[#5E8B8C] text-white",
    icon: Check
  },
  REJECTED: { 
    label: "Rechazado", 
    className: "bg-[#C27F79] text-white",
    icon: X
  }
}

const categoryIcons: Record<string, string> = {
  "Plomería": "🔧",
  "Electricidad": "⚡",
  "Estructura": "🏠",
  "Otro": "📋"
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
  searchParams: Promise<{ status?: string; property?: string }>
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
    },
    include: maintenanceInclude,
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mantenciones</h1>
        <p className="text-muted-foreground">Gestiona las solicitudes de mantención de tus propiedades</p>
        {filterProperty && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-foreground">
              Filtrado por:{" "}
              <strong>{filterProperty.name || filterProperty.address}</strong>
            </span>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <a href={mantencionesQueryHref(statusFilter)}>Quitar filtro de propiedad</a>
            </Button>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <a href={`/dashboard/propiedades/${filterProperty.id}`}>Ir al detalle</a>
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <form className="grid gap-4 md:grid-cols-3" action="/dashboard/mantenciones" method="GET">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-muted-foreground" htmlFor="property">
                Propiedad
              </label>
              <select
                id="property"
                name="property"
                defaultValue={filterPropertyId ?? ""}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="">Todas</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.address}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="status">
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="all">Todos</option>
                <option value="REQUESTED">Solicitadas</option>
                <option value="APPROVED">Aprobadas</option>
                <option value="IN_PROGRESS">En ejecución</option>
                <option value="COMPLETED">Completadas</option>
                <option value="REJECTED">Rechazadas</option>
              </select>
            </div>
            <div className="md:col-span-3 flex gap-3 pt-1">
              <Button type="submit" className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90">
                Aplicar filtros
              </Button>
              {(filterPropertyId || statusFilter !== "all") && (
                <Button variant="outline" className="border-border" asChild>
                  <a href="/dashboard/mantenciones">Limpiar</a>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-6">
                <Wrench className="h-12 w-12 text-[#5E8B8C]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#FAF6F2] mb-3">
                Sin mantenciones activas
              </h3>
              <p className="text-[#9C8578] mb-8 max-w-md mx-auto">
                ¡Todo en orden! Aquí verás los reportes de fallas cuando sean enviados.
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.REQUESTED
            const StatusIcon = status.icon
            const icon = categoryIcons[request.category] || "📋"

            return (
              <Card key={request.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#2D3C3C] flex items-center justify-center text-2xl">
                        {icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">
                          {request.category}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                  <p className="text-foreground">{request.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      {request.property.tenant?.name || "Sin arrendatario"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {request.createdAt.toLocaleDateString("es-CL")}
                    </div>
                    {request.photos && request.photos.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        {request.photos.length} foto(s)
                      </div>
                    )}
                  </div>

                  {request.status === "IN_PROGRESS" && request.provider && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Proveedor asignado:</p>
                      <p className="font-medium text-foreground">{request.provider.name}</p>
                    </div>
                  )}

                  {request.status === "REQUESTED" && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
                        disabled
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprobar (pronto)
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-foreground border-border"
                        disabled
                      >
                        Rechazar (pronto)
                      </Button>
                    </div>
                  )}

                  {request.status === "APPROVED" && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
                        disabled
                      >
                        Asignar proveedor (pronto)
                      </Button>
                    </div>
                  )}

                  {request.status === "IN_PROGRESS" && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
                        disabled
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Marcar completado (pronto)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
