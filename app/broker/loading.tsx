import { Skeleton } from "@/components/ui/skeleton"

export default function BrokerLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40 bg-[#2D3C3C]" />
          <Skeleton className="h-8 w-64 bg-[#2D3C3C]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg bg-[#2D3C3C]" />
          <Skeleton className="h-8 w-24 rounded-lg bg-[#2D3C3C]" />
          <Skeleton className="h-9 w-32 rounded-xl bg-[#2D3C3C]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#2D3C3C] animate-pulse" />
        ))}
      </div>

      <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#D5C3B6]/10">
          <Skeleton className="h-5 w-48 bg-[#1C1917]" />
          <Skeleton className="h-3 w-72 mt-2 bg-[#1C1917]" />
        </div>
        <div className="divide-y divide-[#D5C3B6]/10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-6">
              <Skeleton className="h-4 w-40 bg-[#1C1917]" />
              <Skeleton className="h-4 w-28 bg-[#1C1917]" />
              <Skeleton className="h-5 w-16 rounded-full bg-[#1C1917]" />
              <Skeleton className="h-4 w-24 bg-[#1C1917]" />
              <Skeleton className="h-7 w-12 rounded-lg bg-[#1C1917] ml-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-6 space-y-3">
            <Skeleton className="h-5 w-36 bg-[#1C1917]" />
            {[...Array(3)].map((_, j) => (
              <Skeleton key={j} className="h-14 w-full rounded-lg bg-[#1C1917]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
