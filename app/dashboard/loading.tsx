import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40 bg-[#2A2520]" />
        <Skeleton className="h-10 w-72 bg-[#2A2520]" />
        <Skeleton className="h-4 w-64 bg-[#2A2520]" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-28 rounded-xl bg-[#2A2520]" />
        <Skeleton className="h-10 w-28 rounded-xl bg-[#2A2520]" />
        <Skeleton className="h-10 w-40 rounded-xl bg-[#75524C]/30" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl bg-[#2A2520]" />
        ))}
      </div>

      <Skeleton className="h-52 rounded-2xl bg-[#2A2520]" />

      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-7 w-56 bg-[#2A2520]" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-48 rounded-2xl bg-[#2A2520]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
