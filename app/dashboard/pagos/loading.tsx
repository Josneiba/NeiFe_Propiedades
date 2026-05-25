import { Skeleton } from "@/components/ui/skeleton"

export default function PaymentsLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      <div className="mt-2">
        <div className="h-8 rounded-md bg-transparent grid grid-cols-5 gap-2">
          <Skeleton className="h-8 col-span-1" />
          <Skeleton className="h-8 col-span-1" />
          <Skeleton className="h-8 col-span-1" />
          <Skeleton className="h-8 col-span-1" />
          <Skeleton className="h-8 col-span-1" />
        </div>

        <div className="space-y-3 mt-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
