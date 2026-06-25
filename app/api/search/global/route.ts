import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import type { GlobalSearchResult, SearchResultType } from '@/types/search'

function statusColor(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
  const map: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
    ACTIVE: 'green',
    PAID: 'green',
    WON: 'green',
    PENDING: 'yellow',
    PENDING_SIGNATURES: 'yellow',
    IN_PROGRESS: 'yellow',
    OVERDUE: 'red',
    LOST: 'red',
    EXPIRED: 'red',
    DRAFT: 'gray',
    RESOLVED: 'blue',
  }
  return map[status] ?? 'gray'
}

const STAGE_LABELS: Record<string, string> = {
  NUEVO_LEAD: 'Nuevo lead',
  CONTACTO_INICIADO: 'Contacto iniciado',
  VISITA_AGENDADA: 'Visita agendada',
  PROPIEDAD_CAPTADA: 'Propiedad captada',
  PUBLICADA: 'Publicada',
  MOSTRANDO: 'Mostrando',
  OFERTA_RECIBIDA: 'Oferta recibida',
  DOCS_REVISION: 'Revisión docs',
  NEGOCIANDO: 'Negociando',
  FIRMA_CONTRATO: 'Firma contrato',
  ENTREGA_LLAVES: 'Entrega llaves',
  ADMINISTRAR: 'Administrar',
}

const MONTH_NAMES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const MAINTENANCE_LABELS: Record<string, string> = {
  PLUMBING: 'Gasfitería',
  ELECTRICAL: 'Electricidad',
  STRUCTURAL: 'Estructura',
  APPLIANCES: 'Artefactos',
  CLEANING: 'Limpieza',
  OTHER: 'Otro',
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json([], { status: 401 })
  }

  const brokerId = session.user.id
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json([], { status: 200 })
  }

  const contains = { contains: q, mode: 'insensitive' as const }
  const monthIndex = MONTH_NAMES.findIndex((month) =>
    month.toLowerCase().startsWith(q.toLowerCase()),
  )
  const yearNum = parseInt(q, 10)
  const isYear = !Number.isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100

  const [contacts, deals, properties, maintenances, contracts, statements, tasks] =
    await Promise.all([
      prisma.crmContact.findMany({
        where: {
          brokerId,
          status: 'ACTIVE',
          OR: [
            { name: contains },
            { code: contains },
            { phone: contains },
            { email: contains },
          ],
        },
        select: {
          id: true,
          code: true,
          name: true,
          email: true,
          phone: true,
          deals: {
            select: {
              deal: { select: { title: true, stage: true } },
            },
            take: 1,
          },
        },
        take: 5,
      }),

      prisma.crmDeal.findMany({
        where: {
          brokerId,
          OR: [
            { title: contains },
            { code: contains },
            {
              contacts: {
                some: {
                  contact: { name: contains },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          code: true,
          title: true,
          stage: true,
          status: true,
          value: true,
          property: { select: { address: true, commune: true } },
          contacts: {
            select: { contact: { select: { name: true } } },
            take: 1,
          },
        },
        take: 5,
      }),

      prisma.property.findMany({
        where: {
          mandates: {
            some: { brokerId, status: 'ACTIVE' },
          },
          OR: [
            { address: contains },
            { commune: contains },
            { name: contains },
          ],
        },
        select: {
          id: true,
          name: true,
          address: true,
          commune: true,
          tenant: { select: { name: true } },
          landlord: { select: { name: true } },
        },
        take: 5,
      }),

      prisma.maintenanceRequest.findMany({
        where: {
          property: {
            mandates: { some: { brokerId, status: 'ACTIVE' } },
          },
          OR: [{ description: contains }],
          status: { notIn: ['RESOLVED'] },
        },
        select: {
          id: true,
          category: true,
          description: true,
          status: true,
          property: { select: { address: true, commune: true } },
        },
        take: 5,
      }),

      prisma.contract.findMany({
        where: {
          property: {
            mandates: { some: { brokerId, status: 'ACTIVE' } },
          },
          OR: [
            { property: { address: contains } },
            { property: { commune: contains } },
            { tenant: { name: contains } },
          ],
        },
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          property: { select: { address: true, commune: true } },
          tenant: { select: { name: true } },
        },
        take: 4,
      }),

      (async () => {
        if (monthIndex <= 0 && !isYear) return []
        return prisma.brokerStatement.findMany({
          where: {
            brokerId,
            ...(monthIndex > 0 ? { month: monthIndex } : {}),
            ...(isYear ? { year: yearNum } : {}),
          },
          select: {
            id: true,
            month: true,
            year: true,
            status: true,
            property: { select: { address: true, commune: true } },
          },
          take: 4,
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        })
      })(),

      prisma.crmTask.findMany({
        where: {
          brokerId,
          isCompleted: false,
          OR: [
            { title: contains },
            { deal: { title: contains } },
            { contact: { name: contains } },
          ],
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          deal: { select: { title: true } },
          contact: { select: { name: true } },
        },
        take: 4,
        orderBy: { dueDate: 'asc' },
      }),
    ])

  const results: GlobalSearchResult[] = []

  for (const contact of contacts) {
    const dealContext = contact.deals[0]?.deal
    results.push({
      id: contact.id,
      type: 'contact',
      title: contact.name,
      subtitle:
        [contact.phone, contact.email].filter(Boolean).join(' · ') ||
        'Sin contacto registrado',
      badge: dealContext ? STAGE_LABELS[dealContext.stage] : undefined,
      badgeColor: 'blue',
      href: `/broker/crm/contactos/${contact.id}`,
      meta: contact.code,
    })
  }

  for (const deal of deals) {
    const mainContact = deal.contacts[0]?.contact.name
    const formattedValue = deal.value
      ? `$${new Intl.NumberFormat('es-CL').format(deal.value)}`
      : undefined

    results.push({
      id: deal.id,
      type: 'deal',
      title: deal.title,
      subtitle: [
        STAGE_LABELS[deal.stage] ?? deal.stage,
        mainContact,
        formattedValue,
      ]
        .filter(Boolean)
        .join(' · '),
      badge:
        deal.status === 'ACTIVE'
          ? STAGE_LABELS[deal.stage]
          : deal.status,
      badgeColor:
        deal.status === 'WON'
          ? 'green'
          : deal.status === 'LOST'
          ? 'red'
          : 'yellow',
      href: `/broker/crm/workspace?selectedDealId=${deal.id}`,
      meta: deal.code,
    })
  }

  for (const property of properties) {
    results.push({
      id: property.id,
      type: 'property',
      title: `${property.address}, ${property.commune}`,
      subtitle: [
        property.tenant?.name
          ? `Arrendatario: ${property.tenant.name}`
          : 'Sin arrendatario',
        property.landlord?.name
          ? `Propietario: ${property.landlord.name}`
          : undefined,
      ]
        .filter(Boolean)
        .join(' · '),
      badge: 'Administrada',
      badgeColor: 'green',
      href: `/broker/propiedades/${property.id}`,
    })
  }

  for (const maintenance of maintenances) {
    const statusLabels: Record<string, string> = {
      REQUESTED: 'Solicitada',
      REVIEWING: 'En revisión',
      APPROVED: 'Aprobada',
      IN_PROGRESS: 'En progreso',
      RESOLVED: 'Resuelta',
    }

    results.push({
      id: maintenance.id,
      type: 'maintenance',
      title: `${MAINTENANCE_LABELS[maintenance.category] ?? maintenance.category} — ${maintenance.property.address}`,
      subtitle:
        maintenance.description.slice(0, 80) +
        (maintenance.description.length > 80 ? '...' : ''),
      badge: statusLabels[maintenance.status] ?? maintenance.status,
      badgeColor: statusColor(maintenance.status),
      href: '/broker/mantenciones',
    })
  }

  for (const contractItem of contracts) {
    const dateRange = [contractItem.startDate, contractItem.endDate]
      .filter(Boolean)
      .map((date) =>
        new Date(date as Date).toLocaleDateString('es-CL'),
      )
      .join(' → ')

    results.push({
      id: contractItem.id,
      type: 'contract',
      title: `Contrato — ${contractItem.property.address}, ${contractItem.property.commune}`,
      subtitle: [contractItem.tenant?.name, dateRange]
        .filter(Boolean)
        .join(' · '),
      badge: contractItem.status,
      badgeColor: statusColor(contractItem.status),
      href: '/broker/contratos',
    })
  }

  for (const statement of statements as Array<any>) {
    results.push({
      id: statement.id,
      type: 'statement',
      title: `Rendición ${MONTH_NAMES[statement.month]} ${statement.year}`,
      subtitle: `${statement.property.address}, ${statement.property.commune}`,
      badge: statement.status,
      badgeColor: statusColor(statement.status),
      href: '/broker/rendiciones',
    })
  }

  for (const task of tasks) {
    const due = new Date(task.dueDate)
    const isOverdue = due < new Date()
    const dueDate = due.toLocaleDateString('es-CL')

    results.push({
      id: task.id,
      type: 'task',
      title: task.title,
      subtitle: [
        task.deal?.title ?? task.contact?.name,
        `Vence: ${dueDate}`,
      ]
        .filter(Boolean)
        .join(' · '),
      badge: isOverdue ? 'Vencida' : 'Pendiente',
      badgeColor: isOverdue ? 'red' : 'yellow',
      href: '/broker/crm/mi-dia',
    })
  }

  const ORDER: SearchResultType[] = [
    'contact',
    'deal',
    'property',
    'task',
    'maintenance',
    'contract',
    'statement',
  ]

  results.sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))

  return NextResponse.json(results)
}
