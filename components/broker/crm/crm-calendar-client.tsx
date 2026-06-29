"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { STAGE_COLUMNS } from "@/lib/crm-stage-utils";
import { EventCreationModal } from "./event-creation-modal";

interface ScheduledDeal {
  id: string;
  code: string;
  title: string;
  stage: string;
  value: number | null;
  dueDate: Date;
  property?: { address: string };
}

interface Contact {
  id: string;
  name: string;
  code: string;
}

interface Deal {
  id: string;
  title: string;
  code: string;
}

export function CrmCalendarClient({
  initialDeals,
}: {
  initialDeals: ScheduledDeal[];
}) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [deals, setDeals] = useState<ScheduledDeal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dealsList, setDealsList] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  useEffect(() => {
    const fetchContactsAndDeals = async () => {
      try {
        const [contactsRes, dealsRes] = await Promise.all([
          fetch("/api/crm/contacts"),
          fetch("/api/crm/deals"),
        ]);
        const contactsData = await contactsRes.json();
        const dealsData = await dealsRes.json();
        setContacts(contactsData);
        setDealsList(dealsData);
      } catch (error) {
        console.error("Error fetching contacts or deals:", error);
      }
    };

    fetchContactsAndDeals();
  }, []);

  async function loadScheduledActivities() {
    setLoadingActivities(true);
    try {
      const response = await fetch("/api/crm/activities");
      if (!response.ok) {
        throw new Error("Error fetching activities");
      }
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error("Error fetching scheduled activities:", error);
    } finally {
      setLoadingActivities(false);
    }
  }

  useEffect(() => {
    loadScheduledActivities();
  }, []);

  function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function getDealsForDate(date: Date): ScheduledDeal[] {
    return deals.filter((deal) => {
      const dueDate = new Date(deal.dueDate);
      return (
        dueDate.getDate() === date.getDate() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getFullYear() === date.getFullYear()
      );
    });
  }

  function getUrgencyColor(dueDate: Date): string {
    const days = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (days < 0) return "bg-red-900/50 border-red-600";
    if (days <= 3) return "bg-red-900/30 border-red-500";
    if (days <= 7) return "bg-yellow-900/30 border-yellow-500";
    return "bg-[#2D3C3C] border-[#5E8B8C]";
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  const monthName = currentDate.toLocaleDateString('es-CL', {
    month: 'long',
    year: 'numeric',
  });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getWeekDates = (): Date[] => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  };

  const weekDates = getWeekDates();
  const currentDay = selectedDate || currentDate;
  const dayEvents = getDealsForDate(currentDay);

  const getActivitiesForDate = (date: Date) => {
    return activities.filter((activity) => {
      if (!activity.scheduledAt) return false;
      const scheduledDate = new Date(activity.scheduledAt);
      return (
        scheduledDate.getFullYear() === date.getFullYear() &&
        scheduledDate.getMonth() === date.getMonth() &&
        scheduledDate.getDate() === date.getDate()
      );
    });
  };

  const weekEvents = weekDates.map((date) => ({
    date,
    dealEvents: getDealsForDate(date),
    activities: getActivitiesForDate(date),
  }));

  const dayActivities = getActivitiesForDate(currentDay);

  const viewLabel = () => {
    if (calendarView === 'day') {
      return currentDay.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }

    if (calendarView === 'week') {
      const first = weekDates[0];
      const last = weekDates[6];
      return `${first.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} - ${last.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }

    return monthName;
  };

  const moveDate = (direction: 'prev' | 'next') => {
    const amount = direction === 'prev' ? -1 : 1;
    if (calendarView === 'month') {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1),
      );
      return;
    }

    if (calendarView === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + amount * 7);
      setCurrentDate(nextWeek);
      return;
    }

    const nextDay = new Date(currentDay);
    nextDay.setDate(currentDay.getDate() + amount);
    setSelectedDate(nextDay);
    setCurrentDate(nextDay);
  };

  const prevMonth = () => moveDate('prev');
  const nextMonth = () => moveDate('next');

  const openModal = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleEventSubmit = async (eventData: {
    title: string;
    type: string;
    description?: string;
    scheduledAt: Date;
    dealId?: string;
    contactId?: string;
  }) => {
    try {
      // Crear evento en NeiFe
      const response = await fetch("/api/crm/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: eventData.type,
          title: eventData.title,
          description: eventData.description,
          scheduledAt: eventData.scheduledAt.toISOString(),
          dealId: eventData.dealId,
          contactId: eventData.contactId,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear el evento");
      }

      const result = await response.json();
      
      // Si hay un deal, sincronizar con Google Calendar automáticamente
      if (eventData.dealId) {
        const deal = dealsList.find(d => d.id === eventData.dealId);
        if (deal) {
          try {
            await fetch("/api/calendar/google-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dealId: eventData.dealId,
                title: `NeiFe: ${deal.title}`,
                description: eventData.description || `Evento: ${eventData.title}`,
                startDate: eventData.scheduledAt.toISOString(),
              }),
            });
          } catch (error) {
            console.error("Error sincronizando con Google Calendar:", error);
            // No fallas, el evento se creó en NeiFe
          }
        }
      }

      await loadScheduledActivities();
      console.log("Evento creado:", result);
    } catch (error) {
      console.error("Error submitting event:", error);
      throw error;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#5E8B8C]" />
              <h2 className="text-lg font-semibold text-[#FAF6F2]">Calendario</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['month', 'week', 'day'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => {
                    setCalendarView(view);
                    if (view === 'day' && !selectedDate) {
                      setSelectedDate(currentDate);
                    }
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    calendarView === view
                      ? 'bg-[#5E8B8C] text-[#FAF6F2]'
                      : 'bg-[#2D3C3C] text-[#9C8578] hover:bg-[#3C4B4B]'
                  }`}
                >
                  {view === 'month' ? 'Mes' : view === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-[#FAF6F2] min-w-[200px] text-center capitalize">
              {viewLabel()}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-[#D5C3B6]/10 rounded-lg text-[#9C8578] transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-[#D5C3B6]/10 rounded-lg text-[#9C8578] transition-colors"
                title="Siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-4">
          {calendarView === 'month' ? (
            <>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"].map((day) => (
                  <div
                    key={day}
                    className="text-xs font-semibold text-[#9C8578] text-center py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const date = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    day,
                  );
                  const dayDeals = getDealsForDate(date);
                  const dayActivities = getActivitiesForDate(date);
                  const totalItems = dayDeals.length + dayActivities.length;
                  const isToday = new Date().toDateString() === date.toDateString();

                  return (
                    <div
                      key={day}
                      className={`aspect-square p-2 rounded-lg border transition-colors ${
                        isToday
                          ? "bg-[#5E8B8C]/20 border-[#5E8B8C]"
                          : "bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#D5C3B6]/30"
                      }`}
                      onClick={() => openModal(date)}
                    >
                      <div
                        className={`text-xs font-semibold mb-1 ${isToday ? "text-[#5E8B8C]" : "text-[#9C8578]"}`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5 overflow-y-auto max-h-16">
                        {dayDeals.slice(0, 2).map((deal) => (
                          <div
                            key={deal.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity ${getUrgencyColor(deal.dueDate)}`}
                            title={`${deal.code}: ${deal.title}`}
                          >
                            {deal.code}
                          </div>
                        ))}
                        {dayActivities.slice(0, 2).map((activity) => (
                          <div
                            key={activity.id}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-[#B8965A]/20 bg-[#B8965A]/5 truncate"
                            title={activity.title}
                          >
                            📅 {activity.title}
                          </div>
                        ))}
                        {totalItems > 2 && (
                          <div className="text-[10px] text-[#9C8578] px-1.5 font-medium">
                            +{totalItems - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : calendarView === 'week' ? (
            <div className="grid grid-cols-7 gap-2">
              {weekEvents.map(({ date, dealEvents, activities: dayActivities }) => {
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <div
                    key={date.toISOString()}
                    className={`rounded-2xl border p-3 transition-colors ${
                      isToday
                        ? "bg-[#5E8B8C]/15 border-[#5E8B8C]"
                        : "bg-[#2D3C3C] border-[#D5C3B6]/10"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#9C8578] mb-2">
                      {date.toLocaleDateString('es-CL', { weekday: 'short' })}
                    </div>
                    <div className="text-sm font-semibold text-[#FAF6F2] mb-2">
                      {date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="space-y-2">
                      {dealEvents.length > 0 ? (
                        dealEvents.slice(0, 3).map((deal) => (
                          <div
                            key={deal.id}
                            className={`text-[10px] px-2 py-1 rounded border truncate ${getUrgencyColor(deal.dueDate)}`}
                            title={`${deal.code}: ${deal.title}`}
                          >
                            {deal.code}
                          </div>
                        ))
                      ) : null}

                      {dayActivities.length > 0 ? (
                        dayActivities.slice(0, 2).map((activity) => (
                          <div
                            key={activity.id}
                            className="text-[10px] px-2 py-1 rounded border border-[#B8965A]/20 bg-[#B8965A]/5 truncate"
                            title={activity.title}
                          >
                            📅 {activity.title}
                          </div>
                        ))
                      ) : dealEvents.length === 0 ? (
                        <div className="text-[10px] text-[#9C8578]">Sin eventos</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Agenda diaria</p>
                <h3 className="mt-2 text-sm font-semibold text-[#FAF6F2]">
                  {currentDay.toLocaleDateString('es-CL', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <div className="space-y-3">
                {dayActivities.length > 0 && (
                  <div className="space-y-3">
                    {dayActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-2xl border border-[#B8965A]/20 bg-[#2A392C] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-mono text-[#B8965A]">{new Date(activity.scheduledAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{activity.title}</p>
                          </div>
                          <Badge className="text-[10px] shrink-0 border-[#B8965A]/20 text-[#B8965A]">
                            {activity.type}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="mt-3 text-xs text-[#9C8578]">{activity.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {dayEvents.length > 0 ? (
                  dayEvents.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-mono text-[#B8965A]">{deal.code}</p>
                          <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{deal.title}</p>
                        </div>
                        <Badge
                          className="text-[10px] shrink-0"
                          style={{
                            backgroundColor:
                              STAGE_COLUMNS.find((s) => s.stage === deal.stage)
                                ?.color + '33',
                            color: STAGE_COLUMNS.find((s) => s.stage === deal.stage)
                              ?.color,
                          }}
                        >
                          {STAGE_COLUMNS.find((s) => s.stage === deal.stage)?.label}
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs text-[#9C8578]">
                        {new Date(deal.dueDate).toLocaleString('es-CL')}
                      </p>
                    </div>
                  ))
                ) : dayActivities.length === 0 ? (
                  <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-6 text-sm text-[#9C8578]">
                    No hay eventos programados para este día.
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events Panel */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#FAF6F2] mb-3">
          Próximas fechas objetivo
        </h3>
        {deals.length > 0 ? (
          <div className="space-y-2">
            {deals
              .filter((d) => new Date(d.dueDate) >= new Date())
              .sort(
                (a, b) =>
                  new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
              )
              .slice(0, 5)
              .map((deal) => (
                <Card
                  key={deal.id}
                  className="bg-[#1C2828] border-[#D5C3B6]/10 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-[#B8965A]">
                        {deal.code}
                      </p>
                      <p className="text-sm text-[#FAF6F2] truncate font-medium">
                        {deal.title}
                      </p>
                    </div>
                    <Badge
                      className="text-[10px] shrink-0"
                      style={{
                        backgroundColor:
                          STAGE_COLUMNS.find((s) => s.stage === deal.stage)
                            ?.color + "33",
                        color: STAGE_COLUMNS.find((s) => s.stage === deal.stage)
                          ?.color,
                      }}
                    >
                      {STAGE_COLUMNS.find((s) => s.stage === deal.stage)?.label}
                    </Badge>
                  </div>
                </Card>
              ))}
          </div>
        ) : (
          <p className="text-xs text-[#9C8578]">No hay próximos eventos.</p>
        )}
      </div>

      {/* Existing Events Table */}
      <div className="lg:col-span-1">
        <h3 className="text-lg font-semibold text-[#FAF6F2] mb-4">
          Eventos Existentes
        </h3>
        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-4 max-h-[500px] overflow-y-auto">
          <div className="space-y-3">
            {deals
              .filter((deal) => deal.dueDate)
              .map((deal) => (
                <div
                  key={deal.id}
                  className="p-3 border border-[#D5C3B6]/20 rounded-md bg-[#2A3A3A]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-mono text-[#B8965A]">
                        {deal.code}
                      </p>
                      <p className="text-sm font-medium text-[#FAF6F2]">
                        {deal.title}
                      </p>
                      <p className="text-xs text-[#9C8578]">
                        {new Date(deal.dueDate).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && contacts.length > 0 && dealsList.length > 0 && (
        <EventCreationModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleEventSubmit}
          initialDate={selectedDate || undefined}
          contacts={contacts}
          deals={dealsList}
        />
      )}
    </div>
  );
}
