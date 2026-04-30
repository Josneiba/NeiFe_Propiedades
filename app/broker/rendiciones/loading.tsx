import { Skeleton } from '@/components/ui/skeleton'

export default function RendicionesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40 bg-[#2A2520]" />
        <Skeleton className="h-4 w-72 bg-[#2A2520]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48 bg-[#1C1917]" />
                <Skeleton className="h-5 w-20 bg-[#1C1917] rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 bg-[#1C1917]" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 bg-[#1C1917]" />
                <Skeleton className="h-8 w-24 bg-[#1C1917]" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-5 space-y-4">
          <Skeleton className="h-5 w-36 bg-[#1C1917]" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-24 bg-[#1C1917]" />
              <Skeleton className="h-10 w-full bg-[#1C1917]" />
            </div>
          ))}
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
        </div>
      </div>
    </div>
  )
}
