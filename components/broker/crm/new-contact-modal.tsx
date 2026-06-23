'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function NewContactModal({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'LEAD', email: '', phone: '', rut: '', source: 'OTRO', priority: 'MEDIUM', notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) return toast.error('El nombre es requerido')
    setSaving(true)
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          email: form.email || null,
          phone: form.phone || null,
          rut: form.rut || null,
          source: form.source,
          priority: form.priority,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      toast.success(`Contacto ${created.code} creado exitosamente`)
      setOpen(false)
      setForm({ name: '', type: 'LEAD', email: '', phone: '', rut: '', source: 'OTRO', priority: 'MEDIUM', notes: '' })
      onCreated?.()
    } catch {
      toast.error('Error al crear el contacto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Contacto
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1C2828] border-[#D5C3B6]/15 text-[#FAF6F2] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pt-2">
          <DialogTitle>Nuevo contacto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pb-4 max-h-[80vh] overflow-y-auto">
          <div>
            <Label htmlFor="name" className="text-[#9C8578] text-xs font-semibold mb-1 block">Nombre completo *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Carlos Mendoza"
              className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-9" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="type" className="text-[#9C8578] text-xs font-semibold mb-1 block">Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/20">
                  <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                  <SelectItem value="ARRENDATARIO">Arrendatario</SelectItem>
                  <SelectItem value="INVERSIONISTA">Inversionista</SelectItem>
                  <SelectItem value="LEAD">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source" className="text-[#9C8578] text-xs font-semibold mb-1 block">Fuente *</Label>
              <Select value={form.source} onValueChange={(v) => set('source', v)}>
                <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/20">
                  <SelectItem value="PORTAL">Portal</SelectItem>
                  <SelectItem value="REFERIDO">Referido</SelectItem>
                  <SelectItem value="REDES_SOCIALES">Redes Sociales</SelectItem>
                  <SelectItem value="LLAMADA">Llamada</SelectItem>
                  <SelectItem value="LETRERO">Letrero</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority" className="text-[#9C8578] text-xs font-semibold mb-1 block">Prioridad</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/20">
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="LOW">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="phone" className="text-[#9C8578] text-xs font-semibold mb-1 block">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+56 9 8765 4321"
                className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-9" />
            </div>
            <div>
              <Label htmlFor="email" className="text-[#9C8578] text-xs font-semibold mb-1 block">Email</Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="correo@mail.com" type="email"
                className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-9" />
            </div>
          </div>
          <div>
            <Label htmlFor="rut" className="text-[#9C8578] text-xs font-semibold mb-1 block">RUT</Label>
            <Input
              id="rut"
              value={form.rut}
              onChange={(e) => set('rut', e.target.value)}
              placeholder="12.345.678-9"
              className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-9" />
          </div>
          <div>
            <Label htmlFor="notes" className="text-[#9C8578] text-xs font-semibold mb-1 block">Notas</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Referido por Juan, interesado en Providencia..."
              className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-9" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setOpen(false)}
              className="border-[#D5C3B6]/20 text-[#9C8578] flex-1"
              variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80 flex-1">
              {saving ? 'Guardando...' : 'Crear contacto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
