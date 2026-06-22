import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import { getMetricsOverview } from '@/lib/crm-metrics-enhanced'
import { MetricsSummary } from '@/components/broker/crm/metrics/metrics-summary'
import { StageVelocityChart } from '@/components/broker/crm/metrics/stage-velocity-chart'
import { ConversionBySourceChart } from '@/components/broker/crm/metrics/conversion-by-source-chart'
import { RevenueProjectionsChart } from '@/components/broker/crm/metrics/revenue-projections-chart'
import { TopContactsTable } from '@/components/broker/crm/metrics/top-contacts-table'

export const dynamic = 'force-dynamic'

export default async function MetricasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const metrics = await getMetricsOverview(session.user.id)

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
    </div>
  )
}
