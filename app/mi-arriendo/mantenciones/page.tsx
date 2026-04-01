import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Wrench, 
  Plus,
  Clock,
  Check,
  X,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react"
import Link from "next/link"

interface MaintenanceRequest {
  id: string
  category: string
  description: string
  status: string
  legalResponsibility: string
  createdAt: Date
  completedAt?: Date | null
  photos: string[]
  provider?: {
    name: string
  } | null
}

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

const legalInfo: Record<string, string> = {
  Plomería: "Según la Ley 18.101, las reparaciones de cañerías e instalaciones sanitarias son responsabilidad del arrendador.",
  Electricidad: "Las instalaciones eléctricas fijas son responsabilidad del arrendador según la Ley 18.101.",
  Estructura: "Daños estructurales y reparaciones mayores corresponden al arrendador.",
  Otro: "La responsabilidad dependerá del tipo de reparación y su origen.",
}

export default async function TenantMantencionesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "TENANT") redirect("/mi-arriendo")

  // Get tenant's property
  const tenant = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { propertyId: true },
  })

  if (!tenant?.propertyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mantenciones</h1>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No tienes una propiedad asignada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get maintenance requests for tenant's property
  const requests = (await prisma.maintenanceRequest.findMany({
    where: {
      propertyId: tenant.propertyId,
      requestedByTenant: true,
    },
    include: {
      provider: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as MaintenanceRequest[]

  const activeRequests = requests.filter(r => r.status !== "COMPLETED" && r.status !== "REJECTED")
  const completedRequests = requests.filter(r => r.status === "COMPLETED" || r.status === "REJECTED")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mantenciones</h1>
          <p className="text-muted-foreground">Reporta fallas y sigue el estado de tus solicitudes</p>
        </div>
        <Button 
          className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
          asChild
        >
          <Link href="/mi-arriendo/mantenciones/reportar">
            <Plus className="h-4 w-4 mr-2" />
            Reportar falla
          </Link>
        </Button>
      </div>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Solicitudes Activas</h2>
          {activeRequests.map((request) => {
            const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.REQUESTED
            const StatusIcon = status.icon
            return (
              <Card key={request.id} className="bg-card border-border border-l-4 border-l-[#F2C94C]">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={status.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="border-border text-foreground">
                          {request.category}
                        </Badge>
                      </div>
                      <p className="text-foreground mb-2">{request.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Reportado: {request.createdAt.toLocaleDateString("es-CL")}</span>
                        {request.photos && request.photos.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4" />
                            {request.photos.length} foto(s)
                          </span>
                        )}
                      </div>
                      {request.provider && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Proveedor asignado:</p>
                          <p className="font-medium text-foreground">{request.provider.name}</p>
                        </div>
                      )}

                      <div className="mt-3 p-3 rounded-lg bg-[#5E8B8C]/10 border border-[#5E8B8C]/30">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-[#5E8B8C] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Información legal</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {legalInfo[request.category] || legalInfo.Otro}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={request.legalResponsibility === "LANDLORD" 
                        ? "border-[#75524C] text-[#75524C]" 
                        : "border-[#5E8B8C] text-[#5E8B8C]"
                      }
                    >
                      {request.legalResponsibility === "LANDLORD" 
                        ? "Resp. Arrendador" 
                        : "Resp. Arrendatario"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Historial de Mantenciones</CardTitle>
        </CardHeader>
        <CardContent>
          {completedRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay mantenciones completadas aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      request.status === "COMPLETED" 
                        ? "bg-[#5E8B8C]/20" 
                        : "bg-[#C27F79]/20"
                    }`}>
                      {request.status === "COMPLETED" ? (
                        <Check className="h-5 w-5 text-[#5E8B8C]" />
                      ) : (
                        <X className="h-5 w-5 text-[#C27F79]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{request.category}</p>
                        <Badge className={request.status === "COMPLETED" 
                          ? "bg-[#5E8B8C] text-white text-xs" 
                          : "bg-[#C27F79] text-white text-xs"
                        }>
                          {request.status === "COMPLETED" ? "Completado" : "Rechazado"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {request.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.status === "COMPLETED" 
                          ? `Completado: ${request.completedAt?.toLocaleDateString("es-CL")}`
                          : `Rechazado: ${request.completedAt?.toLocaleDateString("es-CL")}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
