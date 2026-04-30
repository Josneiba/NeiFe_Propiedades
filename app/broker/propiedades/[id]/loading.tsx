import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'

export default function BrokerPropertyDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-[#9C8578]">
            <ArrowLeft className="h-3 w-3" />
            <span>Volver</span>
          </div>
          <Skeleton className="h-8 w-64 bg-[#2A2520]" />
          <Skeleton className="h-4 w-48 bg-[#2A2520]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 bg-[#2A2520]" />
          <Skeleton className="h-9 w-24 bg-[#2A2520]" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4 space-y-2">
            <Skeleton className="h-3 w-20 bg-[#2A2520]" />
            <Skeleton className="h-7 w-32 bg-[#2A2520]" />
            <Skeleton className="h-5 w-16 bg-[#2A2520] rounded-full" />
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Tabs skeleton */}
          <div className="flex gap-4 border-b border-[#D5C3B6]/10 pb-2">
            {['Personas', 'Financiero', 'Operación', 'Mandato'].map(tab => (
              <Skeleton key={tab} className="h-5 w-16 bg-[#2A2520]" />
            ))}
          </div>
          {/* Contenido tab skeleton */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4 space-y-3">
                <Skeleton className="h-3 w-20 bg-[#2A2520]" />
                <Skeleton className="h-5 w-36 bg-[#2A2520]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-[#2A2520]" />
                  <Skeleton className="h-4 w-3/4 bg-[#2A2520]" />
                  <Skeleton className="h-4 w-2/3 bg-[#2A2520]" />
                </div>
              </div>
            ))}
          </div>
          {/* Tabla skeleton */}
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] px-4 py-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 bg-[#2A2520]" />
                  <Skeleton className="h-3 w-20 bg-[#2A2520]" />
                </div>
                <Skeleton className="h-6 w-16 bg-[#2A2520] rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha skeleton */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-4 space-y-3">
            <Skeleton className="h-5 w-36 bg-[#1C1917]" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-[#1C1917]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
