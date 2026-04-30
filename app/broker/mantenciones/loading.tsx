import { Skeleton } from '@/components/ui/skeleton'

export default function BrokerMantencionesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-[#2A2520]" />
        <Skeleton className="h-4 w-80 bg-[#2A2520]" />
      </div>
      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-4 space-y-4">
        <Skeleton className="h-10 w-full bg-[#1C1917]" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-5 space-y-3">
            <div className="flex justify-between">
              <div className="flex gap-3">
                <Skeleton className="h-12 w-12 bg-[#1C1917] rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 bg-[#1C1917]" />
                  <Skeleton className="h-4 w-48 bg-[#1C1917]" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 bg-[#1C1917] rounded-full" />
            </div>
            <Skeleton className="h-4 w-full bg-[#1C1917]" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-24 bg-[#1C1917]" />
              <Skeleton className="h-8 w-24 bg-[#1C1917]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
