import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardContractsLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-10 w-52 bg-[#2A2520]" />
        <Skeleton className="h-4 w-72 bg-[#2A2520]" />
      </div>
      <Skeleton className="h-px w-full bg-[#2A2520]" />
      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <Skeleton className="h-[420px] rounded-2xl bg-[#2A2520]" />
        <Skeleton className="h-[520px] rounded-2xl bg-[#2A2520]" />
      </div>
    </div>
  )
}
