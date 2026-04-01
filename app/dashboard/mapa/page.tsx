import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PropertyMap } from "@/components/dashboard/property-map"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, TrendingUp, TrendingDown } from "lucide-react"

export default async function MapaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD") redirect("/dashboard")

  try {
    // Get all properties with relevant data for the map
    const properties = await prisma.property.findMany({
      where: {
        landlordId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        address: true,
        commune: true,
        lat: true,
        lng: true,
        monthlyRentCLP: true,
        tenant: {
          select: {
            name: true,
          },
        },
        payments: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
          select: {
            status: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mapa de Propiedades</h1>
          <p className="text-muted-foreground">Visualiza la ubicación de todas tus propiedades en Santiago</p>
        </div>

        <PropertyMap properties={properties} />

        {/* Market Info */}
        {properties.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-[#5E8B8C]" />
                  <h3 className="font-semibold text-foreground">Total de Propiedades</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">{properties.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[#5E8B8C]" />
                  <h3 className="font-semibold text-foreground">Pagadas este mes</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {properties.filter(p => p.payments[0]?.status === 'PAID').length}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-[#C27F79]" />
                  <h3 className="font-semibold text-foreground">Pendientes de pago</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {properties.filter(p => !p.payments[0] || p.payments[0]?.status !== 'PAID').length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Mapa error:", error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mapa de Propiedades</h1>
          <p className="text-muted-foreground">Visualiza la ubicación de todas tus propiedades</p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Error al cargar el mapa. Intenta más tarde.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
