import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CrmCalendarClient } from '@/components/broker/crm/crm-calendar-client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function GoogleCalendarEmbed() {
  return (
    <div className="w-full bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-6">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-[#FAF6F2] mb-2">Google Calendar</h3>
          <p className="text-sm text-[#9C8578] mb-6">
            Abre tu Google Calendar en una nueva ventana para ver y gestionar todos tus eventos sincronizados
          </p>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 bg-[#5E8B8C] hover:bg-[#5E8B8C]/80 text-[#FAF6F2] rounded text-sm font-medium transition-colors"
          >
            Abrir Google Calendar
          </a>
        </div>
      </div>
    </div>
  )
}

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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#FAF6F2] mb-2">Calendario CRM</h1>
          <p className="text-sm text-[#9C8578]">
            {transformedDeals.length} operación{transformedDeals.length !== 1 ? 'es' : ''} con fecha objetivo
          </p>
        </div>

        <Tabs defaultValue="crm" className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-2 bg-[#2D3C3C] border border-[#D5C3B6]/10">
            <TabsTrigger value="crm" className="text-[#9C8578] data-[state=active]:text-[#FAF6F2] data-[state=active]:bg-[#1C2828]">
              Calendario NeiFe
            </TabsTrigger>
            <TabsTrigger value="google" className="text-[#9C8578] data-[state=active]:text-[#FAF6F2] data-[state=active]:bg-[#1C2828]">
              Google Calendar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="crm" className="mt-6">
            <CrmCalendarClient initialDeals={transformedDeals} />
          </TabsContent>
          
          <TabsContent value="google" className="mt-6">
            <GoogleCalendarEmbed />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
