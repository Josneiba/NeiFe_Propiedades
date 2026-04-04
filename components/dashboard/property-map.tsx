'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

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

export function PropertyMap({ properties = [] }: MapPropertyProps) {
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
        <h2 className="text-2xl font-bold text-foreground">Mis Propiedades</h2>
        <p className="text-muted-foreground">Visualiza todas tus propiedades</p>
      </div>

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
              const status = getPaymentStatus(property.payments)
              const propStatusConfig = statusConfig[status] || { label: 'Desconocido', color: 'bg-gray-500', bgColor: 'bg-gray-100' }

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
                          <Badge className={propStatusConfig.bgColor} style={{ fontSize: '0.75rem' }}>
                            {propStatusConfig.label}
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
