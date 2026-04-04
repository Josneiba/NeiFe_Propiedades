'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

interface PropertyMarker {
  id: string
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

// Map coordinates for communes in Santiago
const communeCoordinates: Record<string, [number, number]> = {
  'Providencia': [-33.4281, -70.4093],
  'Santiago': [-33.4489, -70.6693],
  'La Florida': [-33.5207, -70.5645],
  'Puente Alto': [-33.6145, -70.5706],
  'San Bernardo': [-33.7521, -70.6969],
  'La Reina': [-33.4017, -70.4667],
  'Maipú': [-33.5228, -70.7571],
  'Ñuñoa': [-33.4172, -70.5757],
  'Vitacura': [-33.3989, -70.5956],
  'Las Condes': [-33.3928, -70.5706],
  'Lo Barnechea': [-33.3584, -70.4778],
  'Peñalolén': [-33.4573, -70.5461],
  'San Isidro': [-33.4755, -70.6192],
  'El Bosque': [-33.5889, -70.6844],
  'Huechuraba': [-33.3839, -70.5408],
  'Renca': [-33.4303, -70.7308],
  'Conchalí': [-33.4106, -70.6847],
  'Quilicura': [-33.3394, -70.6906],
  'Macul': [-33.4934, -70.5495],
  'La Pintana': [-33.6395, -70.6445],
}

const MapComponent = dynamic(() => import('leaflet'), { ssr: false })

export function PropertyMap({ properties = [], zoom = 12, center = [-33.8688, -71.5203] }: MapPropertyProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)

  useEffect(() => {
    // Only load Leaflet on client side
    if (typeof window === 'undefined') return
    
    const loadMap = async () => {
      try {
        const L = (await import('leaflet')).default
        
        // Ensure proper styles load
        if (document.querySelector('link[href*="leaflet.css"]') === null) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
          document.head.appendChild(link)
        }

        if (!mapContainer.current) return
        
        // Initialize map
        map.current = L.map(mapContainer.current).setView(
          center as [number, number],
          zoom
        )

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map.current)

        // Add markers for properties
        properties.forEach(property => {
          let lat = property.lat
          let lng = property.lng

          // Use commune coordinates if no specific coordinates provided
          if (!lat || !lng) {
            const coords = communeCoordinates[property.commune]
            if (coords) {
              lat = coords[0]
              lng = coords[1]
            } else {
              lat = (center as [number, number])[0]
              lng = (center as [number, number])[1]
            }
          }

          // Get payment status for color coding
          const status = property.payments?.[0]?.status || 'PENDING'
          const statusColors = {
            PAID: '#22c55e',
            PENDING: '#eab308',
            OVERDUE: '#ef4444',
          }

          const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: (statusColors as Record<string, string>)[status] || '#6b7280',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(map.current)

          // Add popup with property info
          const popupContent = `
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-sm mb-1">${property.address}</h3>
              <p class="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                ${property.commune}
              </p>
              ${property.monthlyRentCLP ? `<p class="text-xs font-medium mb-2">$${(property.monthlyRentCLP / 1000).toFixed(0)}K</p>` : ''}
              ${property.tenant ? `<p class="text-xs text-gray-600">Arrendatario: ${property.tenant.name || 'Sin asignar'}</p>` : ''}
            </div>
          `
          
          marker.bindPopup(popupContent)
        })

        // Adjust map to fit all markers
        if (properties.length > 0) {
          const group = new L.featureGroup(
            properties.map(prop => {
              let lat = prop.lat || (center as [number, number])[0]
              let lng = prop.lng || (center as [number, number])[1]
              const coords = communeCoordinates[prop.commune]
              if (coords && (!prop.lat || !prop.lng)) {
                lat = coords[0]
                lng = coords[1]
              }
              return L.marker([lat, lng])
            })
          )
          map.current.fitBounds(group.getBounds().pad(0.1))
        }
      } catch (error) {
        console.error('Error loading map:', error)
      }
    }

    loadMap()

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [properties, zoom, center])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mapa de Propiedades</h2>
        <p className="text-muted-foreground">Visualiza la ubicación de todas tus propiedades</p>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          {properties.length === 0 ? (
            <div className="w-full h-96 flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No hay propiedades para mostrar en el mapa</p>
              </div>
            </div>
          ) : (
            <div 
              ref={mapContainer} 
              className="w-full h-96"
              style={{ backgroundColor: '#f3f4f6' }}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {properties.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Estados de Pago</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Pagado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-xs text-muted-foreground">Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-muted-foreground">Atrasado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties List */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Propiedades</h3>
        {properties.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No hay propiedades para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {properties.map(property => {
              const status = property.payments?.[0]?.status || 'PENDING'
              const statusConfig: Record<string, { label: string; bgColor: string }> = {
                PAID: { label: 'Pagado', bgColor: 'bg-green-100' },
                PENDING: { label: 'Pendiente', bgColor: 'bg-amber-100' },
                OVERDUE: { label: 'Atrasado', bgColor: 'bg-red-100' },
              }
              const config = statusConfig[status] || { label: 'Desconocido', bgColor: 'bg-gray-100' }

              return (
                <Link key={property.id} href={`/dashboard/propiedades/${property.id}`}>
                  <Card className="bg-card border-border hover:border-foreground/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{property.address}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{property.commune}</span>
                          </div>
                          {property.tenant && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Arrendatario: {property.tenant.name || 'Sin asignar'}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {property.monthlyRentCLP && (
                            <p className="font-semibold text-foreground">
                              ${(property.monthlyRentCLP / 1000).toFixed(0)}K
                            </p>
                          )}
                          <Badge className={config.bgColor} style={{ fontSize: '0.75rem' }}>
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
