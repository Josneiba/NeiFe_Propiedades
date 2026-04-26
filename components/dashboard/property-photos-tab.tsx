'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Camera, Image as ImageIcon, Loader2, Upload } from 'lucide-react'

type PropertyPhoto = {
  id: string
  url: string
  type: 'CHECKIN' | 'CHECKOUT' | 'CURRENT' | 'MAINTENANCE'
  room: string
  caption: string | null
  takenAt: string
}

type Props = {
  propertyId: string
}

const photoTypeOptions: Array<{ value: PropertyPhoto['type']; label: string }> = [
  { value: 'CURRENT', label: 'Actual' },
  { value: 'CHECKIN', label: 'Check-in' },
  { value: 'CHECKOUT', label: 'Check-out' },
  { value: 'MAINTENANCE', label: 'Mantención' },
]

const photoTypeLabels: Record<PropertyPhoto['type'], string> = {
  CURRENT: 'Actual',
  CHECKIN: 'Check-in',
  CHECKOUT: 'Check-out',
  MAINTENANCE: 'Mantención',
}

export function PropertyPhotosTab({ propertyId }: Props) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PropertyPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [room, setRoom] = useState('General')
  const [type, setType] = useState<PropertyPhoto['type']>('CURRENT')

  const loadPhotos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/photos`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar las fotos')
      }

      setPhotos(data.photos ?? [])
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudieron cargar las fotos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPhotos()
  }, [propertyId])

  const handleUpload = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('room', room.trim() || 'General')

      const response = await fetch(`/api/properties/${propertyId}/photos`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo subir la foto')
      }

      toast({
        title: 'Foto subida',
        description: 'La foto se guardó correctamente en la propiedad.',
      })

      setRoom('General')
      await loadPhotos()
    } catch (error) {
      toast({
        title: 'Error al subir',
        description:
          error instanceof Error ? error.message : 'No se pudo subir la foto',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Habitación / espacio
          </label>
          <Input
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            placeholder="Ej: Living, Cocina, Dormitorio principal"
            className="bg-background"
            maxLength={80}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tipo
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as PropertyPhoto['type'])}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {photoTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void handleUpload(file)
              }
            }}
          />
          <Button
            type="button"
            className="w-full bg-[#75524C] text-[#D5C3B6] hover:bg-[#75524C]/90 md:w-auto"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Subir foto
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-muted/20 p-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#5E8B8C]" />
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
          <Camera className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aún no hay fotos registradas para esta propiedad.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="aspect-square overflow-hidden bg-muted/30">
                <img
                  src={photo.url}
                  alt={photo.caption || `Foto de ${photo.room}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="space-y-1 p-3">
                <p className="text-sm font-medium text-foreground">{photo.room}</p>
                <p className="text-xs text-muted-foreground">{photoTypeLabels[photo.type]}</p>
                {photo.caption ? (
                  <p className="text-xs text-muted-foreground">{photo.caption}</p>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ImageIcon className="h-3 w-3" />
                    <span>Sin descripción adicional</span>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
