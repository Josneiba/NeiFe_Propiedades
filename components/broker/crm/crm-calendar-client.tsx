"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Filter, ListChecks, Plus, Repeat2 } from 'lucide-react'
import { toast } from 'sonner'

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
  const [now, setNow] = useState(new Date())

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
    return timelineEvents.filter((item) => sameDate(item.start) && activeFilters[item.category])
  }, [activeFilters, selectedDate, timelineEvents])

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

  const createQuickAction = async (action: 'task' | 'payment' | 'visit' | 'contact' | 'event') => {
    setFabOpen(false)
    try {
      const start = new Date(selectedDate)
      start.setHours(9, 0, 0, 0)
      const propertyId = properties[0]?.id

      if (action === 'task') {
        await fetch('/api/crm/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'SEGUIMIENTO',
            title: 'Tarea creada desde el calendario',
            description: 'Registro rápido desde agenda',
            dueDate: start.toISOString(),
            priority: 1,
          }),
        })
      } else if (action === 'payment') {
        if (!propertyId) throw new Error('No hay propiedad disponible')
        await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Cobro programado',
            description: 'Cobro creado desde la agenda',
            type: 'PAYMENT_DUE',
            date: start.toISOString(),
            propertyId,
          }),
        })
      } else if (action === 'visit') {
        await fetch('/api/crm/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'VISITA',
            title: 'Visita agendada',
            description: 'Visita creada desde la agenda',
            scheduledAt: start.toISOString(),
            isDone: false,
          }),
        })
      } else if (action === 'contact') {
        await fetch('/api/crm/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'LLAMADA',
            title: 'Contacto registrado',
            description: 'Llamada registrada desde la agenda',
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
            title: 'Evento de agenda',
            description: 'Evento creado desde la agenda',
            type: 'OTHER',
            date: start.toISOString(),
            propertyId,
          }),
        })
      }

      await loadAgendaData()
      toast.success('Registro creado correctamente')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo crear el registro')
    }
  }

  const quickActions = [
    { key: 'task', label: 'Tarea', icon: ListChecks },
    { key: 'payment', label: 'Cobro Programado', icon: CalendarDays },
    { key: 'visit', label: 'Visita', icon: CalendarDays },
    { key: 'contact', label: 'Contacto', icon: CalendarDays },
    { key: 'event', label: 'Evento', icon: Plus },
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2D3C3C] bg-[#1a2a2a] p-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#5E8B8C]" />
          <h2 className="text-lg font-semibold text-[#FAF6F2]">Agenda</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => moveDay('prev')} className="rounded-full border border-[#2D3C3C] p-2 text-[#9C8578]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setSelectedDate(new Date())} className="rounded-full border border-[#2D3C3C] px-3 py-1.5 text-xs font-semibold text-[#D5C3B6]">
            Hoy
          </button>
          <button onClick={() => moveDay('next')} className="rounded-full border border-[#2D3C3C] p-2 text-[#9C8578]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2D3C3C] bg-[#1a2a2a] p-3">
        <div className="flex items-center gap-2 text-[#FAF6F2]">
          <Filter className="h-4 w-4 text-[#5E8B8C]" />
          <span className="text-sm font-semibold">Filtrar</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => toggleFilter(option.key as TimelineEvent['category'])}
              className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${activeFilters[option.key as TimelineEvent['category']] ? 'bg-[#5E8B8C] text-[#FAF6F2]' : 'bg-[#2D3C3C] text-[#9C8578]'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Link href="/broker/crm/mi-dia" className="flex items-center gap-2 rounded-full border border-[#2D3C3C] px-3 py-1.5 text-xs font-semibold text-[#D5C3B6]">
          <ListChecks className="h-3.5 w-3.5" />
          Tareas
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {weekDays.map((day) => {
          const isSelected = day.toDateString() === selectedDate.toDateString()
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`min-w-[58px] rounded-2xl border px-2 py-2 text-center ${isSelected ? 'border-[#C27F79] bg-[#243535] text-[#FAF6F2]' : 'border-[#2D3C3C] bg-[#1a2a2a] text-[#9C8578]'}`}
            >
              <p className="text-[10px] uppercase tracking-[0.2em]">{day.toLocaleDateString('es-CL', { weekday: 'short' })}</p>
              <p className="mt-1 text-lg font-semibold">{day.getDate()}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-3xl border border-[#2D3C3C] bg-[#1a2a2a] p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Timeline</p>
            <p className="text-sm font-semibold text-[#FAF6F2]">{selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
          </div>
          <div className="rounded-full border border-[#2D3C3C] px-3 py-1 text-[11px] text-[#D5C3B6]">{visibleEvents.length} bloques</div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#2D3C3C] bg-[#121b1b]">
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

      <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 rounded-2xl border border-[#2D3C3C] bg-[#1a2a2a] p-2 shadow-xl">
            {quickActions.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => void createQuickAction(key)} className="flex items-center gap-2 rounded-full border border-[#2D3C3C] bg-[#162121] px-3 py-2 text-sm text-[#D5C3B6]">
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
