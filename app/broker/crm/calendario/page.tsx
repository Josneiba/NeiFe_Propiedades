import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CrmCalendarClient } from '@/components/broker/crm/crm-calendar-client'

export const metadata = {
  title: 'Calendario CRM | NeiFe',
  description: 'Calendario de objetivos y fechas de vencimiento para deals CRM',
}

export default async function CalendarioPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const brokerId = session.user.id

  // Obtener deals activos con dueDate no nulo
  const deals = await prisma.crmDeal.findMany({
    where: {
      brokerId,
      status: 'ACTIVE',
      dueDate: { not: null },
    },
    include: {
      property: {
        select: { address: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  // Transformar a formato que espera el cliente
  const transformedDeals = deals.map((d) => ({
    id: d.id,
    code: d.code,
    title: d.title,
    stage: d.stage,
    value: d.value,
    dueDate: d.dueDate!,
    property: d.property ? { address: d.property.address } : undefined,
  }))

  return (
    <div className="min-h-screen bg-[#1C2828] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#FAF6F2] mb-2">Calendario CRM</h1>
          <p className="text-sm text-[#9C8578]">
            {transformedDeals.length} operación{transformedDeals.length !== 1 ? 'es' : ''} con fecha objetivo
          </p>
        </div>

        <CrmCalendarClient initialDeals={transformedDeals} />
      </div>
    </div>
  )
}
