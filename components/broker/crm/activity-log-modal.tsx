'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const ACTIVITY_TYPES = [
  { value: 'LLAMADA', label: '📞 Llamada' },
  { value: 'VISITA', label: '🏠 Visita' },
  { value: 'EMAIL', label: '✉️ Email' },
  { value: 'WHATSAPP', label: '💬 WhatsApp' },
  { value: 'REUNION', label: '🤝 Reunión' },
  { value: 'NOTA', label: 'Nota' },
  { value: 'TAREA', label: '✅ Tarea' },
]

interface Props {
  dealId?: string
  contactId?: string
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function ActivityLogModal({
  dealId,
  contactId,
  open,
  onClose,
  onCreated,
}: Props) {
  const [type, setType] = useState('LLAMADA')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!title.trim()) return toast.error('El título es requerido')
    setSaving(true)
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          description,
          dealId,
          contactId,
          isDone: true,
          completedAt: new Date(),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Actividad registrada')
      onCreated()
      onClose()
    } catch {
      toast.error('No se pudo registrar la actividad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C2828] border-[#D5C3B6]/15 text-[#FAF6F2] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar actividad</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-[#9C8578] mb-1.5 block">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/20">
                {ACTIVITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#9C8578] mb-1.5 block">Título / Resumen</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Llamada confirmó visita para el viernes"
              className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]"
            />
          </div>
          <div>
            <Label className="text-xs text-[#9C8578] mb-1.5 block">Notas adicionales (opcional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles..."
              className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-[#D5C3B6]/20 text-[#9C8578]">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80">
              {saving ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
