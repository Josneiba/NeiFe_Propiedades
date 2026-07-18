"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePageHeader } from '@/components/layout/header-controls-context'
import { Calendar as CalendarIcon, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, Filter, ListChecks, MoreHorizontal, MoreVertical, Plus, Repeat2, Search, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'

interface ScheduledDeal {
  id: string
  code: string
  title: string
  stage: string
  value: number | null
  dueDate: Date
  property?: { address: string }
}

interface TimelineEvent {
  id: string
  title: string
  subtitle: string
  start: Date
  end: Date
  category: 'Visitas' | 'Pagos' | 'Mantenciones' | 'Vencimientos de Contrato' | 'Tareas'
  color: string
  kind: 'activity' | 'task' | 'calendar'
  recurring?: boolean
}

const CATEGORY_OPTIONS = [
  { key: 'Visitas', label: 'Visitas' },
  { key: 'Pagos', label: 'Pagos' },
  { key: 'Mantenciones', label: 'Mantenciones' },
  { key: 'Vencimientos de Contrato', label: 'Vencimientos' },
  { key: 'Tareas', label: 'Tareas' },
] as const

const CATEGORY_COLORS: Record<TimelineEvent['category'], string> = {
  Visitas: '#5E8B8C',
  Pagos: '#C27F79',
  Mantenciones: '#B8965A',
  'Vencimientos de Contrato': '#F2C94C',
  Tareas: '#2D3C3C',
}

export function CrmCalendarClient({ initialDeals }: { initialDeals: ScheduledDeal[] }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [deals, setDeals] = useState<ScheduledDeal[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [activeFilters, setActiveFilters] = useState<Record<TimelineEvent['category'], boolean>>({
    Visitas: true,
    Pagos: true,
    Mantenciones: true,
    'Vencimientos de Contrato': true,
    Tareas: true,
  })
  const [fabOpen, setFabOpen] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [now, setNow] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<'task' | 'payment' | 'visit' | 'contact' | 'event' | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formPriority, setFormPriority] = useState('1')
  const [formPropertyId, setFormPropertyId] = useState('')
  const [formType, setFormType] = useState('OTHER')
  const [formContact, setFormContact] = useState('')
  const [calendarPopoverOpen, setCalendarPopoverOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'schedule' | 'tasks'>('day')
  const timelineContainerRef = useRef<HTMLDivElement | null>(null)
  const dayStripRef = useRef<HTMLDivElement | null>(null)
  const [dayStripAnchor, setDayStripAnchor] = useState<Date>(() => {
    const anchor = new Date()
    anchor.setDate(anchor.getDate() - 14)
    anchor.setHours(0, 0, 0, 0)
    return anchor
  })

  useEffect(() => { setDeals(initialDeals) }, [initialDeals])
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])
  useEffect(() => { void loadAgendaData() }, [])

  async function loadAgendaData() {
    try {
      const [activitiesRes, tasksRes, eventsRes, propertiesRes] = await Promise.all([
        fetch('/api/crm/activities'),
        fetch('/api/crm/tasks'),
        fetch('/api/calendar/events'),
        fetch('/api/broker/properties'),
      ])

      if (activitiesRes.ok) setActivities(await activitiesRes.json())
      if (tasksRes.ok) {
        const taskPayload = await tasksRes.json()
        setTasks(Array.isArray(taskPayload?.manualTasks) ? taskPayload.manualTasks : [])
      }
      if (eventsRes.ok) {
        const eventPayload = await eventsRes.json()
        setCalendarEvents(Array.isArray(eventPayload?.events) ? eventPayload.events : [])
      }
      if (propertiesRes.ok) {
        const propertyPayload = await propertiesRes.json()
        setProperties(Array.isArray(propertyPayload?.properties) ? propertyPayload.properties : [])
      }
    } catch (error) {
      console.error(error)
      toast.error('No se pudo cargar la agenda')
    }
  }

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate)
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(start)
      value.setDate(start.getDate() + index)
      return value
    })
  }, [selectedDate])

  const dayStripDays = useMemo(() => {
    const start = new Date(dayStripAnchor)
    return Array.from({ length: 21 }, (_, index) => {
      const value = new Date(start)
      value.setDate(start.getDate() + index)
      return value
    })
  }, [dayStripAnchor])

  useEffect(() => {
    if (!dayStripRef.current) return
    const selectedKey = selectedDate.toISOString()
    const selectedButton = dayStripRef.current.querySelector<HTMLButtonElement>(`[data-day="${selectedKey}"]`)
    if (selectedButton) {
      selectedButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedDate, dayStripDays])

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const mapped: TimelineEvent[] = []

    for (const activity of activities) {
      if (!activity.scheduledAt) continue
      const start = new Date(activity.scheduledAt)
      const end = new Date(start.getTime() + 60 * 60_000)
      const category = activity.type === 'VISITA' ? 'Visitas' : 'Tareas'
      mapped.push({
        id: `activity-${activity.id}`,
        title: activity.title,
        subtitle: activity.description ?? 'Actividad CRM',
        start,
        end,
        category,
        color: CATEGORY_COLORS[category],
        kind: 'activity',
      })
    }

    for (const task of tasks) {
      if (!task.dueDate) continue
      const start = new Date(task.dueDate)
      const end = new Date(start.getTime() + 45 * 60_000)
      mapped.push({
        id: `task-${task.id}`,
        title: task.title,
        subtitle: task.description ?? 'Tarea pendiente',
        start,
        end,
        category: 'Tareas',
        color: CATEGORY_COLORS.Tareas,
        kind: 'task',
        recurring: task.title.toLowerCase().includes('cobro') || task.title.toLowerCase().includes('mant') || task.title.toLowerCase().includes('mensual'),
      })
    }

    for (const event of calendarEvents) {
      if (!event.date) continue
      const start = new Date(event.date)
      const end = new Date(start.getTime() + 60 * 60_000)
      const category = event.type === 'PAYMENT_DUE'
        ? 'Pagos'
        : event.type === 'MAINTENANCE'
          ? 'Mantenciones'
          : event.type === 'CONTRACT_RENEWAL'
            ? 'Vencimientos de Contrato'
            : 'Visitas'
      mapped.push({
        id: `calendar-${event.id}`,
        title: event.title,
        subtitle: event.description ?? 'Evento del calendario',
        start,
        end,
        category,
        color: CATEGORY_COLORS[category],
        kind: 'calendar',
        recurring: event.type === 'PAYMENT_DUE' || event.type === 'MAINTENANCE',
      })
    }

    for (const deal of deals) {
      const start = new Date(deal.dueDate)
      const end = new Date(start.getTime() + 60 * 60_000)
      mapped.push({
        id: `deal-${deal.id}`,
        title: deal.code,
        subtitle: deal.title,
        start,
        end,
        category: 'Vencimientos de Contrato',
        color: CATEGORY_COLORS['Vencimientos de Contrato'],
        kind: 'calendar',
      })
    }

    return mapped
  }, [activities, tasks, calendarEvents, deals])

  const visibleEvents = useMemo(() => {
    const sameDate = (value: Date) => value.toDateString() === selectedDate.toDateString()
    const sameWeek = (value: Date) => weekDays.some((day) => day.toDateString() === value.toDateString())
    const searchTerm = searchQuery.trim().toLowerCase()

    return timelineEvents
      .filter((item) => {
        const matchesFilter = activeFilters[item.category]
        const matchesSearch =
          searchTerm.length === 0 ||
          item.title.toLowerCase().includes(searchTerm) ||
          item.subtitle.toLowerCase().includes(searchTerm) ||
          item.category.toLowerCase().includes(searchTerm)

        if (!matchesFilter || !matchesSearch) return false
        if (viewMode === 'week') return sameWeek(item.start)
        if (viewMode === 'tasks') return item.category === 'Tareas'
        return sameDate(item.start)
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [activeFilters, searchQuery, selectedDate, timelineEvents, viewMode, weekDays])

  const hours = Array.from({ length: 17 }, (_, index) => 6 + index)
  const currentLineTop = ((now.getHours() - 6) * 60 + now.getMinutes()) / 60 * 60
  const currentDayIsSelected = now.toDateString() === selectedDate.toDateString()

  const moveDay = (direction: 'prev' | 'next') => {
    const next = new Date(selectedDate)
    next.setDate(selectedDate.getDate() + (direction === 'prev' ? -1 : 1))
    setSelectedDate(next)
  }

  const toggleFilter = (category: TimelineEvent['category']) => {
    setActiveFilters((value) => ({ ...value, [category]: !value[category] }))
  }

  const goToNow = () => {
    const today = new Date()
    setSelectedDate(today)
    setTimeout(() => {
      if (!timelineContainerRef.current) return
      const nowTop = ((now.getHours() - 6) * 60 + now.getMinutes())
      timelineContainerRef.current.scrollTo({ top: Math.max(0, nowTop - 120), behavior: 'smooth' })
    }, 100)
  }

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((value) =>
      value.includes(eventId) ? value.filter((id) => id !== eventId) : [...value, eventId],
    )
  }

  const selectAllVisibleEvents = () => {
    setSelectedEventIds(visibleEvents.map((event) => event.id))
  }

  const deleteSelectedEvents = async () => {
    const calendarEventIds = selectedEventIds
      .filter((eventId) => eventId.startsWith('calendar-'))
      .map((eventId) => eventId.replace(/^calendar-/, ''))

    if (calendarEventIds.length === 0) {
      toast.error('Solo se pueden eliminar los eventos del calendario directamente.')
      return
    }

    try {
      await Promise.all(
        calendarEventIds.map((eventId) =>
          fetch(`/api/calendar/events/${eventId}`, {
            method: 'DELETE',
          }),
        ),
      )
      toast.success('Eventos eliminados')
      setSelectedEventIds([])
      await loadAgendaData()
    } catch (error) {
      console.error(error)
      toast.error('No se pudo eliminar los eventos seleccionados')
    }
  }

  const dateSelector = (
    <Popover open={calendarPopoverOpen} onOpenChange={setCalendarPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border border-[#2D3C3C] px-3 py-2 text-sm font-semibold text-[#FAF6F2]"
          aria-label="Abrir selector de fecha"
        >
          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
          <ChevronDown className="h-4 w-4 text-[#9C8578]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-[#1a2a2a] border border-[#2D3C3C] p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return
            setSelectedDate(date)
            setCalendarPopoverOpen(false)
          }}
          className="bg-[#1a2a2a] text-[#FAF6F2]"
        />
      </PopoverContent>
    </Popover>
  )

  const headerControls = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={goToNow}
        className="rounded-full border border-[#2D3C3C] p-2 text-[#9C8578]"
        aria-label="Ir a la hora actual"
      >
        <CalendarIcon className="h-4 w-4" />
      </button>

      <Popover open={showFilterMenu} onOpenChange={setShowFilterMenu}>
        <PopoverTrigger asChild>
          <button
            className="relative rounded-full border border-[#2D3C3C] p-2 text-[#D5C3B6]"
            aria-label="Abrir filtros"
          >
            <Filter className="h-4 w-4" />
            {!Object.values(activeFilters).every(Boolean) && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#C27F79]" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="bg-[#1a2a2a] border border-[#2D3C3C] p-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => toggleFilter(option.key as TimelineEvent['category'])}
                className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
                  activeFilters[option.key as TimelineEvent['category']]
                    ? 'bg-[#5E8B8C] text-[#FAF6F2]'
                    : 'bg-[#2D3C3C] text-[#9C8578]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={() => setSelectionMode((value) => !value)}
        className={`rounded-full border border-[#2D3C3C] bg-[#121b1b] p-2 text-[#FAF6F2] ${selectionMode ? 'border-[#C27F79]' : ''}`}
        aria-label="Seleccionar múltiples eventos"
      >
        <Square className={selectionMode ? 'h-4 w-4 text-[#C27F79]' : 'h-4 w-4 text-[#D5C3B6]'} />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full border border-[#2D3C3C] p-2 text-[#D5C3B6]"
            aria-label="Opciones de vista"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1a2a2a] border border-[#2D3C3C]">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSearchOpen((value) => !value)}>
            <Search className="h-4 w-4" />
            Buscar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewMode('schedule')}>
            <CalendarDays className="h-4 w-4" />
            Schedule
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewMode('day')}>
            <ChevronRight className="h-4 w-4" />
            Day view
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewMode('week')}>
            <ChevronLeft className="h-4 w-4" />
            Week view
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewMode('tasks')}>
            <ListChecks className="h-4 w-4" />
            Tareas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {searchOpen && (
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar eventos, tareas o visitas"
          className="min-w-[220px] border-[#2D3C3C] bg-[#121b1b] text-[#FAF6F2]"
        />
      )}
    </div>
  )

  usePageHeader({ title: dateSelector, subtitle: null, controls: headerControls }, [selectedDate, showFilterMenu, calendarPopoverOpen, searchOpen, selectionMode, viewMode, activeFilters])

  const openQuickActionForm = (action: 'task' | 'payment' | 'visit' | 'contact' | 'event') => {
    setFabOpen(false)
    setModalAction(action)
    const start = new Date(selectedDate)
    start.setHours(9, 0, 0, 0)
    setFormTitle(action === 'task' ? 'Nueva tarea' : action === 'payment' ? 'Cobro programado' : action === 'visit' ? 'Visita agendada' : action === 'contact' ? 'Contacto registrado' : 'Evento de agenda')
    setFormDescription('')
    setFormDate(start.toISOString().slice(0, 16))
    setFormPriority('1')
    setFormPropertyId(properties[0]?.id ?? '')
    setFormType('OTHER')
    setFormContact('')
    setModalOpen(true)
  }

  const submitQuickAction = async () => {
    if (!modalAction) return

    try {
      const start = new Date(formDate)
      const propertyId = formPropertyId || properties[0]?.id

      if (modalAction === 'task') {
        await fetch('/api/crm/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'SEGUIMIENTO',
            title: formTitle,
            description: formDescription,
            dueDate: start.toISOString(),
            priority: Number(formPriority),
          }),
        })
      } else if (modalAction === 'payment') {
        if (!propertyId) throw new Error('No hay propiedad disponible')
        await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            type: 'PAYMENT_DUE',
            date: start.toISOString(),
            propertyId,
          }),
        })
      } else if (modalAction === 'visit') {
        await fetch('/api/crm/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'VISITA',
            title: formTitle,
            description: formDescription,
            scheduledAt: start.toISOString(),
            isDone: false,
          }),
        })
      } else if (modalAction === 'contact') {
        await fetch('/api/crm/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'LLAMADA',
            title: formTitle,
            description: formDescription || `Contacto ${formContact || 'asociado'}`,
            scheduledAt: start.toISOString(),
            isDone: false,
          }),
        })
      } else {
        if (!propertyId) throw new Error('No hay propiedad disponible')
        await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            type: formType as any,
            date: start.toISOString(),
            propertyId,
          }),
        })
      }

      setModalOpen(false)
      await loadAgendaData()
      toast.success('Registro creado correctamente')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo crear el registro')
    }
  }

  const moveEvent = async (event: TimelineEvent, deltaMinutes: number, dayDelta: number) => {
    const nextStart = new Date(event.start)
    nextStart.setMinutes(nextStart.getMinutes() + deltaMinutes)
    nextStart.setDate(nextStart.getDate() + dayDelta)
    const nextEnd = new Date(nextStart.getTime() + (event.end.getTime() - event.start.getTime()))

    try {
      const id = event.id.replace(/^(activity|task|calendar)-/, '')
      if (event.kind === 'calendar') {
        const calendarType = event.category === 'Pagos'
          ? 'PAYMENT_DUE'
          : event.category === 'Mantenciones'
            ? 'MAINTENANCE'
            : event.category === 'Vencimientos de Contrato'
              ? 'CONTRACT_RENEWAL'
              : 'OTHER'

        await fetch(`/api/calendar/events/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: event.title,
            description: event.subtitle,
            type: calendarType,
            date: nextStart.toISOString(),
          }),
        })
      } else if (event.kind === 'activity') {
        await fetch(`/api/crm/activities/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledAt: nextStart.toISOString() }),
        })
      } else {
        await fetch(`/api/crm/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dueDate: nextStart.toISOString() }),
        })
      }

      setSelectedDate(nextStart)
      await loadAgendaData()
      toast.success('Evento reprogramado')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo reprogramar el evento')
    }
  }

  const quickActions = [
    { key: 'task', label: 'Tarea', icon: ListChecks },
    { key: 'payment', label: 'Cobro Programado', icon: Clock3 },
    { key: 'visit', label: 'Visita', icon: CalendarDays },
    { key: 'contact', label: 'Contacto', icon: Plus },
    { key: 'event', label: 'Evento', icon: Plus },
  ] as const

  return (
    <div className="space-y-4">
      <div ref={dayStripRef} className="overflow-x-auto pb-2 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
        <div className="inline-grid grid-flow-col auto-cols-[88px] gap-0 px-2 snap-x snap-mandatory touch-pan-x">
          {dayStripDays.map((day, index) => {
            const isSelected = day.toDateString() === selectedDate.toDateString()
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <button
                key={day.toISOString()}
                data-day={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`w-[88px] h-[88px] box-border snap-start flex flex-col items-center justify-center gap-1 border-t border-b border-r ${index === 0 ? 'border-l' : ''} px-2 py-2 ${isToday ? 'bg-[#1E4E4D] border-[#5E8B8C] text-[#FAF6F2]' : ''} ${isSelected ? 'border-[#C27F79] bg-[#243535] text-[#FAF6F2]' : 'border-[#2D3C3C] bg-[#121b1b] text-[#9C8578]'}`}>
                <p className="text-[10px] uppercase tracking-[0.2em]">{day.toLocaleDateString('es-CL', { weekday: 'short' })}</p>
                <p className="text-[18px] font-semibold">{day.getDate()}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-0">
        <div className="relative overflow-hidden bg-[#121b1b]">
          <div className="grid grid-cols-[58px_1fr]">
            <div className="border-r border-[#2D3C3C] bg-[#162121]">
              {hours.map((hour) => (
                <div key={hour} className="flex h-[60px] items-start justify-center border-b border-[#2D3C3C] px-2 py-1 text-[10px] text-[#9C8578]">{hour}:00</div>
              ))}
            </div>
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="h-[60px] border-b border-[#2D3C3C]" />
              ))}
              {currentDayIsSelected && <div className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[#C27F79]" style={{ top: `${Math.max(0, Math.min(currentLineTop, 60 * 16))}px` }} />}
              <div className="absolute inset-0 p-2">
                {visibleEvents.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#9C8578]">No hay eventos programados para este día.</div>
                ) : (
                  <div className="relative">
                    {visibleEvents.map((event) => {
                      const top = ((event.start.getHours() - 6) * 60 + event.start.getMinutes()) / 60 * 60
                      const height = Math.max(48, ((event.end.getTime() - event.start.getTime()) / 60_000) * 60 / 60)
                      return (
                        <div key={event.id} className="absolute left-0 right-0 rounded-xl border border-[#2D3C3C] p-2 text-left shadow-sm" style={{ top: `${top}px`, minHeight: `${height}px`, backgroundColor: `${event.color}22` }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold text-[#FAF6F2]">{event.title}</p>
                            {event.recurring && <Repeat2 className="h-3.5 w-3.5 text-[#F2C94C]" />}
                          </div>
                          <p className="mt-1 text-[10px] text-[#D5C3B6]">{event.subtitle}</p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-[#9C8578]">
                            <Clock3 className="h-3 w-3" />
                            {event.start.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <button onClick={(e) => { e.stopPropagation(); void moveEvent(event, -30, 0) }} className="rounded-full border border-[#2D3C3C] bg-[#162121] px-2 py-1 text-[10px] text-[#D5C3B6]">-30m</button>
                            <button onClick={(e) => { e.stopPropagation(); void moveEvent(event, 30, 0) }} className="rounded-full border border-[#2D3C3C] bg-[#162121] px-2 py-1 text-[10px] text-[#D5C3B6]">+30m</button>
                            <button onClick={(e) => { e.stopPropagation(); void moveEvent(event, 0, -1) }} className="rounded-full border border-[#2D3C3C] bg-[#162121] px-2 py-1 text-[10px] text-[#D5C3B6]"><ChevronLeft className="h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); void moveEvent(event, 0, 1) }} className="rounded-full border border-[#2D3C3C] bg-[#162121] px-2 py-1 text-[10px] text-[#D5C3B6]"><ChevronRight className="h-3 w-3" /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-[#2D3C3C] bg-[#1a2a2a] text-[#FAF6F2] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalAction === 'task' ? 'Nueva tarea' : modalAction === 'payment' ? 'Cobro programado' : modalAction === 'visit' ? 'Visita agendada' : modalAction === 'contact' ? 'Contacto registrado' : 'Nuevo evento'}</DialogTitle>
            <DialogDescription className="text-[#D5C3B6]">
              Completa los datos antes de guardar el registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm text-[#D5C3B6]">Título</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#D5C3B6]">Descripción</label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-[#D5C3B6]">Fecha y hora</label>
                <Input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]" />
              </div>
              {modalAction === 'task' && (
                <div className="space-y-2">
                  <label className="text-sm text-[#D5C3B6]">Prioridad</label>
                  <Select value={formPriority} onValueChange={setFormPriority}>
                    <SelectTrigger className="w-full border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Alta</SelectItem>
                      <SelectItem value="2">Media</SelectItem>
                      <SelectItem value="3">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {(modalAction === 'payment' || modalAction === 'event') && (
              <div className="space-y-2">
                <label className="text-sm text-[#D5C3B6]">Propiedad</label>
                <Select value={formPropertyId} onValueChange={setFormPropertyId}>
                  <SelectTrigger className="w-full border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]">
                    <SelectValue placeholder="Selecciona una propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>{property.address || property.name || property.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {modalAction === 'event' && (
              <div className="space-y-2">
                <label className="text-sm text-[#D5C3B6]">Tipo</label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="w-full border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OTHER">Otro</SelectItem>
                    <SelectItem value="INSPECTION">Inspección</SelectItem>
                    <SelectItem value="MAINTENANCE">Mantención</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {modalAction === 'contact' && (
              <div className="space-y-2">
                <label className="text-sm text-[#D5C3B6]">Contacto asociado</label>
                <Input value={formContact} onChange={(e) => setFormContact(e.target.value)} className="border-[#2D3C3C] bg-[#162121] text-[#FAF6F2]" placeholder="Opcional" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-[#D5C3B6]">Cancelar</Button>
            <Button onClick={() => void submitQuickAction()} className="bg-[#5E8B8C] text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 rounded-2xl border border-[#2D3C3C] bg-[#1a2a2a] p-2 shadow-xl">
            {quickActions.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => openQuickActionForm(key)} className="flex items-center gap-2 rounded-full border border-[#2D3C3C] bg-[#162121] px-3 py-2 text-sm text-[#D5C3B6]">
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setFabOpen((value) => !value)} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C27F79] text-2xl font-semibold text-white shadow-lg">
          {fabOpen ? '×' : '+'}
        </button>
      </div>
    </div>
  )
}
