'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
  dealId: string
  open: boolean
  onClose: () => void
  onLinked: () => void
}

export function LinkContactModal({ dealId, open, onClose, onLinked }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [role, setRole] = useState('ARRENDATARIO')
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/crm/contacts?q=${encodeURIComponent(q)}`)
      if (res.ok) setResults(await res.json())
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  async function handleLink() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/crm/deals/${dealId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selected.id, role }),
      })
      if (!res.ok) throw new Error()
      toast.success('Contacto vinculado')
      onLinked()
      onClose()
    } catch {
      toast.error('No se pudo vincular el contacto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C2828] border-[#D5C3B6]/15 text-[#FAF6F2] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vincular contacto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-[#9C8578] mb-1.5 block">Buscar por nombre, código o teléfono</Label>
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setSelected(null) }}
              placeholder="Ej: PROP-0041 o Carlos Mendoza"
              className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]"
            />
          </div>
          {searching && <p className="text-xs text-[#9C8578] animate-pulse">Buscando...</p>}
          {results.length > 0 && !selected && (
            <div className="border border-[#D5C3B6]/15 rounded-lg overflow-hidden">
              {results.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#2D3C3C]/80 transition-colors border-b border-[#D5C3B6]/10 last:border-0"
                >
                  <span className="font-mono text-[10px] text-[#B8965A]">{c.code}</span>
                  <span className="text-xs text-[#D5C3B6]">{c.name}</span>
                  <span className="text-[9px] text-[#9C8578] ml-auto">{c.type}</span>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="bg-[#2D3C3C]/60 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-[#B8965A] block">{selected.code}</span>
                <span className="text-xs text-[#FAF6F2]">{selected.name}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#9C8578] hover:text-[#D5C3B6] text-xs">
                Cambiar
              </button>
            </div>
          )}
          <div>
            <Label className="text-xs text-[#9C8578] mb-1.5 block">Rol en este deal</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/20">
                <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                <SelectItem value="ARRENDATARIO">Arrendatario</SelectItem>
                <SelectItem value="AVAL">Aval</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-[#D5C3B6]/20 text-[#9C8578]">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleLink} disabled={!selected || saving} className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80">
              {saving ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
