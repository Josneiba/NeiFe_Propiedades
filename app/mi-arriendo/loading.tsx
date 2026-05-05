import { Skeleton } from "@/components/ui/skeleton"

export default function TenantLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-44 bg-[#2A2520]" />
        <Skeleton className="h-10 w-72 bg-[#2A2520]" />
        <Skeleton className="h-4 w-64 bg-[#2A2520]" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-12 flex-1 rounded-xl bg-[#2A2520]" />
        <Skeleton className="h-12 flex-1 rounded-xl bg-[#2A2520]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl bg-[#2A2520]" />
        ))}
      </div>

      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl bg-[#2A2520]" />
        ))}
      </div>

      <Skeleton className="h-[420px] rounded-2xl bg-[#2A2520]" />
      <Skeleton className="h-[340px] rounded-2xl bg-[#2A2520]" />
      <Skeleton className="h-[260px] rounded-2xl bg-[#2A2520]" />
    </div>
  )
}
