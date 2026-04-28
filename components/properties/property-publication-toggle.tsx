'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MegaphoneOff, RadioTower } from 'lucide-react'

type Props = {
  propertyId: string
  isPublished: boolean
  publishedAt?: string | Date | null
  disabled?: boolean
  onUpdated?: (next: { isPublished: boolean; publishedAt: string | null }) => void
}

export function PropertyPublicationToggle({
  propertyId,
  isPublished,
  publishedAt,
  disabled,
  onUpdated,
}: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState({
    isPublished,
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
  })

  const handleToggle = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: !state.isPublished,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo actualizar la publicación')
      }

      const nextState = {
        isPublished: Boolean(data.property?.isPublished),
        publishedAt: data.property?.publishedAt ?? null,
      }

      setState(nextState)
      onUpdated?.(nextState)

      toast({
        title: nextState.isPublished ? 'Propiedad publicada' : 'Publicación desactivada',
        description: nextState.isPublished
          ? 'La propiedad ya aparece en la vitrina pública de arriendos.'
          : 'La propiedad dejó de mostrarse en la vitrina pública.',
      })
    } catch (error) {
      toast({
        title: 'No se pudo actualizar',
        description: error instanceof Error ? error.message : 'Intenta nuevamente',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        className={
          state.isPublished
            ? 'bg-[#5E8B8C]/20 text-[#5E8B8C] border-[#5E8B8C]/20'
            : 'bg-[#D5C3B6]/10 text-[#9C8578] border-[#D5C3B6]/15'
        }
        variant="outline"
      >
        {state.isPublished ? 'Publicado en arriendos' : 'Solo administración interna'}
      </Badge>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || saving}
        onClick={handleToggle}
        className="gap-2 text-foreground"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state.isPublished ? (
          <MegaphoneOff className="h-4 w-4" />
        ) : (
          <RadioTower className="h-4 w-4" />
        )}
        {state.isPublished ? 'Ocultar en inicio' : 'Publicar en inicio'}
      </Button>
    </div>
  )
}
