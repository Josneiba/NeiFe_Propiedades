"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Phone, 
  Mail, 
  User,
  Star,
  Wrench,
  AlertCircle
} from "lucide-react"

const landlord = {
  name: "Carlos Arrendador",
  phone: "+56 9 8888 7777",
  email: "carlos@arrendador.cl"
}

const providers = [
  {
    id: "1",
    name: "Juan Pérez - Gasfiter",
    specialty: "Plomería",
    phone: "+56 9 8765 4321",
    email: "juan.gasfiter@email.cl",
    rating: 4.8,
    description: "Especialista en instalaciones sanitarias y reparaciones de cañerías."
  },
  {
    id: "2",
    name: "Electricistas Profesionales Ltda.",
    specialty: "Electricidad",
    phone: "+56 9 1234 5678",
    email: "contacto@electricistas.cl",
    rating: 4.9,
    description: "Empresa certificada SEC. Instalaciones eléctricas y mantenciones."
  },
  {
    id: "3",
    name: "Constructora Muñoz",
    specialty: "Estructura",
    phone: "+56 9 5555 1234",
    email: "obras@constructoramunoz.cl",
    rating: 4.5,
    description: "Reparaciones estructurales, pintura y albañilería."
  },
  {
    id: "4",
    name: "Cerrajería Express",
    specialty: "Cerrajería",
    phone: "+56 9 9999 8888",
    email: "cerrajeria@express.cl",
    rating: 4.7,
    description: "Servicio de cerrajería 24 horas."
  }
]

const specialtyColors: Record<string, string> = {
  "Plomería": "bg-blue-500/20 text-blue-400",
  "Electricidad": "bg-yellow-500/20 text-yellow-400",
  "Estructura": "bg-orange-500/20 text-orange-400",
  "Cerrajería": "bg-purple-500/20 text-purple-400"
}

export default function ContactosPage() {
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
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Tu Arrendador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#75524C] flex items-center justify-center">
              <span className="text-xl font-bold text-[#D5C3B6]">CA</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">{landlord.name}</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {landlord.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {landlord.email}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Proveedores de Mantención</h2>
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
                        <Badge className={specialtyColors[provider.specialty] || "bg-muted"}>
                          {provider.specialty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="h-4 w-4 text-[#F2C94C] fill-[#F2C94C]" />
                        <span className="text-sm font-medium text-foreground">{provider.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {provider.description}
                    </p>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {provider.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {provider.email}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <Card className="bg-card border-border">
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
