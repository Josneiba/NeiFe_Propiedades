"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Building2, 
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  Maximize2
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Datos de demo de propiedades
const properties = [
  {
    id: "1",
    address: "Av. Providencia 1234, Depto 501",
    commune: "Providencia",
    tenant: "María González",
    monthlyRentUF: 12.5,
    paymentStatus: "paid",
    photo: null,
    position: { top: "25%", left: "40%" }
  },
  {
    id: "2",
    address: "Los Leones 567, Casa 12",
    commune: "Las Condes",
    tenant: "Pedro Soto",
    monthlyRentUF: 18.0,
    paymentStatus: "pending",
    photo: null,
    position: { top: "35%", left: "60%" }
  },
  {
    id: "3",
    address: "Manuel Montt 890, Depto 302",
    commune: "Ñuñoa",
    tenant: "Ana Muñoz",
    monthlyRentUF: 10.5,
    paymentStatus: "overdue",
    photo: null,
    position: { top: "55%", left: "35%" }
  },
  {
    id: "4",
    address: "Irarrázaval 2345, Depto 108",
    commune: "Ñuñoa",
    tenant: "Luis Contreras",
    monthlyRentUF: 14.5,
    paymentStatus: "paid",
    photo: null,
    position: { top: "60%", left: "55%" }
  }
]

// Datos de mercado por comuna
const marketData = [
  { commune: "Providencia", avgRentUF: { min: 18, max: 25 }, trend: "up", trendValue: 3.2 },
  { commune: "Las Condes", avgRentUF: { min: 22, max: 35 }, trend: "up", trendValue: 2.1 },
  { commune: "Ñuñoa", avgRentUF: { min: 14, max: 20 }, trend: "down", trendValue: 1.5 },
  { commune: "Maipú", avgRentUF: { min: 8, max: 13 }, trend: "up", trendValue: 4.0 },
  { commune: "Santiago Centro", avgRentUF: { min: 10, max: 16 }, trend: "down", trendValue: 0.8 },
]

const statusConfig = {
  paid: { label: "Pagado", color: "bg-[#5E8B8C]", textColor: "text-[#FAF6F2]" },
  pending: { label: "Pendiente", color: "bg-[#C27F79]", textColor: "text-[#FAF6F2]" },
  overdue: { label: "Atrasado", color: "bg-red-500", textColor: "text-[#FAF6F2]" }
}

export default function MapaPage() {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue">("all")

  const filteredProperties = properties.filter(p => 
    filter === "all" || p.paymentStatus === filter
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2]">Mapa de Propiedades</h1>
          <p className="text-[#9C8578]">Visualiza tus propiedades e índices de mercado</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10">
            <Maximize2 className="h-4 w-4 mr-2" />
            Pantalla completa
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "Todas" },
          { value: "paid", label: "Pagadas" },
          { value: "pending", label: "Pendientes" },
          { value: "overdue", label: "Atrasadas" }
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value as typeof filter)}
            className={filter === f.value 
              ? "bg-[#75524C] text-[#FAF6F2] hover:bg-[#75524C]/90" 
              : "border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10"
            }
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2 bg-[#2D3C3C] border-[#D5C3B6]/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[500px] relative bg-gradient-to-br from-[#1C1917] to-[#2D3C3C]">
              {/* Mapa base simulado */}
              <div className="absolute inset-4 rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/50">
                {/* Grid lines to simulate map */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className="border border-[#D5C3B6]/5" />
                  ))}
                </div>
                
                {/* Property markers */}
                {filteredProperties.map((property) => {
                  const status = statusConfig[property.paymentStatus as keyof typeof statusConfig]
                  const isSelected = selectedProperty === property.id
                  
                  return (
                    <div
                      key={property.id}
                      className="absolute cursor-pointer group z-10"
                      style={property.position}
                      onClick={() => setSelectedProperty(isSelected ? null : property.id)}
                    >
                      {/* Marker */}
                      <div className={`
                        w-10 h-10 rounded-full ${status.color} 
                        flex items-center justify-center
                        shadow-lg shadow-black/30
                        transition-all duration-300
                        ${isSelected ? 'scale-125 ring-4 ring-[#B8965A]/50' : 'group-hover:scale-110'}
                      `}>
                        <Building2 className="h-5 w-5 text-[#FAF6F2]" />
                      </div>
                      
                      {/* Tooltip */}
                      {isSelected && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#2D3C3C] border border-[#D5C3B6]/20 rounded-xl p-4 min-w-[240px] shadow-2xl z-20">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <p className="font-semibold text-[#FAF6F2] text-sm">{property.address}</p>
                              <p className="text-xs text-[#9C8578]">{property.commune}</p>
                            </div>
                            <Badge className={`${status.color} ${status.textColor} text-xs`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#9C8578]">Arrendatario</span>
                              <span className="text-[#D5C3B6]">{property.tenant}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#9C8578]">Arriendo</span>
                              <span className="font-mono text-[#FAF6F2]">UF {property.monthlyRentUF}</span>
                            </div>
                          </div>
                          <Link href={`/dashboard/propiedades/${property.id}`}>
                            <Button size="sm" className="w-full mt-3 bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                              <Eye className="h-3 w-3 mr-2" />
                              Ver detalle
                            </Button>
                          </Link>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#2D3C3C]" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Map controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button size="icon" variant="outline" className="bg-[#2D3C3C]/90 border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10">
                  +
                </Button>
                <Button size="icon" variant="outline" className="bg-[#2D3C3C]/90 border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10">
                  -
                </Button>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-[#2D3C3C]/90 backdrop-blur rounded-xl p-4 border border-[#D5C3B6]/10">
                <p className="text-xs font-medium uppercase tracking-wider text-[#B8965A] mb-3">Leyenda</p>
                <div className="space-y-2">
                  {Object.entries(statusConfig).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${value.color}`} />
                      <span className="text-xs text-[#D5C3B6]">{value.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Data Panel */}
        <div className="space-y-4">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-[#B8965A]" />
                <h3 className="text-sm font-medium uppercase tracking-wider text-[#B8965A]">
                  Índices de Mercado
                </h3>
              </div>
              <p className="text-xs text-[#9C8578] mb-4">
                Valores promedio de arriendo por zona en Santiago
              </p>
              <div className="space-y-4">
                {marketData.map((data) => (
                  <div key={data.commune} className="p-3 rounded-lg bg-[#1C1917]/50 hover:bg-[#1C1917]/70 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-[#FAF6F2]">{data.commune}</p>
                      <div className={`flex items-center gap-1 text-xs ${
                        data.trend === 'up' ? 'text-[#5E8B8C]' : 'text-[#C27F79]'
                      }`}>
                        {data.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {data.trendValue}%
                      </div>
                    </div>
                    <p className="text-lg font-serif font-semibold text-[#D5C3B6]">
                      UF {data.avgRentUF.min} - {data.avgRentUF.max}
                      <span className="text-xs font-normal text-[#9C8578] ml-1">/mes</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property comparison */}
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[#B8965A] mb-4">
                Tus Propiedades vs Mercado
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9C8578]">Promedio tuyo</span>
                  <span className="font-mono text-[#FAF6F2]">UF 13.9</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9C8578]">Promedio zona</span>
                  <span className="font-mono text-[#FAF6F2]">UF 16.5</span>
                </div>
                <div className="h-px bg-[#D5C3B6]/10" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9C8578]">Diferencia</span>
                  <span className="font-mono text-[#C27F79]">-15.8%</span>
                </div>
              </div>
              <p className="text-xs text-[#9C8578] mt-4">
                Tus propiedades están por debajo del promedio del mercado. Considera revisar los valores de arriendo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
