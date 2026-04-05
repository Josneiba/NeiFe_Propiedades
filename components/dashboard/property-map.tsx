'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

interface PropertyMarker {
  id: string
  name?: string | null
  address: string
  commune: string
  lat: number | null
  lng: number | null
  monthlyRentCLP?: number | null
  tenant?: {
    name: string | null
  } | null
  payments?: Array<{
    status: string
  }>
}

interface MapPropertyProps {
  properties: PropertyMarker[]
  zoom?: number
  center?: [number, number]
}

const communeCoordinates: Record<string, [number, number]> = {
  Providencia: [-33.4281, -70.4093],
  Santiago: [-33.4489, -70.6693],
  'La Florida': [-33.5207, -70.5645],
  'Puente Alto': [-33.6145, -70.5706],
  'San Bernardo': [-33.7521, -70.6969],
  'La Reina': [-33.4017, -70.4667],
  Maipú: [-33.5228, -70.7571],
  Ñuñoa: [-33.4172, -70.5757],
  Vitacura: [-33.3989, -70.5956],
  'Las Condes': [-33.3928, -70.5706],
  'Lo Barnechea': [-33.3584, -70.4778],
  'Peñalolén': [-33.4573, -70.5461],
  'San Isidro': [-33.4755, -70.6192],
  'El Bosque': [-33.5889, -70.6844],
  Huechuraba: [-33.3839, -70.5408],
  Renca: [-33.4303, -70.7308],
  Conchalí: [-33.4106, -70.6847],
  Quilicura: [-33.3394, -70.6906],
  Macul: [-33.4934, -70.5495],
  'La Pintana': [-33.6395, -70.6445],
  'Peñaflor': [-33.6167, -70.8764],
  Melipilla: [-33.6891, -71.2153],
  'Punta Arenas': [-53.1638, -70.9171],
  Valparaíso: [-33.0472, -71.6127],
  Concepción: [-36.8201, -73.0444],
}

function resolveCoords(
  property: PropertyMarker,
  fallbackCenter: [number, number]
): [number, number] {
  if (property.lat != null && property.lng != null) {
    return [property.lat, property.lng]
  }
  const coords = communeCoordinates[property.commune.trim()]
  if (coords) return coords
  return fallbackCenter
}

export function PropertyMap({
  properties = [],
  zoom = 12,
  center = [-33.4489, -70.6693],
}: MapPropertyProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const list = Array.isArray(properties) ? properties : []

  useEffect(() => {
    if (typeof window === 'undefined' || !mapElRef.current || list.length === 0) return

    let cancelled = false
    let mapInstance: import('leaflet').Map | null = null
    let ro: ResizeObserver | null = null

    const run = async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      if (cancelled || !mapElRef.current) return

      const L = (await import('leaflet')).default
      if (cancelled || !mapElRef.current) return

      if (!document.querySelector('link[data-leaflet-css]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
        link.setAttribute('data-leaflet-css', '1')
        document.head.appendChild(link)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      mapRef.current?.remove()
      mapRef.current = null

      const el = mapElRef.current
      el.innerHTML = ''

      mapInstance = L.map(el, {
        zoomControl: true,
      }).setView(center, zoom)

      mapRef.current = mapInstance

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
        minZoom: 3,
      }).addTo(mapInstance)

      const positions: [number, number][] = []
      for (const property of list) {
        const [lat, lng] = resolveCoords(property, center as [number, number])
        positions.push([lat, lng])

        const status = property.payments?.[0]?.status || 'PENDING'
        const statusColors: Record<string, string> = {
          PAID: '#22c55e',
          PENDING: '#eab308',
          OVERDUE: '#ef4444',
        }
        const color = statusColors[status] || '#6b7280'
        const title = property.name || property.address

        const marker = L.circleMarker([lat, lng], {
          radius: 10,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(mapInstance)

        const popupHTML = `
            <div class="p-2 max-w-xs text-sm" style="color:#111">
              <p style="font-weight:600">${escapeHtml(title)}</p>
              <p style="font-size:11px;color:#444;margin-top:4px">${escapeHtml(property.commune)}</p>
              ${property.monthlyRentCLP ? `<p style="font-size:11px;margin-top:4px">$${(property.monthlyRentCLP / 1000).toFixed(0)}K/mes</p>` : ''}
              ${property.tenant?.name ? `<p style="font-size:11px;color:#555">${escapeHtml(property.tenant.name)}</p>` : ''}
            </div>`
        marker.bindPopup(popupHTML, { maxWidth: 260 })
      }

      if (positions.length === 1) {
        mapInstance.setView(positions[0], 15)
      } else if (positions.length > 1) {
        const bounds = L.latLngBounds(positions)
        mapInstance.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: false })
      }

      const invalidate = () => {
        mapInstance?.invalidateSize({ animate: false })
      }
      invalidate()
      requestAnimationFrame(invalidate)
      setTimeout(invalidate, 100)
      setTimeout(invalidate, 400)

      if (wrapperRef.current && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => invalidate())
        ro.observe(wrapperRef.current)
      }
    }

    void run()

    return () => {
      cancelled = true
      ro?.disconnect()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [list, zoom, center])

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border shadow-lg overflow-visible">
        <CardContent className="p-0 overflow-visible">
          {list.length === 0 ? (
            <div className="w-full min-h-[520px] h-[520px] flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30">
              <MapPin className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground text-lg font-medium">No hay propiedades para mostrar</p>
              <p className="text-muted-foreground text-sm mt-1">Crea una propiedad para verla en el mapa</p>
            </div>
          ) : (
            <div
              ref={wrapperRef}
              className="relative isolate h-[520px] w-full rounded-lg bg-[#dfe4e8]"
            >
              <div
                ref={mapElRef}
                className="absolute inset-0 z-0 rounded-lg [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:rounded-lg [&_.leaflet-tile-pane]:z-[1]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {list.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-lg">🗺️</span> Estados de Pago
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow" />
                <span className="text-sm text-foreground font-medium">Pagado</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
                <div className="w-4 h-4 rounded-full bg-yellow-400 shadow" />
                <span className="text-sm text-foreground font-medium">Pendiente</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow" />
                <span className="text-sm text-foreground font-medium">Atrasado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span> Listado de Propiedades
        </h3>
        {list.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground font-medium">No hay propiedades registradas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((property) => {
              const status = property.payments?.[0]?.status || 'PENDING'
              const statusConfig: Record<string, { label: string; bgColor: string }> = {
                PAID: { label: '✓ Pagado', bgColor: 'bg-green-100' },
                PENDING: { label: '⏳ Pendiente', bgColor: 'bg-amber-100' },
                OVERDUE: { label: '⚠ Atrasado', bgColor: 'bg-red-100' },
              }
              const config = statusConfig[status] || { label: '? Desconocido', bgColor: 'bg-gray-100' }

              return (
                <Link key={property.id} href={`/dashboard/propiedades/${property.id}`}>
                  <Card className="bg-card border-border hover:border-foreground/50 transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-foreground truncate text-base">
                            {property.name || property.address}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 shrink-0 flex-none" />
                            <span className="truncate">{property.commune}</span>
                          </div>
                        </div>

                        {property.tenant && (
                          <p className="text-xs text-muted-foreground border-t border-border pt-2">
                            👤 {property.tenant.name || 'Sin arrendatario'}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          {property.monthlyRentCLP ? (
                            <p className="font-semibold text-foreground text-base">
                              ${(property.monthlyRentCLP / 1000).toFixed(0)}K
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin arriendo definido</span>
                          )}
                          <Badge className={config.bgColor} style={{ fontSize: '0.7rem' }}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
