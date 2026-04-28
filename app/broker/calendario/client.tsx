"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  editable?: boolean
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

const typeIcons: Record<string, any> = {
  INSPECTION: Calendar,
  PAYMENT: DollarSign,
  PAYMENT_DUE: DollarSign,
  PAYMENT_OVERDUE: DollarSign,
  CONTRACT: FileText,
  CONTRACT_RENEWAL: FileText,
  IPC_ADJUSTMENT: TrendingUp,
  IPC: TrendingUp,
  MAINTENANCE: Wrench,
  TENANT_REMINDER: Bell,
}

export default function BrokerCalendarClient() {
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

  const decorateEvents = useCallback((rawEvents: any[]): CalendarEvent[] => {
    return rawEvents.map((event) => ({
      id: event.id,
      type: event.type,
      date: event.date,
      title: event.title,
      description: event.description || "",
      propertyAddress: event.propertyAddress || "Propiedad",
      icon: typeIcons[event.type] || Calendar,
      color: getStyle(event.type).card,
      badgeColor: getStyle(event.type).badge,
      editable: Boolean(event.editable),
    }))
  }, [])

  const loadSummary = useCallback(async () => {
    const response = await fetch("/api/calendar/summary?scope=broker", {
      cache: "no-store",
    })
    if (!response.ok) throw new Error("Failed to load calendar summary")
    const data = await response.json()
    setProperties(Array.isArray(data.properties) ? data.properties : [])
    setEvents(decorateEvents(Array.isArray(data.events) ? data.events : []))
  }, [decorateEvents])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        await loadSummary()
      } catch (error) {
        console.error("Error loading calendar events:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos del calendario",
          variant: "destructive"
        })
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [loadSummary, toast])

  const filteredEvents = useMemo(() => (
    filter === "ALL" ? events : events.filter((event) => event.type === filter)
  ), [events, filter])

  const next30Counts = useMemo(() => {
    const now = Date.now()
    const countWithin30 = (type: CalendarEvent["type"]) =>
      filteredEvents.filter((event) => {
        const daysFromNow = Math.floor(
          (new Date(event.date).getTime() - now) / (1000 * 60 * 60 * 24)
        )
        return event.type === type && daysFromNow <= 30
      }).length

    return {
      inspections: countWithin30("INSPECTION"),
      ipc: countWithin30("IPC"),
      contracts: countWithin30("CONTRACT"),
      payments: countWithin30("PAYMENT"),
    }
  }, [filteredEvents])

  const urgentEvents = useMemo(() => {
    const now = Date.now()
    return filteredEvents.filter((event) => {
      const daysFromNow = Math.floor(
        (new Date(event.date).getTime() - now) / (1000 * 60 * 60 * 24)
      )
      return daysFromNow < 7 || (event.type === "PAYMENT" && daysFromNow < 0)
    })
  }, [filteredEvents])

  const handleCreateEvent = async () => {
    try {
      setCreatingEvent(true)
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      })

      if (!response.ok) throw new Error("Failed to create event")

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

      await loadSummary()
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

      setEvents((current) => current.filter((event) => event.id !== eventId))
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
                  {properties.map(property => (
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
                      {event.editable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-[#9C8578] hover:text-[#FAF6F2] hover:bg-[#D5C3B6]/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardHeader>
            <CardTitle className="text-[#FAF6F2] text-lg">Resumen de próximos 30 días</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#9C8578]">Inspecciones:</span>
              <span className="font-semibold text-[#FAF6F2]">{next30Counts.inspections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9C8578]">Reajustes IPC:</span>
              <span className="font-semibold text-[#FAF6F2]">{next30Counts.ipc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9C8578]">Contratos por vencer:</span>
              <span className="font-semibold text-[#FAF6F2]">{next30Counts.contracts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9C8578]">Pagos:</span>
              <span className="font-semibold text-[#FAF6F2]">{next30Counts.payments}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardHeader>
            <CardTitle className="text-[#FAF6F2] text-lg">Eventos urgentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgentEvents.slice(0, 5).map((event) => {
              const daysFromNow = Math.floor(
                (new Date(event.date).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )

              return (
                <div key={event.id} className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      daysFromNow < 0 ? "bg-red-500" : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-[#9C8578]">{event.title}</span>
                </div>
              )
            })}
            {urgentEvents.length === 0 && (
              <p className="text-sm text-[#9C8578]">No hay eventos urgentes</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
