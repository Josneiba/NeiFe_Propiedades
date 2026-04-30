import { Skeleton } from '@/components/ui/skeleton'

export default function BrokerContratosLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-[#2A2520]" />
        <Skeleton className="h-4 w-72 bg-[#2A2520]" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 bg-[#1C1917]" />
                <Skeleton className="h-4 w-32 bg-[#1C1917]" />
                <Skeleton className="h-4 w-56 bg-[#1C1917]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 bg-[#1C1917] rounded-full" />
                <Skeleton className="h-9 w-24 bg-[#1C1917]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
