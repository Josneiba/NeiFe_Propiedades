'use client'

import { useEffect, useRef, useState } from 'react'

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

const STATUS_COLORS = {
  PAID: '#5E8B8C',      // Verde azulado - Pagado
  PENDING: '#F2C94C',   // Amarillo - Pendiente
  OVERDUE: '#C27F79',   // Rojo/marrón - Atrasado
  PROCESSING: '#B8965A', // Naranja - En revisión
  default: '#75524C',   // Marrón default - Sin pago
}

const STATUS_LABELS = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Atrasado',
  PROCESSING: 'En revisión',
}

function getStatusColor(payments: Array<{ status: string }>) {
  if (!payments || payments.length === 0) {
    return STATUS_COLORS.default // Sin pago registrado
  }
  const status = payments[0]?.status ?? 'default'
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.default
}

function getStatusLabel(payments: Array<{ status: string }>) {
  if (!payments || payments.length === 0) {
    return 'Sin pago'
  }
  const status = payments[0]?.status ?? ''
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? 'Sin pago'
}

function createMarkerIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path
        d="M16 2C9.373 2 4 7.373 4 14c0 10.5 12 26 12 26S28 24.5 28 14C28 7.373 22.627 2 16 2z"
        fill="${color}"
        stroke="white"
        stroke-width="2"
      />
      <circle cx="16" cy="14" r="5" fill="white" opacity="0.9"/>
    </svg>
  `
  const encoded = btoa(unescape(encodeURIComponent(svg)))
  return {
    iconUrl: `data:image/svg+xml;base64,${encoded}`,
    iconSize: [32, 42] as [number, number],
    iconAnchor: [16, 42] as [number, number],
    popupAnchor: [0, -44] as [number, number],
  }
}

export default function PropertyMapClient({ properties }: { properties: PropertyForMap[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady || !mapContainerRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    import('leaflet').then((leafletModule) => {
      const L = leafletModule as typeof import('leaflet')
      if (!mapContainerRef.current || mapInstanceRef.current) return

      // Fix for marker assets in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const coords = properties
        .map((p) => ({
          ...p,
          lat: p.lat != null ? Number(p.lat) : null,
          lng: p.lng != null ? Number(p.lng) : null,
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))

      const lats = coords.map((p) => p.lat!) as number[]
      const lngs = coords.map((p) => p.lng!) as number[]
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
      const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
      const zoom = properties.length === 1 ? 15 : 12

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      properties.forEach((property) => {
        const lat = property.lat != null ? Number(property.lat) : null
        const lng = property.lng != null ? Number(property.lng) : null
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

        const color = getStatusColor(property.payments)
        const statusLabel = getStatusLabel(property.payments)
        const icon = L.icon(createMarkerIcon(color))

        const rentFormatted = property.monthlyRentCLP
          ? `$${property.monthlyRentCLP.toLocaleString('es-CL')}/mes`
          : 'Sin arriendo definido'

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 200px; max-width: 240px;">
            <div style="background: #2D3C3C; color: #FAF6F2; padding: 10px 12px; margin: -10px -10px 10px -10px; border-radius: 8px 8px 0 0;">
              <p style="margin: 0; font-weight: 600; font-size: 14px; line-height: 1.3;">
                ${property.name ?? 'Propiedad'}
              </p>
            </div>
            <div style="padding: 0 2px;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #9C8578; line-height: 1.4;">
                ${property.address ?? ''}
              </p>
              <p style="margin: 0 0 6px; font-size: 12px; color: #9C8578;">
                ${property.commune}
              </p>
              ${
                property.tenant
                  ? `<p style="margin: 0 0 6px; font-size: 12px; color: #1C1917;"><strong>Arrendatario:</strong> ${property.tenant.name ?? ''}</p>`
                  : `<p style="margin: 0 0 6px; font-size: 12px; color: #C27F79;">Sin arrendatario</p>`
              }
              <p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; font-family: monospace; color: #1C1917;">
                ${rentFormatted}
              </p>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: ${color}22; color: ${color}; border: 1px solid ${color}44;">
                  ${statusLabel}
                </span>
                <a href="/dashboard/propiedades/${property.id}" style="font-size: 12px; color: #5E8B8C; text-decoration: none; font-weight: 500;">
                  Ver detalle →
                </a>
              </div>
            </div>
          </div>
        `

        const marker = L.marker([lat!, lng!], { icon })
        marker.bindPopup(popupContent, { maxWidth: 260, className: 'neife-popup' })
        marker.addTo(map)
      })

      if (properties.length > 1) {
        const bounds = L.latLngBounds(
          properties
            .map((p) => [Number(p.lat), Number(p.lng)] as [number, number])
            .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
        )
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isReady, properties])

  return (
    <>
      <style>{`
        .neife-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 1px solid #D5C3B620;
          padding: 10px;
        }
        .neife-popup .leaflet-popup-content {
          margin: 0;
        }
        .neife-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-container {
          font-family: system-ui, sans-serif;
          border-radius: 12px;
        }
        .leaflet-pane,
        .leaflet-tile,
        .leaflet-marker-icon,
        .leaflet-marker-shadow,
        .leaflet-tile-pane,
        .leaflet-overlay-pane,
        .leaflet-shadow-pane,
        .leaflet-marker-pane,
        .leaflet-popup-pane,
        .leaflet-map-pane svg,
        .leaflet-map-pane canvas {
          z-index: auto !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 400 !important;
        }
        .leaflet-popup {
          z-index: 450 !important;
        }
      `}</style>

      <div className="flex flex-wrap gap-3 mb-3">
        {Object.entries(STATUS_COLORS)
          .filter(([key]) => key !== 'default')
          .map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
            </div>
          ))}
      </div>

      <div
        ref={mapContainerRef}
        style={{
          height: '500px',
          width: '100%',
          borderRadius: '12px',
          border: '1px solid rgba(213, 195, 182, 0.2)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </>
  )
}
