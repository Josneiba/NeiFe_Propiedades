'use client'

import { useState } from 'react'
import { UserPlus, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Props = {
  propertyId: string
  propertyLabel?: string
}

export function InviteTenantButton({ propertyId, propertyLabel }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || ''

  const createInvite = async (type: 'EMAIL' | 'LINK') => {
    setLoading(true)
    setInviteUrl(null)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          propertyId,
          email: type === 'EMAIL' ? email.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo crear la invitación',
          variant: 'destructive',
        })
        return
      }
      const url =
        data.inviteUrl ||
        `${baseUrl}/invitacion/${data.invitation?.token || data.token}`
      setInviteUrl(url)
      toast({
        title: type === 'EMAIL' ? 'Invitación enviada' : 'Enlace listo',
        description:
          type === 'EMAIL'
            ? 'Correo enviado. Revisa spam si no aparece.'
            : 'Copia el enlace y compártelo con tu arrendatario.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast({ title: 'Copiado', description: 'Enlace copiado al portapapeles' })
    } catch {
      toast({
        title: 'No se pudo copiar',
        description: 'Copia el enlace manualmente',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white gap-2">
          <UserPlus className="h-4 w-4" />
          Invitar arrendatario
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar arrendatario</DialogTitle>
          <DialogDescription>Genera un enlace o envía la invitación por correo.</DialogDescription>
        </DialogHeader>
        {propertyLabel && (
          <p className="text-sm text-muted-foreground">{propertyLabel}</p>
        )}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Correo del arrendatario (opcional)</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="correo@ejemplo.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              disabled={loading || !email.trim()}
              onClick={() => createInvite('EMAIL')}
              className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enviar invitación por correo
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => createInvite('LINK')}
              className="border-border"
            >
              Generar solo enlace
            </Button>
          </div>
          {inviteUrl && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs text-muted-foreground break-all">{inviteUrl}</p>
              <Button type="button" size="sm" variant="secondary" onClick={copyLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar enlace
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
