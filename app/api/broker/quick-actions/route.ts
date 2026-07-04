import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user.role !== 'BROKER' && session.user.role !== 'OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const brokerProperties = await prisma.property.findMany({
    where: { managedBy: brokerId },
    select: { id: true },
  })
  const propertyIds = brokerProperties.map((property) => property.id)

  const [activeDeals, activeMandates, pendingMaintenance, activeContacts] = await Promise.all([
    prisma.crmDeal.count({
      where: { brokerId, status: 'ACTIVE' },
    }),
    prisma.mandate.count({
      where: {
        brokerId,
        status: { in: ['PENDING', 'ACTIVE'] },
      },
    }),
    prisma.maintenanceRequest.count({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'] },
      },
    }),
    prisma.crmContact.count({
      where: { brokerId, status: 'ACTIVE' },
    }),
  ])

  return NextResponse.json([
    {
      id: 'deals',
      label: 'Oportunidades abiertas',
      href: '/broker/crm/workspace',
      count: activeDeals,
      description: 'Seguimiento de ventas y arriendos',
    },
    {
      id: 'mandates',
      label: 'Mandatos vigentes',
      href: '/broker/mandatos',
      count: activeMandates,
      description: 'Documentos y contratos activos',
    },
    {
      id: 'maintenance',
      label: 'Avisos pendientes',
      href: '/broker/servicios',
      count: pendingMaintenance,
      description: 'Solicitudes por revisar',
    },
    {
      id: 'contacts',
      label: 'Contactos activos',
      href: '/broker/crm/contactos',
      count: activeContacts,
      description: 'Propietarios, arrendatarios y leads',
    },
  ])
}
