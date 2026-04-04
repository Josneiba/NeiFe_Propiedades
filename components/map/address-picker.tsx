'use client'

import { useState, useCallback } from 'react'
import { MapPin, Search, AlertCircle, CheckCircle2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const PickerMap = dynamic(
  () => import('./picker-map-inner'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-[#2D3C3C]/20 rounded-xl flex items-center justify-center">
        <p className="text-[#9C8578] text-sm">Cargando mapa...</p>
      </div>
    )
  }
)

interface AddressPickerProps {
  address: string
  commune?: string
  region?: string
  initialLat?: number | null
  initialLng?: number | null
  onCoordinatesChange: (lat: number, lng: number) => void
}

export function AddressPicker({
  address,
  commune,
  region,
  initialLat,
  initialLng,
  onCoordinatesChange,
}: AddressPickerProps) {
  const [searching, setSearching] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [alternatives, setAlternatives] = useState<Array<{
    lat: number; lng: number; displayName: string
  }>>([])

  const searchAddress = useCallback(async () => {
    const fullAddress = [address, commune, region].filter(Boolean).join(', ')
    if (!fullAddress.trim()) {
      setError('Ingresa una dirección primero')
      return
    }

    setSearching(true)
    setError('')
    setSuccess('')
    setAlternatives([])

    try {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(fullAddress)}`
      )
      const data = await res.json()

      if (data.lat && data.lng) {
        const newCoords = { lat: data.lat, lng: data.lng }
        setCoords(newCoords)
        onCoordinatesChange(data.lat, data.lng)
        setSuccess('Ubicación encontrada. Arrastra el marcador para ajustar.')
        if (data.alternatives?.length) {
          setAlternatives(data.alternatives)
        }
      } else {
        setError(data.error ?? 'No se encontró la dirección.')
        // Centrar en Chile como fallback para que el usuario pueda ajustar
        setCoords({ lat: -33.4489, lng: -70.6693 })
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setSearching(false)
    }
  }, [address, commune, region, onCoordinatesChange])

  const selectAlternative = (alt: { lat: number; lng: number }) => {
    setCoords(alt)
    onCoordinatesChange(alt.lat, alt.lng)
    setAlternatives([])
    setSuccess('Ubicación actualizada.')
  }

  const handleDragEnd = useCallback((lat: number, lng: number) => {
    setCoords({ lat, lng })
    onCoordinatesChange(lat, lng)
    setSuccess('Ubicación ajustada manualmente.')
  }, [onCoordinatesChange])

  return (
    <div className="space-y-3">
      {/* Botón de búsqueda */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={searchAddress}
          disabled={searching || !address.trim()}
          className="flex items-center gap-2 text-sm bg-[#75524C] text-[#FAF6F2] px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap"
        >
          {searching ? (
            <>
              <span className="w-4 h-4 border-2 border-[#FAF6F2]/30 border-t-[#FAF6F2] rounded-full animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Ubicar en mapa
            </>
          )}
        </button>

        {coords && (
          <span className="text-xs text-[#9C8578] font-mono">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        )}
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-[#C27F79] bg-[#C27F79]/10 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 text-xs text-[#5E8B8C] bg-[#5E8B8C]/10 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* Alternativas si hay más de una coincidencia */}
      {alternatives.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-[#9C8578]">¿Quisiste decir?</p>
          {alternatives.map((alt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectAlternative(alt)}
              className="w-full text-left text-xs text-[#D5C3B6] bg-[#2D3C3C]/40 hover:bg-[#2D3C3C]/60 rounded-lg px-3 py-2 transition truncate"
            >
              <MapPin className="w-3 h-3 inline mr-1 text-[#9C8578]" />
              {alt.displayName}
            </button>
          ))}
        </div>
      )}

      {/* Mapa con marcador arrastrable */}
      {(coords || searching) && (
        <div className="rounded-xl overflow-hidden border border-[#D5C3B6]/20" style={{ height: 280 }}>
          <PickerMap
            coords={coords ?? { lat: -33.4489, lng: -70.6693 }}
            zoom={coords ? 16 : 5}
            onDragEnd={handleDragEnd}
          />
        </div>
      )}

      {coords && (
        <p className="text-xs text-[#9C8578] flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Arrastra el marcador para ajustar la ubicación exacta
        </p>
      )}
    </div>
  )
}
