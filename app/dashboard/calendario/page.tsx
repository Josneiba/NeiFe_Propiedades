"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Wrench,
  TrendingUp,
  Loader2,
} from "lucide-react"

interface CalendarEvent {
  id: string
  type: "INSPECTION" | "IPC" | "CONTRACT" | "PAYMENT"
  date: string
  title: string
  description: string
  propertyAddress: string
  icon: any
  color: string
  badgeColor: string
}

export default function CalendarioPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "INSPECTION" | "IPC" | "CONTRACT" | "PAYMENT">("ALL")

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Fetch properties with related data
        const propertiesRes = await fetch("/api/properties")
        if (!propertiesRes.ok) throw new Error("Failed to load properties")
        const properties = await propertiesRes.json()

        const calendarEvents: CalendarEvent[] = []

        // Process each property
        for (const property of properties) {
          // Fetch inspections
          try {
            const inspectionsRes = await fetch(`/api/properties/${property.id}/inspections`)
            if (inspectionsRes.ok) {
              const inspections = await inspectionsRes.json()
              inspections.forEach((inspection: any) => {
                if (inspection.status === "SCHEDULED" || inspection.status === "CONFIRMED") {
                  calendarEvents.push({
                    id: `inspection-${inspection.id}`,
                    type: "INSPECTION",
                    date: inspection.scheduledAt,
                    title: `Inspección: ${getInspectionType(inspection.type)}`,
                    description: `Estado: ${inspection.status === "CONFIRMED" ? "Confirmada" : "Programada"}`,
                    propertyAddress: property.address || "Propiedad",
                    icon: Calendar,
                    color: "bg-blue-50 border-blue-200",
                    badgeColor: "bg-blue-100 text-blue-800"
                  })
                }
              })
            }
          } catch (error) {
            console.error("Error loading inspections:", error)
          }

          // Fetch IPC adjustments
          try {
            const ipcRes = await fetch(`/api/properties/${property.id}/ipc-adjustments`)
            if (ipcRes.ok) {
              const adjustments = await ipcRes.json()
              adjustments.forEach((adj: any) => {
                if (adj.status === "PENDING") {
                  calendarEvents.push({
                    id: `ipc-${adj.id}`,
                    type: "IPC",
                    date: adj.scheduledDate,
                    title: `Reajuste IPC ${adj.ipcRate}%`,
                    description: `Nuevo arriendo: $${adj.newRentCLP.toLocaleString("es-CL")}`,
                    propertyAddress: property.address || "Propiedad",
                    icon: TrendingUp,
                    color: "bg-green-50 border-green-200",
                    badgeColor: "bg-green-100 text-green-800"
                  })
                }
              })
            }
          } catch (error) {
            console.error("Error loading IPC adjustments:", error)
          }

          // Check contract expiration (próximos 90 días)
          if (property.contractEnd) {
            const contractEndDate = new Date(property.contractEnd)
            const today = new Date()
            const daysUntilEnd = Math.floor((contractEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntilEnd > 0 && daysUntilEnd <= 90) {
              calendarEvents.push({
                id: `contract-${property.id}`,
                type: "CONTRACT",
                date: property.contractEnd,
                title: "Contrato próximo a vencer",
                description: `Vence en ${daysUntilEnd} días`,
                propertyAddress: property.address || "Propiedad",
                icon: FileText,
                color: "bg-orange-50 border-orange-200",
                badgeColor: "bg-orange-100 text-orange-800"
              })
            }
          }

          // Check overdue or upcoming payments (próximos 30 días)
          if (property.payments && Array.isArray(property.payments)) {
            property.payments
              .filter((payment: any) => !payment.paidAt)
              .forEach((payment: any) => {
                const dueDate = new Date(payment.dueDate)
                const today = new Date()
                const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                if (daysUntilDue <= 30 && daysUntilDue > -60) {
                  calendarEvents.push({
                    id: `payment-${payment.id}`,
                    type: "PAYMENT",
                    date: payment.dueDate,
                    title: daysUntilDue < 0 ? "Pago vencido" : "Pago próximo",
                    description: `$${payment.amount.toLocaleString("es-CL")} - ${daysUntilDue < 0 ? `Hace ${Math.abs(daysUntilDue)} días` : `En ${daysUntilDue} días`}`,
                    propertyAddress: property.address || "Propiedad",
                    icon: DollarSign,
                    color: daysUntilDue < 0 ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200",
                    badgeColor: daysUntilDue < 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  })
                }
              })
          }
        }

        // Sort by date
        calendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setEvents(calendarEvents)
      } catch (error) {
        console.error("Error loading calendar events:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos del calendario",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [toast])

  const filteredEvents = filter === "ALL" 
    ? events 
    : events.filter(e => e.type === filter)

  const getInspectionType = (type: string) => {
    const types: Record<string, string> = {
      ROUTINE: "Rutinaria",
      CHECKIN: "Inicial",
      CHECKOUT: "Final",
      MAINTENANCE: "Mantención",
      IPC_REVIEW: "Revisión IPC"
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calendario</h1>
        <p className="text-muted-foreground">Vista consolidada de eventos próximos</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "INSPECTION", "IPC", "CONTRACT", "PAYMENT"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === f
                ? "bg-[#5E8B8C] text-white"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {f === "ALL" && "Todos"}
            {f === "INSPECTION" && "Inspecciones"}
            {f === "IPC" && "Reajustes IPC"}
            {f === "CONTRACT" && "Contratos"}
            {f === "PAYMENT" && "Pagos"}
          </button>
        ))}
      </div>

      {/* Events list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Próximos {filteredEvents.length} evento(s)
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {filteredEvents.length === 0 && "No hay eventos próximos"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay eventos para este filtro</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const eventDate = new Date(event.date)
                const today = new Date()
                const daysFromNow = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border-2 transition ${event.color}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-white/50">
                          <event.icon className="h-5 w-5 text-[#5E8B8C]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{event.title}</h3>
                            <Badge className={event.badgeColor}>
                              {event.type === "PAYMENT" && daysFromNow < 0 ? "VENCIDO" : event.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {eventDate.toLocaleDateString("es-CL", { 
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              {daysFromNow < 0 
                                ? `Hace ${Math.abs(daysFromNow)} días`
                                : daysFromNow === 0 
                                ? "Hoy"
                                : daysFromNow === 1
                                ? "Mañana"
                                : `En ${daysFromNow} días`
                              }
                            </span>
                            <span>•</span>
                            <span>{event.propertyAddress}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Resumen de próximos 30 días</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inspecciones:</span>
              <span className="font-semibold text-foreground">
                {filteredEvents.filter(e => e.type === "INSPECTION" && Math.floor((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reajustes IPC:</span>
              <span className="font-semibold text-foreground">
                {filteredEvents.filter(e => e.type === "IPC" && Math.floor((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contratos por vencer:</span>
              <span className="font-semibold text-foreground">
                {filteredEvents.filter(e => e.type === "CONTRACT" && Math.floor((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagos:</span>
              <span className="font-semibold text-foreground">
                {filteredEvents.filter(e => e.type === "PAYMENT" && Math.floor((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Eventos urgentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredEvents
              .filter(e => {
                const daysFromNow = Math.floor((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return daysFromNow < 7 || (e.type === "PAYMENT" && daysFromNow < 0)
              })
              .slice(0, 5)
              .map(event => {
                const daysFromNow = Math.floor((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={event.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${daysFromNow < 0 ? "bg-red-500" : "bg-yellow-500"}`}></div>
                    <span className="text-muted-foreground">{event.title}</span>
                  </div>
                )
              })
            }
            {filteredEvents.filter(e => {
              const daysFromNow = Math.floor((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return daysFromNow < 7 || (e.type === "PAYMENT" && daysFromNow < 0)
            }).length === 0 && (
              <p className="text-sm text-muted-foreground">No hay eventos urgentes</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
