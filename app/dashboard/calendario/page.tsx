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
  type: "INSPECTION" | "IPC" | "CONTRACT" | "PAYMENT"
  date: string
  title: string
  description: string
  propertyAddress: string
  icon: any
  color: string
  badgeColor: string
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
  return (EVENT_STYLES as any)[type] || EVENT_STYLES.DEFAULT
}

export default function CalendarioPage() {
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
        // Fetch properties first
        const propertiesRes = await fetch("/api/properties")
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

        // Process each property (resto de lógica)
        for (const property of propertiesData) {
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

  const handleCreateEvent = async () => {
    if (!newEvent.propertyId || !newEvent.title || !newEvent.date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      })
      return
    }

    setCreatingEvent(true)
    try {
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: newEvent.propertyId,
          title: newEvent.title,
          description: newEvent.description,
          type: newEvent.type,
          date: newEvent.date,
          reminder: newEvent.reminder,
          notifyTenant: newEvent.notifyType === "BOTH" || newEvent.notifyType === "TENANT",
        }),
      })

      if (!response.ok) throw new Error("Error creating event")

      toast({
        title: "Éxito",
        description: "Evento creado correctamente",
      })

      // Reset form and close dialog
      setNewEvent({
        propertyId: "",
        title: "",
        description: "",
        type: "INSPECTION",
        date: "",
        reminder: 1,
        notifyType: "ME",
      })
      setShowNewEventDialog(false)

      // Reload events
      const loadEvents = async () => {
        try {
          const propertiesRes = await fetch("/api/properties")
          if (!propertiesRes.ok) throw new Error("Failed to load properties")
          const propertiesJson = await propertiesRes.json()
          const properties = Array.isArray(propertiesJson.properties)
            ? propertiesJson.properties
            : Array.isArray(propertiesJson)
              ? propertiesJson
              : []

          const calendarEvents: CalendarEvent[] = []

          for (const property of properties) {
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
          }

          calendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          setEvents(calendarEvents)
        } catch (error) {
          console.error("Error loading calendar events:", error)
        }
      }

      await loadEvents()
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

  const handleEditEvent = async () => {
    if (!editingEvent || !editingEvent.title || !editingEvent.date) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive"
      })
      return
    }

    setUpdatingEvent(true)
    try {
      const res = await fetch(`/api/calendar/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingEvent.title,
          description: editingEvent.description,
          date: editingEvent.date,
          type: editingEvent.type,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Error al actualizar evento")
      }

      toast({
        title: "Éxito",
        description: "Evento actualizado correctamente",
      })

      setShowEditModal(false)
      setEditingEvent(null)

      // Reload events
      setLoading(true)
      const eventsRes = await fetch("/api/calendar/events")
      if (eventsRes.ok) {
        const eventsPayload = await eventsRes.json()
        const savedEvents = Array.isArray(eventsPayload.events) ? eventsPayload.events : []
        const calendarEvents: CalendarEvent[] = []

        const typeIcons: Record<string, any> = {
          INSPECTION: Calendar,
          PAYMENT_DUE: DollarSign,
          CONTRACT_RENEWAL: FileText,
          IPC_ADJUSTMENT: TrendingUp,
          MAINTENANCE: Wrench,
          TENANT_REMINDER: Bell,
        }
        const typeColors: Record<string, string> = {
          INSPECTION: getStyle("INSPECTION").card,
          PAYMENT_DUE: getStyle("PAYMENT_DUE").card,
          CONTRACT_RENEWAL: getStyle("CONTRACT_RENEWAL").card,
          IPC_ADJUSTMENT: getStyle("IPC_ADJUSTMENT").card,
          MAINTENANCE: getStyle("MAINTENANCE").card,
          TENANT_REMINDER: getStyle("TENANT_REMINDER").card,
        }
        const typeBadgeColors: Record<string, string> = {
          INSPECTION: getStyle("INSPECTION").badge,
          PAYMENT_DUE: getStyle("PAYMENT_DUE").badge,
          CONTRACT_RENEWAL: getStyle("CONTRACT_RENEWAL").badge,
          IPC_ADJUSTMENT: getStyle("IPC_ADJUSTMENT").badge,
          MAINTENANCE: getStyle("MAINTENANCE").badge,
          TENANT_REMINDER: getStyle("TENANT_REMINDER").badge,
        }

        savedEvents.forEach((event: any) => {
          calendarEvents.push({
            id: event.id,
            type: event.type,
            date: event.date,
            title: event.title,
            description: event.description || "",
            propertyAddress: event.property?.address || "Propiedad",
            icon: typeIcons[event.type] || Calendar,
            color: typeColors[event.type] || EVENT_STYLES.DEFAULT.card,
            badgeColor: typeBadgeColors[event.type] || EVENT_STYLES.DEFAULT.badge,
          })
        })
        setEvents(calendarEvents)
      }
      setLoading(false)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Error al actualizar evento",
        variant: "destructive"
      })
      setUpdatingEvent(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento?")) {
      return
    }

    setUpdatingEvent(true)
    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Error al eliminar evento")
      }

      toast({
        title: "Éxito",
        description: "Evento eliminado correctamente",
      })

      // Remove from local state
      setEvents(events.filter(e => e.id !== eventId))
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Error al eliminar evento",
        variant: "destructive"
      })
    } finally {
      setUpdatingEvent(false)
    }
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
      {/* Header with Create Event Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendario</h1>
          <p className="text-muted-foreground">Vista consolidada de eventos próximos</p>
        </div>
        <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo evento
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[min(100vw-1.5rem,40rem)] max-w-none sm:max-w-3xl max-h-[min(88vh,44rem)] overflow-y-auto overscroll-contain bg-[#2D3C3C] border-[#D5C3B6]/10 p-4 sm:p-6 gap-3">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-[#FAF6F2]">Crear nuevo evento</DialogTitle>
              <DialogDescription className="text-[#9C8578]">
                Registra un nuevo evento en el calendario para tus propiedades
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 pb-1">
              
              <div>
                <Label htmlFor="propertyId" className="text-[#D5C3B6]">Propiedad *</Label>
                <select
                  id="propertyId"
                  value={newEvent.propertyId}
                  onChange={(e) => setNewEvent({ ...newEvent, propertyId: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-[#1C1917] border border-[#D5C3B6]/20 text-[#FAF6F2]"
                  required
                >
                  <option value="">Selecciona una propiedad</option>
                  {properties.map(prop => (
                    <option key={prop.id} value={prop.id}>
                      {prop.address} - {prop.commune}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-[#D5C3B6]">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Inspección de propiedad"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder-[#9C8578]"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-[#D5C3B6]">Tipo *</Label>
                  <select
                    id="type"
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-md bg-[#1C1917] border border-[#D5C3B6]/20 text-[#FAF6F2]"
                  >
                    <option value="INSPECTION">Inspección</option>
                    <option value="IPC">Reajuste IPC</option>
                    <option value="CONTRACT">Contrato</option>
                    <option value="PAYMENT">Pago</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-[#D5C3B6]">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                  />
                </div>
                <div>
                  <Label htmlFor="reminder" className="text-[#D5C3B6]">Recordatorio (días)</Label>
                  <Input
                    id="reminder"
                    type="number"
                    min="0"
                    value={newEvent.reminder}
                    onChange={(e) => setNewEvent({ ...newEvent, reminder: parseInt(e.target.value) || 0 })}
                    className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-[#D5C3B6]">Descripción</Label>
                <textarea
                  id="description"
                  placeholder="Detalles del evento..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-[#1C1917] border border-[#D5C3B6]/20 text-[#FAF6F2] placeholder-[#9C8578]"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-[#D5C3B6] mb-3 block">Notificación *</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1C1917]/50 border border-[#D5C3B6]/20 cursor-pointer hover:border-[#D5C3B6]/40 transition">
                    <input
                      type="radio"
                      name="notifyType"
                      value="ME"
                      checked={newEvent.notifyType === "ME"}
                      onChange={(e) => setNewEvent({ ...newEvent, notifyType: e.target.value as any })}
                      className="w-4 h-4"
                    />
                    <span className="text-[#FAF6F2]">Solo para mí</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1C1917]/50 border border-[#D5C3B6]/20 cursor-pointer hover:border-[#D5C3B6]/40 transition">
                    <input
                      type="radio"
                      name="notifyType"
                      value="TENANT"
                      checked={newEvent.notifyType === "TENANT"}
                      onChange={(e) => setNewEvent({ ...newEvent, notifyType: e.target.value as any })}
                      className="w-4 h-4"
                    />
                    <span className="text-[#FAF6F2]">Notificar al arrendatario</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1C1917]/50 border border-[#D5C3B6]/20 cursor-pointer hover:border-[#D5C3B6]/40 transition">
                    <input
                      type="radio"
                      name="notifyType"
                      value="BOTH"
                      checked={newEvent.notifyType === "BOTH"}
                      onChange={(e) => setNewEvent({ ...newEvent, notifyType: e.target.value as any })}
                      className="w-4 h-4"
                    />
                    <span className="text-[#FAF6F2]">Notificar a ambos</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleCreateEvent}
                disabled={creatingEvent || !newEvent.propertyId}
                className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
              >
                {creatingEvent ? "Creando..." : "Crear evento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="w-[min(100vw-1.5rem,40rem)] max-w-none sm:max-w-3xl max-h-[min(88vh,44rem)] overflow-y-auto overscroll-contain bg-[#2D3C3C] border-[#D5C3B6]/10 p-4 sm:p-6 gap-3">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-[#FAF6F2]">Editar evento</DialogTitle>
              <DialogDescription className="text-[#9C8578]">
                Modifica los detalles del evento
              </DialogDescription>
            </DialogHeader>
            {editingEvent && (
              <div className="space-y-5 pb-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title" className="text-[#D5C3B6]">Título *</Label>
                    <Input
                      id="edit-title"
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder-[#9C8578]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type" className="text-[#D5C3B6]">Tipo *</Label>
                    <select
                      id="edit-type"
                      value={editingEvent.type}
                      onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-md bg-[#1C1917] border border-[#D5C3B6]/20 text-[#FAF6F2]"
                    >
                      <option value="INSPECTION">Inspección</option>
                      <option value="IPC">Reajuste IPC</option>
                      <option value="CONTRACT">Contrato</option>
                      <option value="PAYMENT">Pago</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-date" className="text-[#D5C3B6]">Fecha *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingEvent.date instanceof Date ? editingEvent.date.toISOString().split('T')[0] : new Date(editingEvent.date).toISOString().split('T')[0]}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description" className="text-[#D5C3B6]">Descripción</Label>
                  <textarea
                    id="edit-description"
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[#1C1917] border border-[#D5C3B6]/20 text-[#FAF6F2] placeholder-[#9C8578]"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingEvent(null)
                    }}
                    disabled={updatingEvent}
                    className="bg-transparent border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEditEvent}
                    disabled={updatingEvent}
                    className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90"
                  >
                    {updatingEvent ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        {(["ALL", "INSPECTION", "IPC", "CONTRACT", "PAYMENT"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
              filter === f
                ? "bg-[#5E8B8C] text-white shadow-md"
                : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
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
                const isOverduePayment = event.type === "PAYMENT" && daysFromNow < 0
                const style = getStyle(event.type, isOverduePayment ? "OVERDUE" : undefined)
                const badgeLabels: Record<string, string> = {
                  INSPECTION: "Inspección",
                  IPC: "Reajuste IPC",
                  CONTRACT: "Contrato",
                  PAYMENT: isOverduePayment ? "Atrasado" : "Pago",
                  PAYMENT_DUE: "Pago pendiente",
                  CONTRACT_RENEWAL: "Contrato",
                  IPC_ADJUSTMENT: "Reajuste IPC",
                  MAINTENANCE: "Mantención",
                  TENANT_REMINDER: "Recordatorio",
                }
                const badgeText = badgeLabels[event.type] ?? event.type
                
                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border-2 transition ${style.card}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-[#FAF6F2]/5 border border-[#D5C3B6]/15">
                          <event.icon className={`h-5 w-5 ${style.icon}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{event.title}</h3>
                            <Badge className={`${style.badge} uppercase tracking-wide text-[10px] font-semibold`}>
                              {badgeText}
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
                      {/* Action buttons for custom calendar events */}
                      {!event.id.includes("-") && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingEvent(event)
                              setShowEditModal(true)
                            }}
                            className="p-2 rounded-md hover:bg-[#5E8B8C]/20 text-[#5E8B8C] transition"
                            title="Editar evento"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={updatingEvent}
                            className="p-2 rounded-md hover:bg-red-100 text-red-600 transition disabled:opacity-50"
                            title="Eliminar evento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
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
