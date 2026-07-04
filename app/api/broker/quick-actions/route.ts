import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user.role !== 'BROKER' && session.user.role !== 'OWNER')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const now = new Date()

  const [visitsCount, referralsCount, tasksCount, withoutReportCount, followUpsCount, negotiationCount, recommendationsCount] = await Promise.all([
    prisma.crmDeal.count({
      where: { brokerId, status: 'ACTIVE', stage: 'VISITA_AGENDADA' },
    }),
    prisma.crmContact.count({
      where: { brokerId, status: 'ACTIVE', source: 'REFERIDO' },
    }),
    prisma.crmTask.count({
      where: { brokerId, isCompleted: false },
    }),
    prisma.crmActivity.count({
      where: { brokerId, type: 'VISITA', isDone: true, outcome: null },
    }),
    prisma.crmTask.count({
      where: { brokerId, type: 'SEGUIMIENTO', isCompleted: false, dueDate: { lt: now } },
    }),
    prisma.crmContact.count({
      where: { brokerId, status: 'ACTIVE', priority: 'HIGH' },
    }),
    prisma.payment.count({
      where: {
        property: { landlordId: brokerId },
        status: 'OVERDUE',
      },
    }),
  ])

  return NextResponse.json([
    { id: 'visits', label: 'Visitas Agendadas', href: '/broker/crm/workspace?stage=VISITA_AGENDADA', count: visitsCount },
    { id: 'referrals', label: 'Referidos', href: '/broker/crm/contactos?source=REFERIDO', count: referralsCount },
    { id: 'tasks', label: 'Tareas', href: '/broker/crm/mi-dia', count: tasksCount },
    { id: 'withoutReport', label: 'Pendientes de Registrar', href: '/broker/crm/workspace', count: withoutReportCount },
    { id: 'notes', label: 'Notas Rápidas', href: '/broker/crm/workspace?quickNote=1', count: 0 },
    { id: 'followUps', label: 'Seguimientos', href: '/broker/crm/contactos?status=ACTIVE', count: followUpsCount },
    { id: 'loyalty', label: 'Clientes en Negociación', href: '/broker/crm/contactos?status=ACTIVE', count: negotiationCount },
    { id: 'templates', label: 'Recomendaciones del Sistema', href: '/broker/crm/calendario', count: recommendationsCount },
  ])
}
