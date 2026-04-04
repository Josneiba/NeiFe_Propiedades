"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Home,
  CreditCard,
  Wrench,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  FolderOpen,
  Zap,
  Droplets,
} from "lucide-react"

// Mock data for tenant
const mockProperty = {
  id: "prop-1",
  address: "Av. Providencia 1234, Depto 501",
  monthlyRentCLP: 450000,
  contractStart: new Date("2024-01-15"),
  contractEnd: new Date("2025-12-15"),
  landlord: { name: "Carlos Mendoza" },
}

const mockCurrentPayment = {
  id: "pay-1",
  status: "PAID",
  amountCLP: 450000,
  createdAt: new Date(),
}

const mockCurrentServices = {
  water: 15000,
  electricity: 42500,
  gas: 8000,
}

const mockRecentPayments = [
  {
    id: "pay-3",
    month: 3,
    year: 2025,
    createdAt: new Date("2025-03-05"),
  },
  {
    id: "pay-2",
    month: 2,
    year: 2025,
    createdAt: new Date("2025-02-05"),
  },
  {
    id: "pay-1",
    month: 1,
    year: 2025,
    createdAt: new Date("2025-01-05"),
  },
]

const mockRecentMaintenance = [
  {
    id: "maint-1",
    category: "Plomería",
    status: "COMPLETED",
    createdAt: new Date("2025-03-10"),
  },
  {
    id: "maint-2",
    category: "Electricidad",
    status: "IN_PROGRESS",
    createdAt: new Date("2025-03-20"),
  },
]

function getMonthName(month: number) {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]
  return months[month - 1]
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function DemoTenantPage() {
  const water = mockCurrentServices?.water ?? 0
  const electricity = mockCurrentServices?.electricity ?? 0
  const gas = mockCurrentServices?.gas ?? 0
  const currentTotal =
    (mockProperty.monthlyRentCLP || 0) + water + electricity + gas

  // Build activity items
  const activityItems = [
    ...mockRecentPayments.map((p) => ({
      type: "payment" as const,
      description: `Pago de ${getMonthName(p.month)} ${p.year} confirmado`,
      date: p.createdAt,
      status: "success" as const,
    })),
    ...mockRecentMaintenance.map((m) => ({
      type: "maintenance" as const,
      description: `Solicitud de ${m.category} - ${
        m.status === "COMPLETED"
          ? "completada"
          : m.status === "IN_PROGRESS"
            ? "en progreso"
            : "pendiente"
      }`,
      date: m.createdAt,
      status: m.status === "COMPLETED" ? ("success" as const) : ("pending" as const),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  const alerts = [
    {
      type: "contract",
      message: "Tu contrato vence en 9 meses",
      icon: FileText,
      color: "text-[#5E8B8C]",
      bgColor: "bg-[#5E8B8C]/20",
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
        <Badge className="bg-[#5E8B8C]/20 text-[#D5C3B6] border-[#D5C3B6]/20">
          DEMO ARRENDATARIO
        </Badge>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif text-[#FAF6F2]">Mi Arriendo</h1>
        <div className="flex items-center gap-2 text-[#9C8578] mt-1">
          <Home className="h-4 w-4" />
          {mockProperty.address}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-4 rounded-lg ${alert.bgColor}`}
            >
              <alert.icon className={`h-5 w-5 ${alert.color}`} />
              <span className="text-[#FAF6F2]">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Month Payment */}
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader className="pb-3 border-b border-[#D5C3B6]/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
                  Estado del Mes (Abril 2025)
                </CardTitle>
                <Badge className="bg-[#5E8B8C] text-[#FAF6F2]">Pagado</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-[#1C1917]/50">
                  <p className="text-sm text-[#9C8578]">Arriendo</p>
                  <p className="text-lg font-bold text-[#FAF6F2]">
                    {formatCLP(mockProperty.monthlyRentCLP || 0)}
                  </p>
                </div>
                {water > 0 && (
                  <div className="p-4 rounded-lg bg-[#1C1917]/50">
                    <p className="text-sm text-[#9C8578]">Agua</p>
                    <p className="text-lg font-bold text-[#FAF6F2]">
                      {formatCLP(water)}
                    </p>
                  </div>
                )}
                {electricity > 0 && (
                  <div className="p-4 rounded-lg bg-[#1C1917]/50">
                    <p className="text-sm text-[#9C8578]">Electricidad</p>
                    <p className="text-lg font-bold text-[#FAF6F2]">
                      {formatCLP(electricity)}
                    </p>
                  </div>
                )}
                {gas > 0 && (
                  <div className="p-4 rounded-lg bg-[#1C1917]/50">
                    <p className="text-sm text-[#9C8578]">Gas</p>
                    <p className="text-lg font-bold text-[#FAF6F2]">
                      {formatCLP(gas)}
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-[#D5C3B6]/10">
                <div className="flex items-center justify-between">
                  <span className="text-[#D5C3B6] font-semibold">Total a Pagar</span>
                  <span className="text-2xl font-bold text-[#5E8B8C]">
                    {formatCLP(currentTotal)}
                  </span>
                </div>
              </div>
              <Button className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar ahora
              </Button>
            </CardContent>
          </Card>

          {/* Contract Information */}
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader className="pb-3 border-b border-[#D5C3B6]/10">
              <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#5E8B8C]" />
                Información del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#1C1917]/50">
                  <p className="text-sm text-[#9C8578]">Arrendador</p>
                  <p className="text-[#FAF6F2] font-semibold">
                    {mockProperty.landlord?.name}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#1C1917]/50">
                  <p className="text-sm text-[#9C8578]">Teléfono</p>
                  <p className="text-[#FAF6F2] font-semibold">+56 9 8765 4321</p>
                </div>
                <div className="p-4 rounded-lg bg-[#1C1917]/50">
                  <p className="text-sm text-[#9C8578]">Inicio</p>
                  <p className="text-[#FAF6F2] font-semibold">
                    {mockProperty.contractStart?.toLocaleDateString("es-CL")}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#1C1917]/50">
                  <p className="text-sm text-[#9C8578]">Vencimiento</p>
                  <p className="text-[#FAF6F2] font-semibold">
                    {mockProperty.contractEnd?.toLocaleDateString("es-CL")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-[#D5C3B6]/30 text-[#D5C3B6] hover:bg-[#D5C3B6]/10"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Ver contrato digital
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader className="pb-3 border-b border-[#D5C3B6]/10">
              <CardTitle className="text-[#FAF6F2]">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {activityItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#1C1917]/50"
                >
                  {item.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-[#5E8B8C] shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="h-5 w-5 text-[#C27F79] shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-[#FAF6F2]">{item.description}</p>
                    <p className="text-xs text-[#9C8578] mt-1">
                      {item.date.toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Links */}
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 cursor-pointer hover:border-[#B8965A]/30 transition-all">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-[#5E8B8C]/20 flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
              </div>
              <h3 className="font-serif font-semibold text-[#FAF6F2] mb-2">
                Pagar Arriendo
              </h3>
              <p className="text-sm text-[#9C8578] mb-4">
                Realiza el pago de tu arriendo de forma segura
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-[#5E8B8C]/50 text-[#5E8B8C] hover:bg-[#5E8B8C]/10"
              >
                Ir a pagos
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 cursor-pointer hover:border-[#B8965A]/30 transition-all">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-[#C27F79]/20 flex items-center justify-center mb-3">
                <Wrench className="h-5 w-5 text-[#C27F79]" />
              </div>
              <h3 className="font-serif font-semibold text-[#FAF6F2] mb-2">
                Reportar Falla
              </h3>
              <p className="text-sm text-[#9C8578] mb-4">
                Reporte de mantenciones urgentes
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-[#C27F79]/50 text-[#C27F79] hover:bg-[#C27F79]/10"
              >
                Nueva solicitud
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 cursor-pointer hover:border-[#B8965A]/30 transition-all">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-[#75524C]/20 flex items-center justify-center mb-3">
                <AlertCircle className="h-5 w-5 text-[#75524C]" />
              </div>
              <h3 className="font-serif font-semibold text-[#FAF6F2] mb-2">
                Soporte
              </h3>
              <p className="text-sm text-[#9C8578] mb-4">
                Contacta con tu arrendador
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-[#75524C]/50 text-[#75524C] hover:bg-[#75524C]/10"
              >
                Contactar
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
