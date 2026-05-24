"use client"
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { PropertyHealth } from '@/lib/property-health'

interface Props {
  property: {
    id: string
    name?: string | null
    address: string
    commune: string
    health: PropertyHealth
  }
}

export default function PropertyHealthRow({ property }: Props) {
  const health: PropertyHealth = property.health

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#D5C3B6]/8 bg-[#1C1917] p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-3 w-3 rounded-full" style={{ background: health.color }} />
        <div>
          <p className="text-sm font-semibold text-[#FAF6F2]">{property.name || property.address} · <span className="text-[#9C8578]">{property.commune}</span></p>
          <p className="text-xs text-[#9C8578] mt-1 line-clamp-2">{health.issues.join(' · ')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className="bg-opacity-20 text-xs font-semibold" style={{ background: `${health.color}20`, color: health.color, border: `1px solid ${health.color}40` }}>
          {health.label}
        </Badge>
        <Link href={`/dashboard/propiedades/${property.id}`} className="text-sm text-[#B8965A]">Ver</Link>
      </div>
    </div>
  )
}
