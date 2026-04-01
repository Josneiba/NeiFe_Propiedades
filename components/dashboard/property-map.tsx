'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

// Dynamic import para evitar problemas con SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-96 rounded-lg" />,
})

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), {
  ssr: false,
})

const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), {
  ssr: false,
})

const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), {
  ssr: false,
})

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

const defaultCenter: [number, number] = [-33.8688, -71.5203] // Santiago, Chile

// Coordenadas de algunas comunas de Santiago para demostración
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

export function PropertyMap({ properties = [], zoom = 12, center = defaultCenter }: MapPropertyProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <Skeleton className="w-full h-96 rounded-lg" />
  }

  // Procesar propiedades y asignar coordenadas
  const processedProperties = properties.map(prop => {
    let lat = prop.lat
    let lng = prop.lng

    // Si no hay coordenadas, intentar asignarlas basándose en la comuna
    if (!lat || !lng) {
      const coordinates = communeCoordinates[prop.commune]
      if (coordinates) {
        lat = coordinates[0]
        lng = coordinates[1]
      }
    }

    return {
      ...prop,
      lat: lat || center[0],
      lng: lng || center[1],
    }
  })

  // Calcular centro del mapa basado en las propiedades
  let mapCenter = center
  if (processedProperties.length > 0) {
    const avgLat = processedProperties.reduce((acc, p) => acc + (p.lat || 0), 0) / processedProperties.length
    const avgLng = processedProperties.reduce((acc, p) => acc + (p.lng || 0), 0) / processedProperties.length
    mapCenter = [avgLat, avgLng]
  }

  const getPaymentStatus = (payments?: Array<{ status: string }>) => {
    if (!payments || payments.length === 0) return 'PENDING'
    return payments[0].status
  }

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    PAID: { label: 'Pagado', color: 'bg-green-500', bgColor: 'bg-green-100' },
    PENDING: { label: 'Pendiente', color: 'bg-amber-500', bgColor: 'bg-amber-100' },
    OVERDUE: { label: 'Atrasado', color: 'bg-red-500', bgColor: 'bg-red-100' },
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mapa de Propiedades</h2>
        <p className="text-muted-foreground">Visualiza la ubicación de todas tus propiedades</p>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0 h-96 relative">
          {processedProperties.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No hay propiedades para mostrar en el mapa</p>
              </div>
            </div>
          ) : (
            <MapContainer center={mapCenter as [number, number]} zoom={zoom} className="w-full h-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {processedProperties.map(property => (
                <Marker
                  key={property.id}
                  position={[property.lat, property.lng]}
                >
                  <Popup>
                    <div className="space-y-2 min-w-max">
                      <h3 className="font-semibold text-sm">{property.address}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.commune}
                      </p>
                      {property.monthlyRentCLP && (
                        <p className="text-sm font-medium">
                          ${property.monthlyRentCLP.toLocaleString('es-CL')}
                        </p>
                      )}
                      {property.tenant && (
                        <p className="text-xs">Arrendatario: {property.tenant.name || 'Sin asignar'}</p>
                      )}
                      <Badge className={statusConfig[getPaymentStatus(property.payments)]?.bgColor}>
                        {statusConfig[getPaymentStatus(property.payments)]?.label}
                      </Badge>
                      <Link
                        href={`/dashboard/propiedades/${property.id}`}
                        className="text-xs text-blue-600 hover:underline block"
                      >
                        Ver detalles →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </CardContent>
      </Card>

      {/* Properties List */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Propiedades</h3>
        <div className="grid gap-3">
          {processedProperties.map(property => {
            const status = getPaymentStatus(property.payments)
            const statusConfig = statusConfig[status] || { label: 'Desconocido', color: 'bg-gray-500', bgColor: 'bg-gray-100' }

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
                        <Badge className={statusConfig.bgColor} style={{ fontSize: '0.75rem' }}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
