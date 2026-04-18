"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Building2,
  Home,
  FileText,
  Users,
  ClipboardList,
  MapPin,
  Briefcase,
  Shield,
} from "lucide-react"

const mockBrokerStats = [
  {
    title: "Mandatos activos",
    value: "3",
    description: "Propiedades actualmente a tu cargo",
    color: "bg-[#B8965A]/20",
    icon: Briefcase,
  },
  {
    title: "Propiedades gestionadas",
    value: "5",
    description: "Portafolio con clientes asignados",
    color: "bg-[#75524C]/20",
    icon: Building2,
  },
  {
    title: "Contratos vigentes",
    value: "8",
    description: "Contratos firmados y activos",
    color: "bg-[#5E8B8C]/20",
    icon: FileText,
  },
]

const mockMandates = [
  {
    property: "Av. Providencia 1234, Depto 501",
    client: "Carlos Mendoza",
    status: "Activo",
  },
  {
    property: "Los Leones 567, Casa 12",
    client: "María González",
    status: "En revisión",
  },
  {
    property: "Plaza Ñuñoa 742, Depto 10",
    client: "Pedro Soto",
    status: "Activo",
  },
]

export default function DemoBrokerPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="text-[#9C8578] hover:bg-[#D5C3B6]/10 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <Badge className="bg-[#B8965A]/20 text-[#FAF6F2] border-[#D5C3B6]/10">
          DEMO CORREDOR
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#2D3C3C] border border-[#D5C3B6]/10 p-8 shadow-lg shadow-[#000]/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[#9C8578] uppercase tracking-[0.18em] text-xs mb-2">Panel corredor</p>
                <h1 className="text-4xl font-serif font-semibold text-[#FAF6F2]">Bienvenido, corredor</h1>
                <p className="text-[#D5C3B6] mt-2 max-w-2xl">
                  Vista demo que muestra cómo gestionas mandatos, propiedades y contratos de tus clientes en un solo lugar.
                </p>
              </div>
              <div className="rounded-3xl bg-[#1C1917]/90 p-5 border border-[#D5C3B6]/10">
                <div className="flex items-center gap-3 text-[#FAF6F2]">
                  <Shield className="h-5 w-5 text-[#B8965A]" />
                  <div>
                    <p className="text-sm text-[#9C8578]">Cuenta demo</p>
                    <p className="text-base font-semibold">corredor@neife.cl</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {mockBrokerStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex rounded-2xl p-3 ${stat.color}`}>
                      <Icon className="h-5 w-5 text-[#FAF6F2]" />
                    </div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[#9C8578] mb-2">{stat.title}</p>
                    <p className="text-3xl font-serif font-semibold text-[#FAF6F2] mb-2">{stat.value}</p>
                    <p className="text-sm text-[#D5C3B6]">{stat.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader className="border-b border-[#D5C3B6]/10 pb-4">
              <CardTitle className="text-[#FAF6F2]">Mandatos recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockMandates.map((mandate) => (
                <div key={mandate.property} className="rounded-3xl bg-[#1C1917]/70 p-5 border border-[#D5C3B6]/10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#9C8578]">Propiedad</p>
                      <p className="text-lg text-[#FAF6F2] font-semibold">{mandate.property}</p>
                    </div>
                    <Badge className="bg-[#B8965A]/10 text-[#FAF6F2]">{mandate.status}</Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[#D5C3B6]">
                    <Users className="h-4 w-4" />
                    <p>{mandate.client}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader className="border-b border-[#D5C3B6]/10 pb-4">
              <CardTitle className="text-[#FAF6F2]">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Ver mandatos activos', icon: ClipboardList },
                { label: 'Administrar propiedades', icon: Building2 },
                { label: 'Generar contrato', icon: FileText },
              ].map((action) => (
                <Button key={action.label} className="w-full justify-start bg-[#B8965A]/20 text-[#FAF6F2] hover:bg-[#B8965A]/30 gap-3">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-2xl bg-[#5E8B8C]/10 p-3">
                  <MapPin className="h-5 w-5 text-[#5E8B8C]" />
                </div>
                <div>
                  <p className="text-sm text-[#9C8578]">Ubicación principal</p>
                  <p className="text-[#FAF6F2] font-semibold">Providencia, Santiago</p>
                </div>
              </div>
              <p className="text-[#D5C3B6] leading-relaxed text-sm">
                El demo del corredor ilustra cómo se maneja un portafolio de propiedades de clientes con mandatos y contratos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
