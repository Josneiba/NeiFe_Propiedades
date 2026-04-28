'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props {
  propertyId: string
  currentRentCLP: number
  onSuccess: (newRent: number) => void
}

export function IpcAdjustmentDialog({ propertyId, currentRentCLP, onSuccess }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [ipcRate, setIpcRate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<number | null>(null)

  const handleRateChange = (value: string) => {
    setIpcRate(value)
    const rate = parseFloat(value)
    if (!Number.isNaN(rate) && rate > 0) {
      setPreview(Math.round(currentRentCLP * (1 + rate / 100)))
    } else {
      setPreview(null)
    }
  }

  const handleApply = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}/ipc-adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipcRate: parseFloat(ipcRate), notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo aplicar el reajuste')

      onSuccess(data.newCLP)
      toast({
        title: 'Reajuste aplicado',
        description: `Nueva renta: $${data.newCLP.toLocaleString('es-CL')}`,
      })
      setOpen(false)
      setIpcRate('')
      setNotes('')
      setPreview(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo aplicar el reajuste',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/5"
      >
        <TrendingUp className="mr-2 h-4 w-4" />
        Aplicar IPC
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-[#D5C3B6]/15 bg-[#2D3C3C] text-[#FAF6F2]">
          <DialogHeader>
            <DialogTitle>Reajuste por IPC</DialogTitle>
            <DialogDescription className="text-[#9C8578]">
              Ajusta la renta según el Índice de Precios al Consumidor.
            </DialogDescription>
          </DialogHeader>

          <a
            href="https://www.ine.gob.cl/estadisticas/precios/indice-de-precios-al-consumidor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-[#5E8B8C] hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Ver IPC actual en el INE
          </a>

          <div className="mt-2 space-y-4">
            <div>
              <Label className="text-sm text-[#D5C3B6]">Tasa IPC a aplicar (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={ipcRate}
                onChange={(e) => handleRateChange(e.target.value)}
                placeholder="Ej: 4.5"
                className="mt-1.5"
              />
            </div>

            {preview != null ? (
              <div className="rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917]/60 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9C8578]">Renta actual</span>
                  <span className="text-[#FAF6F2]">${currentRentCLP.toLocaleString('es-CL')}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-[#9C8578]">Nueva renta</span>
                  <span className="font-semibold text-[#5E8B8C]">${preview.toLocaleString('es-CL')}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-[#9C8578]">Diferencia mensual</span>
                  <span className="text-[#B8965A]">+${(preview - currentRentCLP).toLocaleString('es-CL')}</span>
                </div>
              </div>
            ) : null}

            <div>
              <Label className="text-sm text-[#D5C3B6]">Notas</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Reajuste anual según contrato"
                className="mt-1.5"
              />
            </div>

            <Button
              onClick={handleApply}
              disabled={!ipcRate || loading || preview == null}
              className="w-full bg-[#75524C] text-[#FAF6F2] hover:bg-[#75524C]/90"
            >
              {loading ? 'Aplicando...' : `Aplicar reajuste → $${preview?.toLocaleString('es-CL')}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
