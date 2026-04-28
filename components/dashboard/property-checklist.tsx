'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Camera, Loader2 } from 'lucide-react'

type RoomCondition = 'EXCELENTE' | 'BUENA' | 'REGULAR' | 'MALA'

type RoomState = {
  room: string
  condition: RoomCondition
  notes: string
  photos: string[]
}

type ChecklistRecord = {
  id: string
  type: 'CHECKIN' | 'CHECKOUT'
  overallCondition?: string | null
  completedAt?: string | null
  rooms: RoomState[]
}

const CONDITION_LABELS: Record<RoomCondition, string> = {
  EXCELENTE: 'Excelente',
  BUENA: 'Buena',
  REGULAR: 'Regular',
  MALA: 'Mala',
}

export function PropertyChecklist({ propertyId }: { propertyId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingRoom, setUploadingRoom] = useState<string | null>(null)
  const [defaultRooms, setDefaultRooms] = useState<string[]>([])
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([])
  const [type, setType] = useState<'CHECKIN' | 'CHECKOUT'>('CHECKIN')
  const [overallCondition, setOverallCondition] = useState('')
  const [rooms, setRooms] = useState<RoomState[]>([])

  const checkin = useMemo(() => checklists.find((item) => item.type === 'CHECKIN') ?? null, [checklists])
  const checkout = useMemo(() => checklists.find((item) => item.type === 'CHECKOUT') ?? null, [checklists])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/checklist`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar checklist')

        setDefaultRooms(data.defaultRooms || [])
        setChecklists((data.checklists || []).map((item: any) => ({
          ...item,
          rooms: Array.isArray(item.rooms) ? item.rooms : [],
        })))

        const initialRooms = (data.defaultRooms || []).map((room: string) => ({
          room,
          condition: 'BUENA' as RoomCondition,
          notes: '',
          photos: [],
        }))
        setRooms(initialRooms)
        setType(data.checklists?.some((item: any) => item.type === 'CHECKIN') ? 'CHECKOUT' : 'CHECKIN')
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo cargar checklist',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [propertyId, toast])

  const handleRoomPhoto = async (roomName: string, file: File) => {
    setUploadingRoom(roomName)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'properties')
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo subir la foto')

      setRooms((current) =>
        current.map((room) =>
          room.room === roomName ? { ...room, photos: [...room.photos, data.url] } : room
        )
      )
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo subir la foto',
        variant: 'destructive',
      })
    } finally {
      setUploadingRoom(null)
    }
  }

  const saveChecklist = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          rooms,
          overallCondition,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar checklist')

      setChecklists((current) => [
        { ...data.checklist, rooms: Array.isArray(data.checklist.rooms) ? data.checklist.rooms : rooms },
        ...current.filter((item) => item.type !== type),
      ])
      setType(type === 'CHECKIN' ? 'CHECKOUT' : 'CHECKIN')
      setOverallCondition('')
      setRooms(defaultRooms.map((room) => ({ room, condition: 'BUENA', notes: '', photos: [] })))
      toast({ title: 'Checklist guardado' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar checklist',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Cargando checklist...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Checklist de entrada" checklist={checkin} />
        <SummaryCard title="Checklist de salida" checklist={checkout} />
      </div>

      {checkin && checkout ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-lg font-semibold text-foreground">Comparación rápida</h3>
          <div className="mt-4 space-y-3">
            {checkin.rooms.map((room) => {
              const out = checkout.rooms.find((entry) => entry.room === room.room)
              return (
                <div key={room.room} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-3">
                  <p className="font-medium text-foreground">{room.room}</p>
                  <p className="text-sm text-muted-foreground">Entrada: {CONDITION_LABELS[room.condition]}</p>
                  <p className="text-sm text-muted-foreground">Salida: {out ? CONDITION_LABELS[out.condition] : 'Sin registro'}</p>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-lg font-semibold text-foreground">
          Crear checklist de {type === 'CHECKIN' ? 'entrada' : 'salida'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Respaldo visual y escrito para el estado de la propiedad.
        </p>

        <div className="mt-5 space-y-4">
          {rooms.map((room) => (
            <div key={room.room} className="rounded-xl border border-border p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{room.room}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {(['EXCELENTE', 'BUENA', 'REGULAR', 'MALA'] as RoomCondition[]).map((condition) => (
                      <button
                        key={condition}
                        type="button"
                        onClick={() =>
                          setRooms((current) =>
                            current.map((entry) =>
                              entry.room === room.room ? { ...entry, condition } : entry
                            )
                          )
                        }
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          room.condition === condition
                            ? 'border-[#5E8B8C] bg-[#5E8B8C]/10 text-[#5E8B8C]'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {CONDITION_LABELS[condition]}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#5E8B8C]/30 px-3 py-2 text-sm text-[#5E8B8C] hover:bg-[#5E8B8C]/10">
                  {uploadingRoom === room.room ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Subir fotos
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleRoomPhoto(room.room, file)
                    }}
                  />
                </label>
              </div>

              <div className="mt-4">
                <Label className="text-sm text-muted-foreground">Notas</Label>
                <Textarea
                  rows={2}
                  value={room.notes}
                  onChange={(e) =>
                    setRooms((current) =>
                      current.map((entry) =>
                        entry.room === room.room ? { ...entry, notes: e.target.value } : entry
                      )
                    )
                  }
                  className="mt-2"
                />
              </div>

              {room.photos.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.photos.map((photo) => (
                    <a key={photo} href={photo} target="_blank" rel="noopener noreferrer" className="text-sm text-[#5E8B8C] hover:underline">
                      Ver foto
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          <div>
            <Label className="text-sm text-muted-foreground">Resumen general</Label>
            <Input
              value={overallCondition}
              onChange={(e) => setOverallCondition(e.target.value)}
              placeholder="Ej: Propiedad en buen estado general, con desgaste normal"
              className="mt-2"
            />
          </div>

          <Button onClick={saveChecklist} disabled={saving} className="bg-[#75524C] text-[#FAF6F2] hover:bg-[#75524C]/90">
            {saving ? 'Guardando...' : 'Guardar checklist'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  checklist,
}: {
  title: string
  checklist: ChecklistRecord | null
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {checklist ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-muted-foreground">
            Fecha: {checklist.completedAt ? new Date(checklist.completedAt).toLocaleDateString('es-CL') : 'Sin fecha'}
          </p>
          <p className="text-muted-foreground">
            Estado general: {checklist.overallCondition || 'Sin resumen'}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Aún no existe.</p>
      )}
    </div>
  )
}
