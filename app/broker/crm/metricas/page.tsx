import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import { getMetricsOverview } from '@/lib/crm-metrics-enhanced'
import { MetricsSummary } from '@/components/broker/crm/metrics/metrics-summary'
import { StageVelocityChart } from '@/components/broker/crm/metrics/stage-velocity-chart'
import { ConversionBySourceChart } from '@/components/broker/crm/metrics/conversion-by-source-chart'
import { RevenueProjectionsChart } from '@/components/broker/crm/metrics/revenue-projections-chart'
import { TopContactsTable } from '@/components/broker/crm/metrics/top-contacts-table'
import { ProductivityChart } from '@/components/broker/crm/metrics/productivity-chart'
import { prisma } from '@/lib/prisma'
import { CrmActivityType } from '@prisma/client'

export const dynamic = 'force-dynamic'

async function getActivityProductivity(brokerId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  const activities = await prisma.crmActivity.groupBy({
    by: ['type'],
    where: {
      brokerId,
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
  })

  const typeLabels: Record<CrmActivityType, string> = {
    LLAMADA: 'Llamadas',
    VISITA: 'Visitas',
    EMAIL: 'Emails',
    WHATSAPP: 'WhatsApp',
    REUNION: 'Reuniones',
    DOCUMENTO: 'Documentos',
    TAREA: 'Tareas',
    NOTA: 'Notas',
  }

  return activities.map(a => ({
    type: typeLabels[a.type as CrmActivityType] || a.type,
    count: a._count.id,
  })).sort((a, b) => b.count - a.count)
}

export default async function MetricasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const metrics = await getMetricsOverview(session.user.id)
  const productivity = await getActivityProductivity(session.user.id)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-[#FAF6F2]">Métricas & Análisis</h1>
        <p className="text-sm text-[#9C8578] mt-1">
          Dashboard avanzado de desempeño del CRM
        </p>
      </div>

      {/* Resumen de KPIs */}
      <MetricsSummary
        totalPipelineValue={metrics.totalPipelineValue}
        winRate={metrics.winRate}
        lossRate={metrics.lossRate}
        avgClosingTime={metrics.avgClosingTime}
      />

      {/* Grid de gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StageVelocityChart data={metrics.stageVelocity} />
        <ConversionBySourceChart data={metrics.conversionBySource} />
      </div>

      {/* Proyecciones y contactos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueProjectionsChart data={metrics.revenuProjections} />
        <TopContactsTable data={metrics.topContacts} />
      </div>

      {/* Productividad: últimos 30 días */}
      <div className="bg-gradient-to-br from-[#2D3C3C] to-[#1C2828] border border-[#D5C3B6]/10 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#FAF6F2]">Productividad (últimos 30 días)</h2>
          <p className="text-sm text-[#9C8578] mt-1">Actividades registradas por tipo</p>
        </div>
        
        <ProductivityChart data={productivity} />
      </div>
    </div>
  )
}
