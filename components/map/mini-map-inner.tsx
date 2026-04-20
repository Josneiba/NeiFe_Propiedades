'use client'

import { useEffect, useRef } from 'react'

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

    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return

      // Ensure Leaflet CSS is loaded
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
        document.head.appendChild(link)
        
        // Wait for CSS to load
        await new Promise(resolve => setTimeout(resolve, 100))
      }

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

      // Ensure proper sizing and rendering
      setTimeout(() => {
        if (mapRef.current && !cancelled) {
          mapRef.current.invalidateSize()
        }
      }, 50)

      setTimeout(() => {
        if (mapRef.current && !cancelled) {
          mapRef.current.invalidateSize()
        }
      }, 200)
    })()

    return () => {
      cancelled = true
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
