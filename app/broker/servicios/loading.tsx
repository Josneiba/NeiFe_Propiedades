import { Skeleton } from '@/components/ui/skeleton'

export default function BrokerServiciosLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-[#2A2520]" />
        <Skeleton className="h-4 w-72 bg-[#2A2520]" />
      </div>
      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-5 space-y-4">
        <Skeleton className="h-5 w-36 bg-[#1C1917]" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
          <Skeleton className="h-10 w-full bg-[#1C1917]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 bg-[#1C1917]" />
              <Skeleton className="h-10 w-full bg-[#1C1917]" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32 bg-[#1C1917]" />
      </div>
    </div>
  )
}
