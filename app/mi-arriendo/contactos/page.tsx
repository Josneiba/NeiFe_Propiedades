import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Phone, 
  Mail, 
  User,
  Star,
  Wrench,
  AlertCircle,
  Home
} from "lucide-react"

const specialtyColors: Record<string, string> = {
  "Plomería": "bg-blue-500/20 text-blue-400",
  "Electricidad": "bg-yellow-500/20 text-yellow-400",
  "Estructura": "bg-orange-500/20 text-orange-400",
  "Cerrajería": "bg-purple-500/20 text-purple-400"
}

export default async function ContactosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'TENANT') redirect('/dashboard')

  // Get the property assigned to this tenant
  const property = await prisma.property.findFirst({
    where: { tenantId: session.user.id },
    include: {
      landlord: {
        select: { name: true, phone: true, email: true },
      },
      providers: {
        include: {
          provider: true,
        },
      },
    },
  })

  if (!property) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contactos de Confianza</h1>
          <p className="text-muted-foreground">
            Proveedores verificados por tu arrendador para mantenciones
          </p>
        </div>

        <Card className="bg-[#2A2520] border-border">
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No tienes una propiedad asignada aún</p>
            <p className="text-sm text-muted-foreground mt-2">
              Tu arrendador debe asignarte una propiedad para que puedas ver los contactos de confianza disponibles.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const landlord = property.landlord
  const providers = property.providers.map(pp => pp.provider)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contactos de Confianza</h1>
        <p className="text-muted-foreground">
          Proveedores verificados por tu arrendador para mantenciones
        </p>
      </div>

      {/* Important Notice */}
      <Card className="bg-[#F2C94C]/10 border-[#F2C94C]/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#F2C94C] mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Importante</p>
              <p className="text-sm text-muted-foreground">
                Para solicitar mantenciones, usa el módulo de Mantenciones de la plataforma. 
                Las solicitudes deben ser aprobadas por tu arrendador antes de contactar a los proveedores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Landlord Contact */}
      {landlord && (
        <Card className="bg-[#2A2520] border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Tu Arrendador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#75524C] flex items-center justify-center">
                <span className="text-xl font-bold text-[#D5C3B6]">
                  {landlord.name?.substring(0, 2).toUpperCase() || 'AR'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">{landlord.name}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  {landlord.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {landlord.phone}
                    </div>
                  )}
                  {landlord.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {landlord.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Providers */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Proveedores de Mantención</h2>
        {providers.length === 0 ? (
          <Card className="bg-[#2A2520] border-border">
            <CardContent className="p-12 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-2">Tu arrendador aún no ha asignado contactos de mantención</p>
              <p className="text-sm text-muted-foreground">
                Los proveedores aparecerán aquí cuando tu arrendador los asigne a tu propiedad
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2D3C3C] flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-[#D5C3B6]/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground truncate">
                            {provider.name}
                          </h3>
                          {provider.specialty && (
                            <Badge className={specialtyColors[provider.specialty] || "bg-muted"}>
                              {provider.specialty}
                            </Badge>
                          )}
                        </div>
                        {provider.rating && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="h-4 w-4 text-[#F2C94C] fill-[#F2C94C]" />
                            <span className="text-sm font-medium text-foreground">{provider.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      {provider.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {provider.description}
                        </p>
                      )}

                      <div className="space-y-1 text-sm text-muted-foreground">
                        {provider.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {provider.phone}
                          </div>
                        )}
                        {provider.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {provider.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <Card className="bg-[#2A2520] border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#5E8B8C]" />
            ¿Cómo funciona?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Reporta la falla</p>
                <p className="text-sm text-muted-foreground">
                  Usa el módulo de Mantenciones para describir el problema y adjuntar fotos.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">El arrendador revisa</p>
                <p className="text-sm text-muted-foreground">
                  Tu arrendador evaluará la solicitud y determinará la responsabilidad según la ley.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Se asigna un proveedor</p>
                <p className="text-sm text-muted-foreground">
                  Si se aprueba, el arrendador asignará un proveedor de confianza para realizar el trabajo.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">4</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Seguimiento en la plataforma</p>
                <p className="text-sm text-muted-foreground">
                  Podrás ver el estado de la mantención en todo momento desde tu panel.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
