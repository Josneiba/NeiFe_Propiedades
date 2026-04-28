import { prisma } from '@/lib/prisma'

type CalendarSummaryScope = 'landlord' | 'broker'

type SummaryProperty = {
  id: string
  name: string | null
  address: string
  commune: string
}

type SummaryEvent = {
  id: string
  type: string
  date: string
  title: string
  description: string
  propertyAddress: string
  editable: boolean
}

type CalendarSummary = {
  properties: SummaryProperty[]
  events: SummaryEvent[]
}

function getInspectionType(type: string) {
  const types: Record<string, string> = {
    ROUTINE: 'Rutinaria',
    CHECKIN: 'Inicial',
    CHECKOUT: 'Final',
    MAINTENANCE: 'Mantención',
    IPC_REVIEW: 'Revisión IPC',
    MOVE_IN: 'Entrada',
    MOVE_OUT: 'Salida',
    EMERGENCY: 'Emergencia',
  }

  return types[type] || type
}

function sortEvents(events: SummaryEvent[]) {
  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

export async function getCalendarSummary(
  userId: string,
  scope: CalendarSummaryScope
): Promise<CalendarSummary> {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const propertyWhere =
    scope === 'broker'
      ? {
          isActive: true,
          OR: [
            { managedBy: userId },
            {
              mandates: {
                some: {
                  brokerId: userId,
                  status: 'ACTIVE' as const,
                },
              },
            },
          ],
        }
      : {
          landlordId: userId,
          isActive: true,
        }

  const [properties, calendarEvents] = await Promise.all([
    prisma.property.findMany({
      where: propertyWhere,
      select: {
        id: true,
        name: true,
        address: true,
        commune: true,
        monthlyRentCLP: true,
        contractEnd: true,
        payments: {
          where: {
            month: currentMonth,
            year: currentYear,
          },
          select: {
            month: true,
            year: true,
            status: true,
          },
          take: 1,
        },
        inspections: {
          where: {
            status: {
              in: ['SCHEDULED', 'CONFIRMED'],
            },
          },
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            type: true,
          },
        },
        ipcAdjustments: {
          where: {
            status: 'PENDING',
          },
          select: {
            id: true,
            scheduledDate: true,
            ipcRate: true,
            newRentCLP: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.calendarEvent.findMany({
      where: {
        property: propertyWhere,
      },
      include: {
        property: {
          select: {
            address: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    }),
  ])

  const events: SummaryEvent[] = []

  for (const event of calendarEvents) {
    events.push({
      id: event.id,
      type: event.type,
      date: event.date.toISOString(),
      title: event.title,
      description: event.description || '',
      propertyAddress: event.property?.address || 'Propiedad',
      editable: true,
    })
  }

  for (const property of properties) {
    for (const inspection of property.inspections) {
      events.push({
        id: `inspection-${inspection.id}`,
        type: 'INSPECTION',
        date: inspection.scheduledAt.toISOString(),
        title: `Inspección: ${getInspectionType(inspection.type)}`,
        description: `Estado: ${
          inspection.status === 'CONFIRMED' ? 'Confirmada' : 'Programada'
        }`,
        propertyAddress: property.address,
        editable: false,
      })
    }

    for (const adjustment of property.ipcAdjustments) {
      events.push({
        id: `ipc-${adjustment.id}`,
        type: 'IPC',
        date: adjustment.scheduledDate.toISOString(),
        title: `Reajuste IPC ${adjustment.ipcRate}%`,
        description: adjustment.newRentCLP
          ? `Nuevo arriendo: $${adjustment.newRentCLP.toLocaleString('es-CL')}`
          : 'Reajuste IPC pendiente',
        propertyAddress: property.address,
        editable: false,
      })
    }

    if (property.contractEnd) {
      const daysUntilEnd = Math.floor(
        (property.contractEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilEnd > 0 && daysUntilEnd <= 90) {
        events.push({
          id: `contract-${property.id}`,
          type: 'CONTRACT',
          date: property.contractEnd.toISOString(),
          title: 'Contrato próximo a vencer',
          description: `Vence en ${daysUntilEnd} días`,
          propertyAddress: property.address,
          editable: false,
        })
      }
    }

    const payment = property.payments[0]
    if (payment && (payment.status === 'PENDING' || payment.status === 'OVERDUE')) {
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      events.push({
        id: `payment-${property.id}-${payment.month}-${payment.year}`,
        type: 'PAYMENT',
        date: lastDayOfMonth.toISOString(),
        title:
          payment.status === 'OVERDUE'
            ? 'Pago atrasado (mes actual)'
            : 'Pago pendiente (mes actual)',
        description: property.monthlyRentCLP
          ? `Monto referencia: $${Number(property.monthlyRentCLP).toLocaleString('es-CL')}`
          : 'Revisa la sección Pagos',
        propertyAddress: property.address,
        editable: false,
      })
    }
  }

  return {
    properties: properties.map((property) => ({
      id: property.id,
      name: property.name,
      address: property.address,
      commune: property.commune,
    })),
    events: sortEvents(events),
  }
}
