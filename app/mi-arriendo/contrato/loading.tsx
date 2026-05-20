import { Skeleton } from "@/components/ui/skeleton"

export default function TenantContractLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-44 bg-[#2A2520]" />
        <Skeleton className="h-4 w-64 bg-[#2A2520]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-[620px] rounded-2xl bg-[#2A2520]" />
          <Skeleton className="h-[180px] rounded-2xl bg-[#2A2520]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[260px] rounded-2xl bg-[#2A2520]" />
          <Skeleton className="h-[320px] rounded-2xl bg-[#2A2520]" />
        </div>
      </div>
    </div>
  )
}
