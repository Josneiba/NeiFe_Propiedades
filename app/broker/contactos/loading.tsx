export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 rounded-lg bg-[#D5C3B6]/10 animate-pulse" />
      <div className="h-12 w-full rounded-xl bg-[#2D3C3C] animate-pulse" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-[#2D3C3C] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
