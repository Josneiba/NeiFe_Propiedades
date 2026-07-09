import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { IndicatorsList } from '@/components/broker/goals/indicators-list'

export default async function AllIndicatorsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      <div className="mx-auto w-full max-w-2xl space-y-5 p-4 lg:px-6">
        <div>
          <Link
            href="/broker/crm/mi-dia"
            className="flex items-center gap-1.5 text-sm text-[#9C8578] hover:text-[#FAF6F2]"
          >
            <ChevronLeft className="h-4 w-4" /> Volver a Mi Día
          </Link>
          <h1 className="mt-3 text-2xl font-bold">Todos los Indicadores</h1>
          <p className="mt-0.5 text-xs text-[#9C8578]">Progreso semanal y mensual de tus metas</p>
        </div>

        <IndicatorsList />
      </div>
    </div>
  )
}
