'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'PROCESSING' | 'CANCELLED'
type MarkerStatus = PaymentStatus | 'VACANT' | 'DEFAULT'

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

const DEFAULT_CENTER: [number, number] = [-33.45, -70.65] // Santiago
const REFRESH_INTERVAL_MS = 60_000

const STATUS_ORDER: MarkerStatus[] = ['PAID', 'PENDING', 'OVERDUE', 'PROCESSING', 'VACANT', 'CANCELLED']

const STATUS_COLORS: Record<MarkerStatus, string> = {
  PAID: '#5E8B8C',
  PENDING: '#F2C94C',
  OVERDUE: '#C27F79',
  PROCESSING: '#B8965A',
  CANCELLED: '#94A3B8',
  VACANT: '#9CA3AF',
  DEFAULT: '#75524C',
}

const STATUS_LABELS: Record<MarkerStatus, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Atrasado',
  PROCESSING: 'En revisión',
  CANCELLED: 'Anulado',
  VACANT: 'Sin arrendatario',
  DEFAULT: 'Sin pago',
}

function resolveStatus(payments: Array<{ status: string }>, hasTenant: boolean): MarkerStatus {
  const raw = payments?.[0]?.status as PaymentStatus | undefined
  if (!hasTenant) return 'VACANT'
  if (!raw) return 'PENDING'
  if (['PAID', 'PENDING', 'OVERDUE', 'PROCESSING', 'CANCELLED'].includes(raw)) {
    return raw
  }
  return 'DEFAULT'
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
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markersLayerRef = useRef<import('leaflet').LayerGroup | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)

  const [liveProperties, setLiveProperties] = useState(properties)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setLiveProperties(properties)
  }, [properties])

  useEffect(() => {
    setIsReady(true)
  }, [])

  // Pull fresh status/coords every minute so markers change color without recargar la página
  useEffect(() => {
    let active = true

    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/properties', { cache: 'no-store' })
        if (!active || !res.ok) return
        const json = await res.json()
        if (Array.isArray(json.properties)) {
          setLiveProperties(json.properties)
        }
      } catch (error) {
        console.error('Map refresh error', error)
      }
    }

    fetchLatest()
    const id = setInterval(fetchLatest, REFRESH_INTERVAL_MS)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!isReady || !mapContainerRef.current || mapInstanceRef.current) return
    let cancelled = false

    import('leaflet').then((leafletModule) => {
      if (cancelled || !mapContainerRef.current) return
      const L = (leafletModule as any).default ?? leafletModule
      leafletRef.current = L

      // Fix for marker assets in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      mapInstanceRef.current = map
      markersLayerRef.current = L.layerGroup().addTo(map)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      renderMarkers(liveProperties)
    })

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])

  const renderMarkers = useCallback(
    (data: PropertyForMap[]) => {
      const L = leafletRef.current
      if (!L || !mapInstanceRef.current || !markersLayerRef.current) return

      markersLayerRef.current.clearLayers()

      const coords = data
        .map((p) => ({
          ...p,
          lat: p.lat != null ? Number(p.lat) : null,
          lng: p.lng != null ? Number(p.lng) : null,
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))

      if (coords.length === 0) {
        mapInstanceRef.current.setView(DEFAULT_CENTER, 11)
        return
      }

      coords.forEach((property) => {
        const status = resolveStatus(property.payments, !!property.tenant)
        const color = STATUS_COLORS[status] ?? STATUS_COLORS.DEFAULT
        const statusLabel = STATUS_LABELS[status] ?? STATUS_LABELS.DEFAULT
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

        const marker = L.marker([property.lat!, property.lng!], { icon })
        marker.bindPopup(popupContent, { maxWidth: 260, className: 'neife-popup' })
        markersLayerRef.current.addLayer(marker)
      })

      if (coords.length > 1) {
        const bounds = L.latLngBounds(coords.map((p) => [p.lat!, p.lng!] as [number, number]))
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
      } else {
        mapInstanceRef.current.setView([coords[0].lat!, coords[0].lng!], 15)
      }
    },
    []
  )

  useEffect(() => {
    renderMarkers(liveProperties)
  }, [liveProperties, renderMarkers])

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
      `}</style>

      <div className="flex flex-wrap gap-3 mb-3">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
            {STATUS_LABELS[status]}
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
