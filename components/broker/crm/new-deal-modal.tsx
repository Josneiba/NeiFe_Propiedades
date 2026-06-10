'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function NewDealModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [operationType, setOperationType] = useState('ARRIENDO')
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!title.trim()) return toast.error('El título es requerido')
    setSaving(true)
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          operationType,
          value: value ? parseFloat(value) : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Oportunidad creada')
      onCreated()
      onClose()
      setTitle('')
      setValue('')
    } catch {
      toast.error('Error al crear la oportunidad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C2828] border-[#D5C3B6]/15 text-[#FAF6F2]">
        <DialogHeader>
          <DialogTitle>Nueva oportunidad</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-[#9C8578] mb-1.5 block">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Arriendo Depto Providencia — C. Mendoza"
              className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]"
            />
          </div>
          <div>
            <Label className="text-xs text-[#9C8578] mb-1.5 block">Tipo de operación</Label>
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/20">
                <SelectItem value="ARRIENDO">Arriendo</SelectItem>
                <SelectItem value="VENTA">Venta</SelectItem>
                <SelectItem value="AMBOS">Arriendo y Venta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#9C8578] mb-1.5 block">Valor estimado (CLP, opcional)</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="620000"
              className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-[#D5C3B6]/20 text-[#9C8578]">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80">
              {saving ? 'Creando...' : 'Crear oportunidad'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
