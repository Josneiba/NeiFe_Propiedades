import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40 bg-[#2A2520]" />
        <Skeleton className="h-10 w-72 bg-[#2A2520]" />
        <Skeleton className="h-4 w-64 bg-[#2A2520]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-[#2A2520]" />
        ))}
      </div>

      <Skeleton className="h-44 rounded-2xl bg-[#2A2520]" />

      <div className="space-y-6">
        <Skeleton className="h-7 w-48 bg-[#2A2520]" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, j) => (
            <Skeleton key={j} className="h-64 rounded-2xl bg-[#2A2520]" />
          ))}
        </div>
      </div>
    </div>
  )
}
