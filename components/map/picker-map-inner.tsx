'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface PickerMapProps {
  coords: { lat: number; lng: number }
  zoom: number
  onDragEnd: (lat: number, lng: number) => void
}

// Marcador arrastrable con colores NeiFe
function createDraggableIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:36px;cursor:grab">
        <div style="
          width:28px;height:28px;
          background:#75524C;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid #FAF6F2;
          box-shadow:0 3px 10px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position:absolute;top:7px;left:7px;
          width:10px;height:10px;
          background:#FAF6F2;border-radius:50%;
          transform:rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  })
}

export default function PickerMapInner({ coords, zoom, onDragEnd }: PickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Fix íconos Leaflet en Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [coords.lat, coords.lng],
      zoom
    )
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([coords.lat, coords.lng], {
      draggable: true,
      icon: createDraggableIcon(),
    }).addTo(map)
    markerRef.current = marker

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      onDragEnd(pos.lat, pos.lng)
    })

    // Click en el mapa también mueve el marcador
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onDragEnd(e.latlng.lat, e.latlng.lng)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // Solo inicializar una vez

  // Actualizar posición si cambian coords desde fuera (nueva búsqueda)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([coords.lat, coords.lng])
    mapRef.current.flyTo([coords.lat, coords.lng], zoom, { duration: 1 })
  }, [coords.lat, coords.lng, zoom])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
