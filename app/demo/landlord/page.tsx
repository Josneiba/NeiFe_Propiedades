"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  DollarSign,
  Building2,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Plus,
  Eye,
  Calendar,
  MapPin,
  Users,
  FileText,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"

// Mock data
const mockProperties = [
  {
    id: "prop-1",
    address: "Av. Providencia 1234, Depto 501",
    monthlyRentCLP: 450000,
    tenant: { id: "t-1", name: "María González", email: "maria@example.com", phone: "+56 9 1234 5678" },
    payments: [{ status: "PAID", month: 4 }],
    _count: { maintenance: 1 },
  },
  {
    id: "prop-2",
    address: "Los Leones 567, Casa 12",
    monthlyRentCLP: 650000,
    tenant: { id: "t-2", name: "Pedro Soto", email: "pedro@example.com", phone: "+56 9 8765 4321" },
    payments: [{ status: "PENDING", month: 4 }],
    _count: { maintenance: 0 },
  },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: "Pagado", className: "bg-[#5E8B8C] text-[#FAF6F2]" },
  PENDING: { label: "Pendiente", className: "bg-[#C27F79] text-[#FAF6F2]" },
  OVERDUE: { label: "Atrasado", className: "bg-red-600 text-[#FAF6F2]" },
}

function formatDate() {
  return new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount)
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 18) return "Buenas tardes"
  return "Buenas noches"
}

export default function DemoLandlordPage() {
  const kpiStats = [
    {
      title: "Total Recaudado",
      value: "$1.1M",
      subValue: formatCLP(1100000),
      change: "2/2 pagadas",
      icon: DollarSign,
      color: "text-[#5E8B8C]",
      bgColor: "bg-[#5E8B8C]/20",
    },
    {
      title: "Propiedades Activas",
      value: "2",
      subValue: "2 arrendadas",
      change: null,
      icon: Building2,
      color: "text-[#75524C]",
      bgColor: "bg-[#75524C]/20",
    },
    {
      title: "Pagos Pendientes",
      value: "$650K",
      subValue: formatCLP(650000),
      change: "Requiere atención",
      icon: AlertTriangle,
      color: "text-[#C27F79]",
      bgColor: "bg-[#C27F79]/20",
    },
    {
      title: "Mantenciones Activas",
      value: "1",
      subValue: "En proceso",
      change: null,
      icon: Wrench,
      color: "text-[#F2C94C]",
      bgColor: "bg-[#F2C94C]/20",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="text-[#9C8578] hover:bg-[#D5C3B6]/10 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <Badge className="bg-[#75524C]/20 text-[#D5C3B6] border-[#D5C3B6]/20">
          DEMO ARRENDADOR
        </Badge>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[#9C8578] text-sm mb-1">{formatDate()}</p>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2]">
            {getGreeting()}, <span className="text-[#D5C3B6]">Carlos</span>
          </h1>
          <p className="text-[#9C8578] mt-1">
            Aquí está el resumen de tus 2 propiedades
          </p>
        </div>
        <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] shadow-lg shadow-[#75524C]/20">
          <Plus className="h-4 w-4 mr-2" />
          Agregar propiedad
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpiStats.map((stat, index) => (
          <Card
            key={index}
            className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300"
          >
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div
                  className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <stat.icon
                    className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`}
                  />
                </div>
                {stat.change && (
                  <TrendingUp className="h-4 w-4 text-[#5E8B8C] flex-shrink-0" />
                )}
              </div>
              <p className="text-xl sm:text-2xl font-serif font-semibold text-[#FAF6F2] truncate">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-mono text-[#9C8578] truncate">
                {stat.subValue}
              </p>
              <p className="text-xs text-[#9C8578] mt-1 sm:mt-2 line-clamp-2">
                {stat.title}
              </p>
              {stat.change && (
                <p className="text-xs text-[#B8965A] mt-2 font-medium">
                  {stat.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties Grid */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-[#FAF6F2] mb-4">
          Mis Propiedades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockProperties.map((property) => (
            <Card
              key={property.id}
              className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-[#5E8B8C]" />
                      <p className="text-sm text-[#9C8578]">Propiedad</p>
                    </div>
                    <h3 className="text-lg font-serif font-semibold text-[#FAF6F2] mb-2">
                      {property.address}
                    </h3>
                  </div>
                  <Badge
                    className={statusConfig[property.payments[0]?.status || "PENDING"].className}
                  >
                    {statusConfig[property.payments[0]?.status || "PENDING"].label}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-[#1C1917]/50 rounded-lg">
                    <span className="flex items-center gap-2 text-[#9C8578] text-sm">
                      <DollarSign className="h-4 w-4" />
                      Arriendo mensual
                    </span>
                    <span className="text-[#FAF6F2] font-semibold">
                      {formatCLP(property.monthlyRentCLP)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#1C1917]/50 rounded-lg">
                    <span className="flex items-center gap-2 text-[#9C8578] text-sm">
                      <Users className="h-4 w-4" />
                      Arrendatario
                    </span>
                    <span className="text-[#FAF6F2] font-semibold text-right">
                      {property.tenant?.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#1C1917]/50 rounded-lg">
                    <span className="flex items-center gap-2 text-[#9C8578] text-sm">
                      <Wrench className="h-4 w-4" />
                      Mantenciones activas
                    </span>
                    <span className="text-[#FAF6F2] font-semibold">
                      {property._count.maintenance}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#D5C3B6]/30 text-[#D5C3B6] hover:bg-[#D5C3B6]/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalles
                  </Button>
                  <Button className="flex-1 bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]">
                    <FileText className="h-4 w-4 mr-2" />
                    Contrato
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-[#5E8B8C]/20 flex items-center justify-center mb-4 group-hover:bg-[#5E8B8C]/30 transition-colors">
              <Calendar className="h-6 w-6 text-[#5E8B8C]" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-[#FAF6F2] mb-2">
              Calendario
            </h3>
            <p className="text-sm text-[#9C8578] mb-4">
              Gestiona eventos, recordatorios e inspecciones
            </p>
            <p className="text-xs text-[#B8965A]">
              Próxima inspección: 15 de Abril
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-[#75524C]/20 flex items-center justify-center mb-4 group-hover:bg-[#75524C]/30 transition-colors">
              <DollarSign className="h-6 w-6 text-[#75524C]" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-[#FAF6F2] mb-2">
              Pagos
            </h3>
            <p className="text-sm text-[#9C8578] mb-4">
              Seguimiento y reportes de pagos
            </p>
            <p className="text-xs text-[#B8965A]">
              1 pago pendiente: $650.000
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-[#C27F79]/20 flex items-center justify-center mb-4 group-hover:bg-[#C27F79]/30 transition-colors">
              <Wrench className="h-6 w-6 text-[#C27F79]" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-[#FAF6F2] mb-2">
              Mantenciones
            </h3>
            <p className="text-sm text-[#9C8578] mb-4">
              Reportes y asignación de proveedores
            </p>
            <p className="text-xs text-[#B8965A]">
              1 solicitud en revisión
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
