import { Skeleton } from "@/components/ui/skeleton"

export default function PropertiesLoading() {
  return (
    <div className="min-h-screen bg-[#1C1917]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2 bg-[#2D3C3C]" />
            <Skeleton className="h-4 w-64 bg-[#2D3C3C]" />
          </div>
          <Skeleton className="h-10 w-32 bg-[#2D3C3C]" />
        </div>

        {/* Property Cards Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#2D3C3C] border border-[#D5C3B6]/10 rounded-lg overflow-hidden">
              {/* Property Image Placeholder */}
              <div className="w-full h-48 bg-[#1C1917] flex items-center justify-center">
                <Skeleton className="h-16 w-16 bg-[#2D3C3C]" />
              </div>
              
              {/* Property Content */}
              <div className="p-6 space-y-4">
                {/* Title and Address */}
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4 bg-[#1C1917]" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-[#1C1917]" />
                    <Skeleton className="h-4 w-32 bg-[#1C1917]" />
                  </div>
                </div>

                {/* Tenant Info */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-[#1C1917]" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-[#1C1917]" />
                    <Skeleton className="h-4 w-24 bg-[#1C1917]" />
                  </div>
                </div>

                {/* Contract Progress */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-[#1C1917]" />
                  <Skeleton className="h-2 w-full bg-[#1C1917]" />
                </div>

                {/* Payment Status */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20 bg-[#1C1917]" />
                    <Skeleton className="h-6 w-24 bg-[#1C1917]" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full bg-[#1C1917]" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1 bg-[#1C1917]" />
                  <Skeleton className="h-9 w-9 bg-[#1C1917]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
