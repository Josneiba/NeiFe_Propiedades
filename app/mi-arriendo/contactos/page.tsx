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
      managedByUser: {
        select: { name: true, phone: true, email: true, company: true },
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
          <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Contactos de Confianza</h1>
          <p className="text-sm text-[#9C8578] mt-0.5">
            Proveedores verificados por tu arrendador para mantenciones
          </p>
        </div>

        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-10 text-center">
            <Home className="h-10 w-10 text-[#9C8578]/40 mx-auto mb-3" />
            <p className="text-[#9C8578]">No tienes una propiedad asignada aún</p>
            <p className="text-xs text-[#9C8578] mt-2">
              Tu arrendador debe asignarte una propiedad para que puedas ver los contactos de confianza disponibles.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const landlord = property.landlord
  const broker = property.managedByUser
  const providers = property.providers.map(pp => pp.provider)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Contactos de Confianza</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">
          Proveedores verificados y contactos clave para tu arriendo
        </p>
      </div>

      {/* Important Notice */}
      <Card className="bg-[#F2C94C]/10 border-[#F2C94C]/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#F2C94C] mt-0.5" />
            <div>
              <p className="font-medium text-[#FAF6F2]">Importante</p>
              <p className="text-sm text-[#9C8578]">
                Para solicitar mantenciones, usa el módulo de Mantenciones de la plataforma.
                {broker
                  ? " Si esta propiedad está administrada por un corredor, ese será tu contacto principal."
                  : " Las solicitudes deben ser aprobadas por tu arrendador antes de contactar a los proveedores."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {broker && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-[#FAF6F2]">Tu Corredor Administrador</CardTitle>
              <Badge className="bg-[#5E8B8C]/20 text-[#5E8B8C]">Contacto principal</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#5E8B8C] flex items-center justify-center">
                <span className="text-xl font-bold text-[#FAF6F2]">
                  {broker.name?.substring(0, 2).toUpperCase() || 'CO'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#FAF6F2]">{broker.name}</h3>
                {broker.company && (
                  <p className="text-sm text-[#9C8578] mt-1">{broker.company}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#9C8578]">
                  {broker.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {broker.phone}
                    </div>
                  )}
                  {broker.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {broker.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Landlord Contact */}
      {landlord && (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardHeader>
            <CardTitle className="text-[#FAF6F2]">
              {broker ? "Propietario" : "Tu Arrendador"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#75524C] flex items-center justify-center">
                <span className="text-xl font-bold text-[#FAF6F2]">
                  {landlord.name?.substring(0, 2).toUpperCase() || 'AR'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#FAF6F2]">{landlord.name}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#9C8578]">
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
        <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-3">Proveedores de mantención</p>
        {providers.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-10 text-center">
              <Wrench className="h-10 w-10 text-[#9C8578]/40 mx-auto mb-3" />
              <p className="text-[#9C8578] mb-2">Tu arrendador aún no ha asignado contactos de mantención</p>
              <p className="text-xs text-[#9C8578]">
                Los proveedores aparecerán aquí cuando tu arrendador los asigne a tu propiedad
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2D3C3C] flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-[#D5C3B6]/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-[#FAF6F2] truncate">
                            {provider.name}
                          </h3>
                          {provider.specialty && (
                            <Badge className={specialtyColors[provider.specialty] || "bg-[#D5C3B6]/15 text-[#D5C3B6]"}>
                              {provider.specialty}
                            </Badge>
                          )}
                        </div>
                        {provider.rating && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="h-4 w-4 text-[#F2C94C] fill-[#F2C94C]" />
                            <span className="text-sm font-medium text-[#FAF6F2]">{provider.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      {provider.description && (
                        <p className="text-xs text-[#9C8578] mb-3 line-clamp-2">
                          {provider.description}
                        </p>
                      )}

                      <div className="space-y-1 text-xs text-[#9C8578]">
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
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#5E8B8C]" />
            ¿Cómo funciona?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#FAF6F2]">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#FAF6F2]">Reporta la falla</p>
                <p className="text-sm text-[#9C8578]">
                  Usa el módulo de Mantenciones para describir el problema y adjuntar fotos.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#FAF6F2]">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#FAF6F2]">El arrendador revisa</p>
                <p className="text-sm text-[#9C8578]">
                  Tu arrendador evaluará la solicitud y determinará la responsabilidad según la ley.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#FAF6F2]">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#FAF6F2]">Se asigna un proveedor</p>
                <p className="text-sm text-[#9C8578]">
                  Si se aprueba, el arrendador asignará un proveedor de confianza para realizar el trabajo.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#5E8B8C] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#FAF6F2]">4</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#FAF6F2]">Seguimiento en la plataforma</p>
                <p className="text-sm text-[#9C8578]">
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
