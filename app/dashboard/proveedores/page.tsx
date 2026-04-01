import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Plus,
  Phone,
  Mail,
  Wrench,
  Star,
  Edit2,
  Trash2,
  User
} from "lucide-react"
import Link from "next/link"

interface Provider {
  id: string
  name: string
  specialty?: string | null
  phone?: string | null
  email?: string | null
  rating?: number | null
  jobsCompleted: number
  description?: string | null
}

const specialtyColors: Record<string, string> = {
  "Plomería": "bg-blue-500/20 text-blue-700",
  "Electricidad": "bg-yellow-500/20 text-yellow-700",
  "Estructura": "bg-orange-500/20 text-orange-700",
  "Cerrajería": "bg-purple-500/20 text-purple-700",
  "Limpieza": "bg-green-500/20 text-green-700",
}

export default async function ProveedoresPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD") redirect("/dashboard")

  // Get all providers for this landlord
  const providers = (await prisma.provider.findMany({
    where: {
      landlordId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      specialty: true,
      phone: true,
      email: true,
      description: true,
      _count: {
        select: {
          maintenanceRequests: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as Array<Provider & { _count: { maintenanceRequests: number } }>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proveedores de Confianza</h1>
          <p className="text-muted-foreground">Administra tu red de proveedores verificados</p>
        </div>
        <Button 
          className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
          asChild
        >
          <Link href="/dashboard/proveedores/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Agregar proveedor
          </Link>
        </Button>
      </div>

      {/* Providers Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {providers.length === 0 ? (
          <Card className="bg-card border-border md:col-span-2">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No tienes proveedores registrados aún</p>
            </CardContent>
          </Card>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#2D3C3C] flex items-center justify-center flex-shrink-0">
                    <User className="h-7 w-7 text-[#D5C3B6]/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground truncate">{provider.name}</h3>
                        {provider.specialty && (
                          <Badge className={specialtyColors[provider.specialty] || "bg-muted text-muted-foreground"}>
                            {provider.specialty}
                          </Badge>
                        )}
                      </div>
                      {provider.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-[#F2C94C] fill-[#F2C94C]" />
                          <span className="text-sm font-medium text-foreground">{provider.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    {provider.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {provider.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      {provider.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {provider.phone}
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {provider.email}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                        {provider._count.maintenanceRequests} trabajos
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-foreground"
                          asChild
                        >
                          <Link href={`/dashboard/proveedores/${provider.id}/editar`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-[#C27F79]"
                          disabled
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
