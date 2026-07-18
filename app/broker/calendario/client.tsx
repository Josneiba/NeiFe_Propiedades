"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Calendar as CalendarIcon, Check, CheckSquare, ChevronDown, DollarSign, FileText, Filter, Loader2, MoreVertical, Plus, Search, Trash2, TrendingUp, Wrench } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar as MonthCalendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePageHeader } from "@/components/layout/header-controls-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  id: string
  type: "INSPECTION" | "IPC" | "CONTRACT" | "PAYMENT" | "MAINTENANCE" | "TENANT_REMINDER" | "CONTRACT_RENEWAL" | "PAYMENT_DUE" | "PAYMENT_OVERDUE" | "IPC_ADJUSTMENT" | "OTHER"
  date: string
  title: string
  description: string
  propertyAddress: string
  icon: any
  editable?: boolean
}

const typeIcons: Record<string, any> = {
  INSPECTION: CalendarIcon,
  PAYMENT: DollarSign,
  PAYMENT_DUE: DollarSign,
  PAYMENT_OVERDUE: DollarSign,
  CONTRACT: FileText,
  CONTRACT_RENEWAL: FileText,
  IPC_ADJUSTMENT: TrendingUp,
  IPC: TrendingUp,
  MAINTENANCE: Wrench,
  TENANT_REMINDER: AlertCircle,
  OTHER: CalendarIcon,
}

const typeLabels: Record<string, string> = {
  ALL: "Todo",
  INSPECTION: "Inspecciones",
  IPC: "IPC",
  CONTRACT: "Contratos",
  PAYMENT: "Pagos",
  MAINTENANCE: "Mantenciones",
  TENANT_REMINDER: "Recordatorios",
  CONTRACT_RENEWAL: "Renovaciones",
  PAYMENT_DUE: "Cobros",
  PAYMENT_OVERDUE: "Atrasados",
  OTHER: "Otros",
}

const eventColorByType: Record<string, { bg: string; rail: string; text: string }> = {
  INSPECTION: { bg: "#4c5058", rail: "#d889ff", text: "#faf6f2" },
  IPC: { bg: "#53504d", rail: "#f2c94c", text: "#faf6f2" },
  IPC_ADJUSTMENT: { bg: "#53504d", rail: "#f2c94c", text: "#faf6f2" },
  CONTRACT: { bg: "#4d564e", rail: "#83d7a0", text: "#faf6f2" },
  CONTRACT_RENEWAL: { bg: "#4d564e", rail: "#83d7a0", text: "#faf6f2" },
  PAYMENT: { bg: "#574f49", rail: "#f2d6b3", text: "#faf6f2" },
  PAYMENT_DUE: { bg: "#574f49", rail: "#f2d6b3", text: "#faf6f2" },
  PAYMENT_OVERDUE: { bg: "#5a4144", rail: "#ff7b9d", text: "#faf6f2" },
  MAINTENANCE: { bg: "#50564f", rail: "#73d59a", text: "#faf6f2" },
  TENANT_REMINDER: { bg: "#514953", rail: "#df8cff", text: "#faf6f2" },
  OTHER: { bg: "#4d4d4d", rail: "#c7ccd1", text: "#faf6f2" },
}

type FilterValue = "ALL" | "INSPECTION" | "IPC" | "CONTRACT" | "PAYMENT"
type ViewMode = "schedule" | "day" | "week" | "tasks"

const hours = Array.from({ length: 18 }, (_, index) => 6 + index)
const slotHeight = 64

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dateInputValue(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function formatHeaderDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function filterMatches(event: CalendarEvent, currentFilter: FilterValue) {
  if (currentFilter === "ALL") return true
  if (currentFilter === "INSPECTION") return event.type === "INSPECTION"
  if (currentFilter === "IPC") return event.type === "IPC" || event.type === "IPC_ADJUSTMENT"
  if (currentFilter === "CONTRACT") return event.type === "CONTRACT" || event.type === "CONTRACT_RENEWAL"
  if (currentFilter === "PAYMENT") return event.type === "PAYMENT" || event.type === "PAYMENT_DUE" || event.type === "PAYMENT_OVERDUE"
  return false
}

export default function BrokerCalendarClient() {
  const { toast } = useToast()
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>("ALL")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [now, setNow] = useState(new Date())
  const [dateDialogOpen, setDateDialogOpen] = useState(false)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [searchQuery, setSearchQuery] = useState("")
  const [newEvent, setNewEvent] = useState({
    propertyId: "",
    title: "",
    description: "",
    type: "INSPECTION" as const,
    date: dateInputValue(new Date()),
    reminder: 1,
    notifyType: "ME" as "ME" | "TENANT" | "BOTH",
  })

  const decorateEvents = useCallback((rawEvents: any[]): CalendarEvent[] => {
    return rawEvents.map((event) => ({
      id: event.id,
      type: event.type || "OTHER",
      date: event.date,
      title: event.title,
      description: event.description || "",
      propertyAddress: event.propertyAddress || "Propiedad",
      icon: typeIcons[event.type] || CalendarIcon,
      editable: Boolean(event.editable),
    }))
  }, [])

  const loadSummary = useCallback(async () => {
    const response = await fetch("/api/calendar/summary?scope=broker", { cache: "no-store" })
    if (!response.ok) throw new Error("Failed to load calendar summary")
    const data = await response.json()
    setProperties(Array.isArray(data.properties) ? data.properties : [])
    setEvents(decorateEvents(Array.isArray(data.events) ? data.events : []))
  }, [decorateEvents])

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(start)
      value.setDate(start.getDate() + index)
      return value
    })
  }, [selectedDate])

  const visibleEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return events
      .filter((event) => filterMatches(event, filter))
      .filter((event) => (viewMode === "tasks" ? event.type === "TENANT_REMINDER" || event.type === "MAINTENANCE" : true))
      .filter((event) => sameDay(new Date(event.date), selectedDate))
      .filter((event) => {
        if (!normalizedSearch) return true
        return `${event.title} ${event.description} ${event.propertyAddress}`.toLowerCase().includes(normalizedSearch)
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, filter, searchQuery, selectedDate, viewMode])

  const currentLineTop = ((now.getHours() - 6) * 60 + now.getMinutes()) / 60 * slotHeight
  const currentDayIsSelected = sameDay(now, selectedDate)

  const scrollToCurrentTime = useCallback(() => {
    const top = Math.max(0, currentLineTop - 120)
    timelineRef.current?.scrollTo({ top, behavior: "smooth" })
  }, [currentLineTop])

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
          variant: "destructive",
        })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [loadSummary, toast])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!loading) window.setTimeout(scrollToCurrentTime, 120)
  }, [loading, selectedDate, scrollToCurrentTime])

  const toggleSelectedEvent = (id: string) => {
    setSelectedEventIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete event")
      setEvents((current) => current.filter((event) => event.id !== eventId))
      setSelectedEventIds((current) => current.filter((id) => id !== eventId))
      toast({ title: "Evento eliminado", description: "El evento se ha eliminado del calendario" })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({ title: "Error", description: "No se pudo eliminar el evento", variant: "destructive" })
    }
  }

  const handleCreateEvent = async () => {
    if (!newEvent.propertyId || !newEvent.title.trim() || !newEvent.date) {
      toast({ title: "Faltan datos", description: "Completa propiedad, título y fecha.", variant: "destructive" })
      return
    }

    try {
      setCreatingEvent(true)
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: newEvent.propertyId,
          title: newEvent.title,
          description: newEvent.description,
          type: newEvent.type,
          date: new Date(newEvent.date).toISOString(),
          reminder: newEvent.reminder,
          notifyTenant: newEvent.notifyType === "BOTH" || newEvent.notifyType === "TENANT",
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to create event")

      setShowNewEventDialog(false)
      setNewEvent({
        propertyId: properties[0]?.id ?? "",
        title: "",
        description: "",
        type: "INSPECTION",
        date: dateInputValue(selectedDate),
        reminder: 1,
        notifyType: "ME",
      })
      await loadSummary()
      toast({ title: "Evento creado", description: "El evento se agregó al calendario." })
    } catch (error) {
      console.error("Error creating event:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo crear el evento", variant: "destructive" })
    } finally {
      setCreatingEvent(false)
    }
  }

  useEffect(() => {
    setNewEvent((current) => ({ ...current, propertyId: current.propertyId || properties[0]?.id || "" }))
  }, [properties])

  const DateTrigger = (
    <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
      <DialogTrigger asChild>
        <button className="flex max-w-[132px] items-center gap-1 truncate text-left text-[15px] font-semibold text-[#FAF6F2]">
          <span className="truncate">{formatHeaderDate(selectedDate)}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#9C8578]" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-32px)] max-w-sm rounded-[28px] border-[#3a3a3a] bg-[#272727] p-0 text-[#FAF6F2]">
        <div className="border-b border-white/10 p-6">
          <p className="text-sm font-semibold text-[#D5C3B6]">Seleccionar fecha</p>
          <p className="mt-8 text-5xl font-light tracking-normal text-[#E8E8E8]">
            {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="p-4">
          <MonthCalendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="mx-auto bg-transparent text-[#FAF6F2]"
            classNames={{
              caption_label: "text-[#D5C3B6] text-base font-semibold",
              weekday: "text-[#D5C3B6] font-medium",
              day: "text-[#E8E8E8]",
              today: "bg-transparent text-[#FAF6F2]",
            }}
          />
        </div>
        <DialogFooter className="flex-row justify-end gap-4 p-6 pt-0">
          <Button variant="ghost" onClick={() => setDateDialogOpen(false)} className="text-[#ff9fc2] hover:bg-white/5 hover:text-[#ffb3cf]">
            Cancelar
          </Button>
          <Button variant="ghost" onClick={() => setDateDialogOpen(false)} className="text-[#ff9fc2] hover:bg-white/5 hover:text-[#ffb3cf]">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  usePageHeader({
    title: DateTrigger,
    subtitle: "Agenda diaria",
    controls: (
      <>
        <button onClick={scrollToCurrentTime} className="rounded-full p-2 text-[#ff9fc2] hover:bg-white/5" aria-label="Ir a la hora actual">
          <CalendarIcon className="h-5 w-5" />
        </button>
        <button onClick={() => setFilterPanelOpen((value) => !value)} className="rounded-full p-2 text-[#D5C3B6] hover:bg-white/5" aria-label="Filtros">
          <Filter className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setSelectMode((value) => !value)
            setSelectedEventIds([])
          }}
          className={cn("rounded-full p-2 hover:bg-white/5", selectMode ? "text-[#ff9fc2]" : "text-[#D5C3B6]")}
          aria-label="Seleccionar eventos"
        >
          <CheckSquare className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full p-2 text-[#D5C3B6] hover:bg-white/5" aria-label="Opciones">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-[#2f2f2f] bg-[#202020] p-2 text-[#FAF6F2]">
            <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="gap-3 rounded-lg px-3 py-3">
              <Search className="h-4 w-4" />
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar" className="h-8 border-0 bg-transparent p-0 text-[#FAF6F2] placeholder:text-[#9C8578] focus-visible:ring-0" />
            </DropdownMenuItem>
            <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <DropdownMenuRadioItem value="schedule" className="rounded-lg px-3 py-3">Agenda</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="day" className="rounded-lg px-3 py-3">Día</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="week" className="rounded-lg px-3 py-3">Semana</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="tasks" className="rounded-lg px-3 py-3">Tareas</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    ),
  }, [DateTrigger, dateDialogOpen, filterPanelOpen, searchQuery, selectMode, selectedDate, viewMode])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff9fc2]" />
      </div>
    )
  }

  return (
    <div className="-mx-4 -mb-4 -mt-4 min-h-[calc(100vh-57px)] bg-[#101010] text-[#FAF6F2] lg:-m-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-57px)] max-w-5xl flex-col overflow-hidden bg-[#101010] lg:min-h-screen">
        {filterPanelOpen && (
          <div className="absolute right-3 top-3 z-20 w-[calc(100%-24px)] rounded-lg border border-white/10 bg-[#202020] p-3 shadow-2xl sm:w-80">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Filtros</p>
              <button onClick={() => setFilterPanelOpen(false)} className="text-xs font-semibold text-[#ff9fc2]">Cerrar</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["ALL", "INSPECTION", "IPC", "CONTRACT", "PAYMENT"] as FilterValue[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={cn("rounded-md border px-3 py-2 text-left text-xs font-semibold", filter === value ? "border-[#ff9fc2] bg-[#8d1c4f] text-white" : "border-white/10 bg-[#2b2b2b] text-[#D5C3B6]")}
                >
                  {typeLabels[value]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="shrink-0 border-b border-white/10">
          <div className="flex gap-0 overflow-x-auto">
            {weekDays.map((day) => {
              const active = sameDay(day, selectedDate)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-w-[86px] border-r border-black bg-[#464c50] px-3 py-2 text-center text-[#d4d4d4]",
                    active && "border-2 border-[#ff9fc2] bg-[#111111] text-[#FAF6F2]",
                  )}
                >
                  <div className="text-sm font-semibold">{day.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "")}</div>
                  <div className="text-2xl font-light leading-tight">{day.getDate()}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div ref={timelineRef} className="relative flex-1 overflow-y-auto pb-24">
          <div className="relative min-h-full" style={{ height: `${hours.length * slotHeight}px` }}>
            <div className="absolute inset-y-0 left-0 w-[58px] bg-[#101010]">
              {hours.map((hour) => (
                <div key={hour} className="relative border-b border-white/10 text-right text-sm text-[#d0d0d0]" style={{ height: `${slotHeight}px` }}>
                  <span className="absolute right-2 top-[-10px]">{hour}:00</span>
                </div>
              ))}
            </div>
            <div className="absolute inset-y-0 left-[58px] right-0">
              {hours.map((hour) => (
                <div key={hour} className="border-b border-white/10" style={{ height: `${slotHeight}px` }} />
              ))}
              {currentDayIsSelected && currentLineTop >= 0 && currentLineTop <= hours.length * slotHeight && (
                <div className="absolute left-0 right-0 z-10 flex items-center" style={{ top: `${currentLineTop}px` }}>
                  <div className="h-0 w-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-[#ff9fc2]" />
                  <div className="h-px flex-1 bg-[#ff9fc2]" />
                </div>
              )}
              {visibleEvents.map((event, index) => {
                const eventStart = new Date(event.date)
                const minutesFromStart = Math.max(0, (eventStart.getHours() - 6) * 60 + eventStart.getMinutes())
                const top = (minutesFromStart / 60) * slotHeight
                const style = eventColorByType[event.type] || eventColorByType.OTHER
                const Icon = event.icon
                const isSelected = selectedEventIds.includes(event.id)
                const stackedOffset = (index % 2) * 46

                return (
                  <button
                    key={event.id}
                    onClick={() => (selectMode ? toggleSelectedEvent(event.id) : undefined)}
                    className={cn("absolute z-[5] overflow-hidden border-b border-black/40 py-1 pl-3 pr-2 text-left shadow-sm", selectMode && "ring-1 ring-white/20", isSelected && "ring-2 ring-[#ff9fc2]")}
                    style={{
                      top: `${top}px`,
                      left: `${stackedOffset}px`,
                      right: "0px",
                      minHeight: "48px",
                      backgroundColor: style.bg,
                      color: style.text,
                      borderLeft: `4px solid ${style.rail}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 shrink-0 text-white/80" />
                          <span className="truncate text-sm font-semibold">{event.title}</span>
                          <span className="shrink-0 text-xs text-white/65">
                            {eventStart.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-white/70">{event.propertyAddress}</p>
                      </div>
                      {selectMode ? (
                        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/40", isSelected && "border-[#ff9fc2] bg-[#ff9fc2] text-black")}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </span>
                      ) : event.editable ? (
                        <span
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation()
                            void handleDeleteEvent(event.id)
                          }}
                          className="rounded p-1 text-white/60 hover:bg-black/20 hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
              {visibleEvents.length === 0 && (
                <div className="absolute left-4 right-4 top-32 rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-[#9C8578]">
                  No hay eventos para este día.
                </div>
              )}
            </div>
          </div>
        </div>

        {selectMode && (
          <div className="absolute bottom-24 left-3 right-3 z-20 rounded-lg bg-[#202020] p-3 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{selectedEventIds.length} seleccionados</p>
              <Button size="sm" variant="ghost" onClick={() => setSelectedEventIds(visibleEvents.map((event) => event.id))} className="text-[#ff9fc2]">
                Seleccionar todo
              </Button>
            </div>
          </div>
        )}

        <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
          <DialogTrigger asChild>
            <button className="absolute bottom-8 right-6 z-30 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#ad0056] text-white shadow-2xl">
              <Plus className="h-8 w-8" />
            </button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-24px)] max-w-lg border-[#2f2f2f] bg-[#202020] text-[#FAF6F2]">
            <DialogHeader>
              <DialogTitle>Nuevo evento</DialogTitle>
              <DialogDescription className="text-[#D5C3B6]">Crea un bloque conectado al calendario de NeiFe.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Propiedad</Label>
                <select value={newEvent.propertyId} onChange={(event) => setNewEvent((current) => ({ ...current, propertyId: event.target.value }))} className="h-10 rounded-md border border-white/10 bg-[#111111] px-3 text-sm">
                  <option value="">Selecciona una propiedad</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>{property.address || property.name || property.id}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Título</Label>
                <Input value={newEvent.title} onChange={(event) => setNewEvent((current) => ({ ...current, title: event.target.value }))} className="border-white/10 bg-[#111111]" />
              </div>
              <div className="grid gap-2">
                <Label>Fecha y hora</Label>
                <Input type="datetime-local" value={newEvent.date} onChange={(event) => setNewEvent((current) => ({ ...current, date: event.target.value }))} className="border-white/10 bg-[#111111]" />
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <select value={newEvent.type} onChange={(event) => setNewEvent((current) => ({ ...current, type: event.target.value as typeof newEvent.type }))} className="h-10 rounded-md border border-white/10 bg-[#111111] px-3 text-sm">
                  <option value="INSPECTION">Inspección</option>
                  <option value="PAYMENT_DUE">Recordatorio de pago</option>
                  <option value="CONTRACT_RENEWAL">Renovación de contrato</option>
                  <option value="MAINTENANCE">Mantención</option>
                  <option value="TENANT_REMINDER">Recordatorio a arrendatario</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Descripción</Label>
                <Textarea value={newEvent.description} onChange={(event) => setNewEvent((current) => ({ ...current, description: event.target.value }))} className="border-white/10 bg-[#111111]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowNewEventDialog(false)} className="text-[#D5C3B6]">Cancelar</Button>
              <Button onClick={() => void handleCreateEvent()} disabled={creatingEvent} className="bg-[#ad0056] text-white hover:bg-[#97004b]">
                {creatingEvent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
