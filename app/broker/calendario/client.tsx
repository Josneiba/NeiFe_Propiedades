"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Plus,
  Bell,
  Edit2,
  Trash2,
} from "lucide-react"

interface CalendarEvent {
  id: string
  type: "INSPECTION" | "IPC" | "CONTRACT" | "PAYMENT" | "MAINTENANCE" | "TENANT_REMINDER" | "CONTRACT_RENEWAL" | "PAYMENT_DUE" | "PAYMENT_OVERDUE" | "IPC_ADJUSTMENT"
  date: string
  title: string
  description: string
  propertyAddress: string
  icon: any
  color: string
  badgeColor: string
}

interface BrokerCalendarClientProps {
  propertyIds: string[]
}

const EVENT_STYLES = {
  INSPECTION: {
    card: "bg-[#233334]/80 border-[#5E8B8C]/50",
    badge: "bg-[#5E8B8C]/18 text-[#5E8B8C]",
    icon: "text-[#5E8B8C]",
  },
  IPC: {
    card: "bg-[#2E3C35]/80 border-[#5E8B8C]/45",
    badge: "bg-[#5E8B8C]/16 text-[#5E8B8C]",
    icon: "text-[#5E8B8C]",
  },
  IPC_ADJUSTMENT: {
    card: "bg-[#2E3C35]/80 border-[#5E8B8C]/45",
    badge: "bg-[#5E8B8C]/16 text-[#5E8B8C]",
    icon: "text-[#5E8B8C]",
  },
  CONTRACT: {
    card: "bg-[#32282E]/80 border-[#D5C3B6]/40",
    badge: "bg-[#D5C3B6]/20 text-[#D5C3B6]",
    icon: "text-[#D5C3B6]",
  },
  CONTRACT_RENEWAL: {
    card: "bg-[#32282E]/80 border-[#D5C3B6]/40",
    badge: "bg-[#D5C3B6]/20 text-[#D5C3B6]",
    icon: "text-[#D5C3B6]",
  },
  PAYMENT: {
    card: "bg-[#3D3221]/80 border-[#B8965A]/45",
    badge: "bg-[#B8965A]/20 text-[#B8965A]",
    icon: "text-[#B8965A]",
  },
  PAYMENT_DUE: {
    card: "bg-[#3D3221]/80 border-[#B8965A]/45",
    badge: "bg-[#B8965A]/20 text-[#B8965A]",
    icon: "text-[#B8965A]",
  },
  PAYMENT_OVERDUE: {
    card: "bg-[#402728]/85 border-[#C27F79]/55",
    badge: "bg-[#C27F79]/20 text-[#C27F79]",
    icon: "text-[#C27F79]",
  },
  MAINTENANCE: {
    card: "bg-[#3A2E24]/80 border-[#B8965A]/45",
    badge: "bg-[#B8965A]/20 text-[#B8965A]",
    icon: "text-[#B8965A]",
  },
  TENANT_REMINDER: {
    card: "bg-[#3C2B2B]/80 border-[#C27F79]/45",
    badge: "bg-[#C27F79]/22 text-[#C27F79]",
    icon: "text-[#C27F79]",
  },
  DEFAULT: {
    card: "bg-[#2D3C3C]/70 border-[#D5C3B6]/30",
    badge: "bg-[#D5C3B6]/18 text-[#D5C3B6]",
    icon: "text-[#D5C3B6]",
  },
}

type StyleVariant = "OVERDUE" | "PENDING" | undefined
const getStyle = (type: string, variant?: StyleVariant) => {
  if (type === "PAYMENT" && variant === "OVERDUE") return EVENT_STYLES.PAYMENT_OVERDUE
  if (type === "PAYMENT_DUE") return EVENT_STYLES.PAYMENT_DUE
  if (type === "PAYMENT") return EVENT_STYLES.PAYMENT
  if (type === "PAYMENT_OVERDUE") return EVENT_STYLES.PAYMENT_OVERDUE
  if (type === "INSPECTION") return EVENT_STYLES.INSPECTION
  if (type === "IPC_ADJUSTMENT") return EVENT_STYLES.IPC_ADJUSTMENT
  if (type === "IPC") return EVENT_STYLES.IPC
  if (type === "CONTRACT_RENEWAL") return EVENT_STYLES.CONTRACT_RENEWAL
  if (type === "CONTRACT") return EVENT_STYLES.CONTRACT
  if (type === "MAINTENANCE") return EVENT_STYLES.MAINTENANCE
  if (type === "TENANT_REMINDER") return EVENT_STYLES.TENANT_REMINDER
  return EVENT_STYLES.DEFAULT
}

const getInspectionType = (type: string) => {
  const types: Record<string, string> = {
    ROUTINE: "Rutina",
    MOVE_IN: "Entrada",
    MOVE_OUT: "Salida",
    EMERGENCY: "Emergencia",
  }
  return types[type] || type
}

export default function BrokerCalendarClient({ propertyIds }: BrokerCalendarClientProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "INSPECTION" | "IPC" | "CONTRACT" | "PAYMENT">("ALL")
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    propertyId: "",
    title: "",
    description: "",
    type: "INSPECTION" as const,
    date: "",
    reminder: 1,
    notifyType: "ME" as "ME" | "TENANT" | "BOTH",
  })
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [updatingEvent, setUpdatingEvent] = useState(false)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Fetch properties managed by broker
        const propertiesRes = await fetch("/api/properties/current")
        if (!propertiesRes.ok) throw new Error("Failed to load properties")
        const propertiesJson = await propertiesRes.json()
        const propertiesData = Array.isArray(propertiesJson.properties)
          ? propertiesJson.properties
          : Array.isArray(propertiesJson)
            ? propertiesJson
            : []
        setProperties(propertiesData)

        const calendarEvents: CalendarEvent[] = []

        // Fetch calendar events from API
        try {
          const calendarRes = await fetch("/api/calendar/events")
          if (calendarRes.ok) {
            const calendarPayload = await calendarRes.json()
            const savedEvents = Array.isArray(calendarPayload.events) ? calendarPayload.events : []
            savedEvents.forEach((event: any) => {
              const typeIcons: Record<string, any> = {
                INSPECTION: Calendar,
                PAYMENT_DUE: DollarSign,
                CONTRACT_RENEWAL: FileText,
                IPC_ADJUSTMENT: TrendingUp,
                MAINTENANCE: Wrench,
                TENANT_REMINDER: Bell,
              }
              calendarEvents.push({
                id: event.id,
                type: event.type,
                date: event.date,
                title: event.title,
                description: event.description || "",
                propertyAddress: event.property?.address || "Propiedad",
                icon: typeIcons[event.type] || Calendar,
                color: getStyle(event.type).card,
                badgeColor: getStyle(event.type).badge,
              })
            })
          }
        } catch (error) {
          console.error("Error loading calendar events:", error)
        }

        // Process each broker-managed property
        for (const property of propertiesData) {
          // Skip if property is not in broker's managed properties
          if (!propertyIds.includes(property.id)) continue

          // Fetch inspections
          try {
            const inspectionsRes = await fetch(`/api/properties/${property.id}/inspections`)
            if (inspectionsRes.ok) {
              const inspectionsPayload = await inspectionsRes.json()
              const inspections = Array.isArray(inspectionsPayload.inspections)
                ? inspectionsPayload.inspections
                : Array.isArray(inspectionsPayload)
                  ? inspectionsPayload
                  : []
              inspections.forEach((inspection: any) => {
                if (inspection.status === "SCHEDULED" || inspection.status === "CONFIRMED") {
                  const style = getStyle("INSPECTION")
                  calendarEvents.push({
                    id: `inspection-${inspection.id}`,
                    type: "INSPECTION",
                    date: inspection.scheduledAt,
                    title: `Inspección: ${getInspectionType(inspection.type)}`,
                    description: `Estado: ${inspection.status === "CONFIRMED" ? "Confirmada" : "Programada"}`,
                    propertyAddress: property.address || "Propiedad",
                    icon: Calendar,
                    color: style.card,
                    badgeColor: style.badge
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
              const ipcPayload = await ipcRes.json()
              const adjustments = Array.isArray(ipcPayload.adjustments)
                ? ipcPayload.adjustments
                : Array.isArray(ipcPayload)
                  ? ipcPayload
                  : []
              adjustments.forEach((adj: any) => {
                if (adj.status === "PENDING") {
                  const style = getStyle("IPC")
                  calendarEvents.push({
                    id: `ipc-${adj.id}`,
                    type: "IPC",
                    date: adj.scheduledDate,
                    title: `Reajuste IPC ${adj.ipcRate}%`,
                    description: adj.newRentCLP
                      ? `Nuevo arriendo: $${adj.newRentCLP.toLocaleString("es-CL")}`
                      : 'Reajuste IPC pendiente',
                    propertyAddress: property.address || "Propiedad",
                    icon: TrendingUp,
                    color: style.card,
                    badgeColor: style.badge
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
              const style = getStyle("CONTRACT")
              calendarEvents.push({
                id: `contract-${property.id}`,
                type: "CONTRACT",
                date: property.contractEnd,
                title: "Contrato próximo a vencer",
                description: `Vence en ${daysUntilEnd} días`,
                propertyAddress: property.address || "Propiedad",
                icon: FileText,
                color: style.card,
                badgeColor: style.badge
              })
            }
          }

          // Pago del mes actual pendiente o atrasado (datos reales del API)
          const pay = property.payments?.[0]
          if (pay && (pay.status === "PENDING" || pay.status === "OVERDUE")) {
            const today = new Date()
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            const iso = lastDay.toISOString()
            const isOverdue = pay.status === "OVERDUE"
            const style = getStyle("PAYMENT", isOverdue ? "OVERDUE" : undefined)
            calendarEvents.push({
              id: `payment-${property.id}-${pay.month}-${pay.year}`,
              type: "PAYMENT",
              date: iso,
              title: isOverdue ? "Pago atrasado (mes actual)" : "Pago pendiente (mes actual)",
              description: property.monthlyRentCLP
                ? `Monto referencia: $${Number(property.monthlyRentCLP).toLocaleString("es-CL")}`
                : "Revisa la sección Pagos",
              propertyAddress: property.address || "Propiedad",
              icon: DollarSign,
              color: style.card,
              badgeColor: style.badge
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
  }, [propertyIds])

  const filteredEvents = events.filter(event => 
    filter === "ALL" ? true : event.type === filter
  )

  const handleCreateEvent = async () => {
    try {
      setCreatingEvent(true)
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      })

      if (!response.ok) throw new Error("Failed to create event")

      const createdEvent = await response.json()
      setEvents(prev => [...prev, {
        id: createdEvent.id,
        type: createdEvent.type,
        date: createdEvent.date,
        title: createdEvent.title,
        description: createdEvent.description || "",
        propertyAddress: properties.find(p => p.id === createdEvent.propertyId)?.address || "Propiedad",
        icon: Calendar,
        color: getStyle(createdEvent.type).card,
        badgeColor: getStyle(createdEvent.type).badge,
      }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))

      setShowNewEventDialog(false)
      setNewEvent({
        propertyId: "",
        title: "",
        description: "",
        type: "INSPECTION" as const,
        date: "",
        reminder: 1,
        notifyType: "ME" as "ME" | "TENANT" | "BOTH",
      })

      toast({
        title: "Evento creado",
        description: "El evento se ha agregado al calendario",
      })
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el evento",
        variant: "destructive"
      })
    } finally {
      setCreatingEvent(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete event")

      setEvents(prev => prev.filter(e => e.id !== eventId))
      toast({
        title: "Evento eliminado",
        description: "El evento se ha eliminado del calendario"
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FAF6F2]">Calendario</h1>
          <p className="text-[#9C8578]">Eventos de tus propiedades administradas</p>
        </div>
        <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Evento</DialogTitle>
              <DialogDescription>
                Agrega un evento al calendario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="property">Propiedad</Label>
                <select
                  id="property"
                  value={newEvent.propertyId}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, propertyId: e.target.value }))}
                  className="w-full p-2 rounded bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                >
                  <option value="">Selecciona una propiedad</option>
                  {properties.filter(p => propertyIds.includes(p.id)).map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name || property.address}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="type">Tipo de Evento</Label>
                <select
                  id="type"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 rounded bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                >
                  <option value="INSPECTION">Inspección</option>
                  <option value="PAYMENT_DUE">Recordatorio de Pago</option>
                  <option value="CONTRACT_RENEWAL">Renovación de Contrato</option>
                  <option value="MAINTENANCE">Mantención</option>
                  <option value="TENANT_REMINDER">Recordatorio a Arrendatario</option>
                </select>
              </div>
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título del evento"
                  className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                />
              </div>
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del evento"
                  rows={3}
                  className="w-full p-2 rounded bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateEvent}
                  disabled={creatingEvent || !newEvent.propertyId || !newEvent.title || !newEvent.date}
                  className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
                >
                  {creatingEvent ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Crear Evento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewEventDialog(false)}
                  className="text-[#FAF6F2] border-[#D5C3B6]/20 hover:bg-[#D5C3B6]/20"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
          className={filter === "ALL" ? "bg-[#5E8B8C] text-[#FAF6F2]" : "text-[#FAF6F2] border-[#D5C3B6]/20 hover:bg-[#D5C3B6]/20"}
        >
          Todos
        </Button>
        <Button
          variant={filter === "INSPECTION" ? "default" : "outline"}
          onClick={() => setFilter("INSPECTION")}
          className={filter === "INSPECTION" ? "bg-[#5E8B8C] text-[#FAF6F2]" : "text-[#FAF6F2] border-[#D5C3B6]/20 hover:bg-[#D5C3B6]/20"}
        >
          Inspecciones
        </Button>
        <Button
          variant={filter === "IPC" ? "default" : "outline"}
          onClick={() => setFilter("IPC")}
          className={filter === "IPC" ? "bg-[#5E8B8C] text-[#FAF6F2]" : "text-[#FAF6F2] border-[#D5C3B6]/20 hover:bg-[#D5C3B6]/20"}
        >
          Reajustes IPC
        </Button>
        <Button
          variant={filter === "CONTRACT" ? "default" : "outline"}
          onClick={() => setFilter("CONTRACT")}
          className={filter === "CONTRACT" ? "bg-[#5E8B8C] text-[#FAF6F2]" : "text-[#FAF6F2] border-[#D5C3B6]/20 hover:bg-[#D5C3B6]/20"}
        >
          Contratos
        </Button>
        <Button
          variant={filter === "PAYMENT" ? "default" : "outline"}
          onClick={() => setFilter("PAYMENT")}
          className={filter === "PAYMENT" ? "bg-[#5E8B8C] text-[#FAF6F2]" : "text-[#FAF6F2] border-[#D5C3B6]/20 hover:bg-[#D5C3B6]/20"}
        >
          Pagos
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid gap-4">
        {filteredEvents.length === 0 ? (
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-[#9C8578] mx-auto mb-3 opacity-50" />
              <p className="text-[#9C8578] mb-4">
                {filter === "ALL" ? "No hay eventos programados" : `No hay eventos de tipo ${filter}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className={`border-l-4 ${event.color}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${event.color}`}>
                        <event.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#FAF6F2]">{event.title}</h3>
                        <p className="text-sm text-[#9C8578]">{event.propertyAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={event.badgeColor}>
                        {event.type === "INSPECTION" && "Inspección"}
                        {event.type === "IPC" && "Reajuste IPC"}
                        {event.type === "CONTRACT" && "Contrato"}
                        {event.type === "PAYMENT" && "Pago"}
                        {event.type === "MAINTENANCE" && "Mantención"}
                        {event.type === "TENANT_REMINDER" && "Recordatorio"}
                        {event.type === "CONTRACT_RENEWAL" && "Renovación"}
                        {event.type === "PAYMENT_DUE" && "Recordatorio de Pago"}
                        {event.type === "PAYMENT_OVERDUE" && "Pago Atrasado"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-[#9C8578] hover:text-[#FAF6F2] hover:bg-[#D5C3B6]/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-sm text-[#9C8578] mt-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#9C8578]">
                    <Clock className="h-3 w-3" />
                    {new Date(event.date).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </CardContent>
              </Card>
          ))
        )}
      </div>
    </div>
  )
}
