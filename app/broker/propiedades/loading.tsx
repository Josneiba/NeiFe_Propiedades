import { Skeleton } from "@/components/ui/skeleton"

export default function BrokerPropertiesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 bg-[#2A2520]" />
        <Skeleton className="h-4 w-64 bg-[#2A2520]" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl bg-[#2A2520]" />
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[260px] rounded-2xl bg-[#2A2520]" />
        ))}
      </div>
    </div>
  )
}
