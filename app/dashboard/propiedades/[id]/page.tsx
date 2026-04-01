"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Wrench,
  FileText,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { ContractProgressChart } from "@/components/charts/contract-progress"

// Demo data
const property = {
  id: "1",
  address: "Av. Providencia 1234, Depto 501",
  commune: "Providencia",
  description: "Departamento de 2 habitaciones, 1 baño, living-comedor, cocina americana. Excelente ubicación cerca del metro.",
  tenant: {
    name: "María González",
    email: "maria@email.cl",
    phone: "+56 9 1234 5678",
    rut: "12.345.678-9"
  },
  monthlyRent: 450000,
  paymentStatus: "paid",
  contractStart: new Date("2024-01-15"),
  contractEnd: new Date("2025-01-15"),
}

const recentPayments = [
  { month: "Marzo 2025", amount: 485000, status: "paid", date: "05/03/2025" },
  { month: "Febrero 2025", amount: 478000, status: "paid", date: "03/02/2025" },
  { month: "Enero 2025", amount: 472000, status: "paid", date: "05/01/2025" },
]

const recentMaintenance = [
  { id: "1", category: "Plomería", description: "Filtración en baño principal", status: "completed", date: "15/02/2025" },
  { id: "2", category: "Electricidad", description: "Cambio de enchufes cocina", status: "in_progress", date: "10/03/2025" },
]

const maintenanceStatus = {
  completed: { label: "Completado", className: "bg-[#5E8B8C] text-white" },
  in_progress: { label: "En ejecución", className: "bg-[#F2C94C] text-[#2D3C3C]" },
  pending: { label: "Pendiente", className: "bg-[#C27F79] text-white" },
}

export default function PropertyDetailPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/propiedades">
          <Button variant="ghost" size="icon" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{property.address}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {property.commune}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-48 bg-[#2D3C3C] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-16 w-16 text-[#D5C3B6]/50" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                    <p className="text-foreground">{property.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Arriendo mensual</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${property.monthlyRent.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado del mes</p>
                      <Badge className="bg-[#5E8B8C] text-white mt-1">Pagado</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-[#5E8B8C]" />
                Arrendatario
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#5E8B8C] flex items-center justify-center">
                  <span className="text-white font-semibold">MG</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{property.tenant.name}</p>
                  <p className="text-sm text-muted-foreground">RUT: {property.tenant.rut}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{property.tenant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{property.tenant.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
                Últimos pagos
              </CardTitle>
              <Link href="/dashboard/pagos">
                <Button variant="ghost" size="sm" className="text-[#5E8B8C]">
                  Ver todos
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayments.map((payment, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{payment.month}</p>
                      <p className="text-sm text-muted-foreground">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${payment.amount.toLocaleString("es-CL")}
                      </p>
                      <Badge className="bg-[#5E8B8C] text-white text-xs">Pagado</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Maintenance */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#5E8B8C]" />
                Mantenciones
              </CardTitle>
              <Link href="/dashboard/mantenciones">
                <Button variant="ghost" size="sm" className="text-[#5E8B8C]">
                  Ver todas
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMaintenance.map((item) => {
                  const status = maintenanceStatus[item.status as keyof typeof maintenanceStatus]
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.category}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={status.className}>{status.label}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Progress */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#5E8B8C]" />
                Estado del contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContractProgressChart 
                startDate={property.contractStart}
                endDate={property.contractEnd}
                size="large"
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/pagos" className="block">
                <Button className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]">
                  Ingresar servicios del mes
                </Button>
              </Link>
              <Link href="/dashboard/contratos" className="block">
                <Button variant="outline" className="w-full text-foreground border-border">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver contrato
                </Button>
              </Link>
              <Button variant="outline" className="w-full text-foreground border-border">
                Enviar notificación
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
