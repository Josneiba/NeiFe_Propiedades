import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { assertPropertyAccess } from '@/lib/permissions'

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

interface TimelineEvent {
  id: string
  type: 'PAYMENT' | 'MAINTENANCE' | 'CONTRACT' | 'ACTIVITY' | 'INVITATION'
  title: string
  description: string
  status?: string
  date: string
  icon: string
  color: string
}

// GET — timeline de actividad de propiedad
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Verificar acceso a la propiedad
    try {
      await assertPropertyAccess(id, session.user.id, session.user.role)
    } catch {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    // Hacer 5 queries en paralelo
    const [payments, maintenances, contracts, activityLogs, invitations] = await Promise.all([
      prisma.payment.findMany({
        where: { propertyId: id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, month: true, year: true, amountCLP: true, amountUF: true, status: true, createdAt: true, paidAt: true }
      }),
      prisma.maintenanceRequest.findMany({
        where: { propertyId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, category: true, description: true, status: true, createdAt: true }
      }),
      prisma.contract.findMany({
        where: { propertyId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, status: true, createdAt: true }
      }),
      prisma.activityLog.findMany({
        where: { propertyId: id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, action: true, description: true, createdAt: true, metadata: true }
      }),
      prisma.invitation.findMany({
        where: { propertyId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, status: true, createdAt: true }
      }),
    ])

    // Transformar en eventos unificados
    const events: TimelineEvent[] = []

    // Payments
    for (const payment of payments) {
      const date = payment.paidAt || payment.createdAt
      let title = ''
      let description = ''
      let color = ''

      switch (payment.status) {
        case 'PAID':
          title = 'Pago recibido'
          description = `${formatCLP(payment.amountCLP)} — ${monthNames[payment.month - 1]} ${payment.year}`
          color = '#5E8B8C'
          break
        case 'PENDING':
          title = 'Pago pendiente'
          description = `${formatCLP(payment.amountCLP)} — ${monthNames[payment.month - 1]} ${payment.year}`
          color = '#F2C94C'
          break
        case 'OVERDUE':
          title = 'Pago atrasado'
          description = `${formatCLP(payment.amountCLP)} — ${monthNames[payment.month - 1]} ${payment.year}`
          color = '#C27F79'
          break
        default:
          title = 'Pago'
          description = `${formatCLP(payment.amountCLP)} — ${monthNames[payment.month - 1]} ${payment.year}`
          color = '#9C8578'
      }

      events.push({
        id: payment.id,
        type: 'PAYMENT',
        title,
        description,
        status: payment.status,
        date: date.toISOString(),
        icon: 'credit-card',
        color
      })
    }

    // Maintenances
    for (const maintenance of maintenances) {
      let title = ''
      let description = maintenance.description.substring(0, 60) + (maintenance.description.length > 60 ? '...' : '')
      let color = ''

      switch (maintenance.status) {
        case 'REQUESTED':
          title = 'Mantención reportada'
          color = '#F2C94C'
          break
        case 'COMPLETED':
          title = 'Mantención completada'
          color = '#5E8B8C'
          break
        case 'IN_PROGRESS':
          title = 'Mantención en progreso'
          color = '#B8965A'
          break
        default:
          title = 'Mantención'
          color = '#9C8578'
      }

      events.push({
        id: maintenance.id,
        type: 'MAINTENANCE',
        title,
        description,
        status: maintenance.status,
        date: maintenance.createdAt.toISOString(),
        icon: 'wrench',
        color
      })
    }

    // Contracts
    for (const contract of contracts) {
      let title = ''
      let color = ''

      switch (contract.status) {
        case 'ACTIVE':
          title = 'Contrato activado'
          color = '#5E8B8C'
          break
        case 'PENDING_SIGNATURES':
          title = 'Contrato pendiente de firma'
          color = '#F2C94C'
          break
        default:
          title = 'Contrato'
          color = '#9C8578'
      }

      events.push({
        id: contract.id,
        type: 'CONTRACT',
        title,
        description: '',
        status: contract.status,
        date: contract.createdAt.toISOString(),
        icon: 'file-text',
        color
      })
    }

    // Activity Logs
    for (const log of activityLogs) {
      events.push({
        id: log.id,
        type: 'ACTIVITY',
        title: log.action,
        description: log.description,
        date: log.createdAt.toISOString(),
        icon: 'activity',
        color: '#9C8578'
      })
    }

    // Invitations
    for (const invitation of invitations) {
      events.push({
        id: invitation.id,
        type: 'INVITATION',
        title: 'Arrendatario invitado',
        description: '',
        status: invitation.status,
        date: invitation.createdAt.toISOString(),
        icon: 'user-plus',
        color: '#B8965A'
      })
    }

    // Ordenar por fecha descendente y tomar máximo 50
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const slicedEvents = events.slice(0, 50)

    return NextResponse.json({
      events: slicedEvents,
      total: events.length
    })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json(
      { error: 'Error al obtener timeline' },
      { status: 500 }
    )
  }
}
