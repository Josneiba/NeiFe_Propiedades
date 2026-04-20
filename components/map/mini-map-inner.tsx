'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

type Props = {
  lat: number
  lng: number
  address: string
}

export default function MiniMapInner({ lat, lng, address }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    if (!ref.current) return

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    let timeoutA: ReturnType<typeof setTimeout> | null = null
    let timeoutB: ReturnType<typeof setTimeout> | null = null

    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return

      // Pre-warm the container
      const container = ref.current
      container.style.visibility = 'hidden'
      container.style.opacity = '0'

      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Clean up existing map if any
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map(ref.current, {
        zoomControl: false,
        dragging: true,
        scrollWheelZoom: false,
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true,
      }).setView([lat, lng], 15)

      mapRef.current = map

      // Add tile layer with better error handling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }).addTo(map)

      // Add marker
      const marker = L.marker([lat, lng]).addTo(map)
      if (address) {
        marker.bindPopup(address).openPopup()
      }

      const syncSize = () => {
        if (!mapRef.current || cancelled) return
        mapRef.current.invalidateSize()
        container.style.visibility = 'visible'
        container.style.opacity = '1'
      }

      resizeObserver = new ResizeObserver(syncSize)
      resizeObserver.observe(container)

      requestAnimationFrame(syncSize)
      timeoutA = setTimeout(syncSize, 120)
      timeoutB = setTimeout(syncSize, 320)
    })()

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      if (timeoutA) clearTimeout(timeoutA)
      if (timeoutB) clearTimeout(timeoutB)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng, address])

  return (
    <div 
      ref={ref} 
      className="w-full h-[220px] rounded-b-xl overflow-hidden"
      style={{ 
        zIndex: 0,
        backgroundColor: '#f3f4f6'
      }} 
    />
  )
}
