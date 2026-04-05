'use client'

import dynamic from 'next/dynamic'
import { Building2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PropertyForMap {
  id: string
  name: string | null
  address: string | null
  commune: string
  lat: number | null
  lng: number | null
  monthlyRentCLP: number | null
  tenant: { name: string | null } | null
  payments: Array<{ status: string }>
}

interface PropertyMapProps {
  properties: PropertyForMap[]
}

const MapWithNoSSR = dynamic(() => import('./property-map-client'), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: '500px' }}
      className="w-full rounded-xl bg-[#2D3C3C]/40 border border-border flex flex-col items-center justify-center gap-3"
    >
      <div className="w-8 h-8 border-2 border-[#75524C]/30 border-t-[#75524C] rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Cargando mapa...</p>
    </div>
  ),
})

export function PropertyMap({ properties }: PropertyMapProps) {
  const withCoords = properties.filter((p) => p.lat && p.lng)
  const withoutCoords = properties.filter((p) => !p.lat || !p.lng)

  return (
    <div className="space-y-4">
      {withoutCoords.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F2C94C]/10 border border-[#F2C94C]/20">
          <MapPin className="w-4 h-4 text-[#F2C94C] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium">
              {withoutCoords.length} propiedad{withoutCoords.length > 1 ? 'es' : ''} sin ubicación configurada
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edita cada propiedad para agregar sus coordenadas.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {withoutCoords.map((p) => (
                <Link key={p.id} href={`/dashboard/propiedades/${p.id}/editar`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-[#F2C94C]/30 text-[#F2C94C] hover:bg-[#F2C94C]/10"
                  >
                    {p.name ?? 'Propiedad'} →
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <div
          style={{ height: '400px' }}
          className="w-full rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3"
        >
          <Building2 className="w-10 h-10 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">Sin propiedades registradas</p>
          <Link href="/dashboard/propiedades/nueva">
            <Button className="bg-[#75524C] text-[#D5C3B6]">Agregar primera propiedad</Button>
          </Link>
        </div>
      ) : withCoords.length === 0 ? (
        <div
          style={{ height: '400px' }}
          className="w-full rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3"
        >
          <MapPin className="w-10 h-10 text-muted-foreground opacity-50" />
          <p className="text-foreground font-medium">Sin ubicaciones en el mapa</p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Edita tus propiedades y agrega las coordenadas para verlas aquí
          </p>
        </div>
      ) : (
        <MapWithNoSSR properties={withCoords} />
      )}
    </div>
  )
}
