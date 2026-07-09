import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface SegmentDef {
  id: string
  title: string
  where: Record<string, unknown>
  href: string
}

function buildSegments(brokerId: string): SegmentDef[] {
  return [
    {
      id: 'new-leads',
      title: 'Nuevos leads',
      where: { brokerId, type: 'LEAD', status: 'ACTIVE' },
      href: '/broker/crm/contactos?type=LEAD&status=ACTIVE',
    },
    {
      id: 'owners',
      title: 'Propietarios',
      where: { brokerId, type: 'PROPIETARIO' },
      href: '/broker/crm/contactos?type=PROPIETARIO',
    },
    {
      id: 'tenants',
      title: 'Arrendatarios activos',
      where: { brokerId, type: 'ARRENDATARIO', status: 'ACTIVE' },
      href: '/broker/crm/contactos?type=ARRENDATARIO&status=ACTIVE',
    },
    {
      id: 'investors',
      title: 'Inversionistas',
      where: { brokerId, type: 'INVERSIONISTA' },
      href: '/broker/crm/contactos?type=INVERSIONISTA',
    },
    {
      id: 'high-priority',
      title: 'Prioridad alta',
      where: { brokerId, priority: 'HIGH', status: 'ACTIVE' },
      href: '/broker/crm/contactos?status=ACTIVE',
    },
    {
      id: 'referrals',
      title: 'Referidos',
      where: { brokerId, source: 'REFERIDO' },
      href: '/broker/crm/contactos?source=REFERIDO',
    },
    {
      id: 'converted',
      title: 'Convertidos recientemente',
      where: { brokerId, status: 'CONVERTED' },
      href: '/broker/crm/contactos?status=CONVERTED',
    },
    {
      id: 'stalled',
      title: 'Inactivos y perdidos',
      where: { brokerId, status: { in: ['INACTIVE', 'LOST'] } },
      href: '/broker/crm/contactos?status=INACTIVE',
    },
  ]
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const segments = buildSegments(brokerId)

  const results = await Promise.all(
    segments.map(async (segment) => {
      const [total, withOpenTask] = await Promise.all([
        prisma.crmContact.count({ where: segment.where as any }),
        prisma.crmContact.count({
          where: {
            ...(segment.where as any),
            tasks: { some: { isCompleted: false } },
          },
        }),
      ])

      return {
        id: segment.id,
        title: segment.title,
        href: segment.href,
        total,
        withOpenTask,
      }
    }),
  )

  return NextResponse.json({ segments: results })
}
