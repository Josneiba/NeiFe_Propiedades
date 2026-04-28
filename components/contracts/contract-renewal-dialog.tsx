'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCw, Loader2 } from 'lucide-react'
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
  propertyName: string
  currentStartDate?: Date | null
  currentEndDate?: Date | null
  currentRentCLP?: number | null
  currentRentUF?: number | null
  hasTenant: boolean
}

function toInputDate(value?: Date | null) {
  if (!value) return ''
  const date = new Date(value)
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10)
}

function addOneYearMinusOneDay(value?: Date | null) {
  if (!value) return ''
  const date = new Date(value)
  date.setFullYear(date.getFullYear() + 1)
  date.setDate(date.getDate() - 1)
  return toInputDate(date)
}

export function ContractRenewalDialog({
  propertyId,
  propertyName,
  currentStartDate,
  currentEndDate,
  currentRentCLP,
  currentRentUF,
  hasTenant,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(
    toInputDate(currentEndDate ? new Date(new Date(currentEndDate).getTime() + 86400000) : currentStartDate)
  )
  const [endDate, setEndDate] = useState(addOneYearMinusOneDay(currentEndDate))
  const [monthlyRentCLP, setMonthlyRentCLP] = useState(
    currentRentCLP != null ? String(currentRentCLP) : ''
  )
  const [monthlyRentUF, setMonthlyRentUF] = useState(
    currentRentUF != null ? String(currentRentUF) : ''
  )

  const preview = useMemo(() => {
    const clp = monthlyRentCLP ? Number(monthlyRentCLP) : null
    const uf = monthlyRentUF ? Number(monthlyRentUF) : null
    return {
      clp: clp != null && Number.isFinite(clp) ? clp : null,
      uf: uf != null && Number.isFinite(uf) ? uf : null,
    }
  }, [monthlyRentCLP, monthlyRentUF])

  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contracts/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          startDate,
          endDate,
          monthlyRentCLP: monthlyRentCLP ? Number(monthlyRentCLP) : null,
          monthlyRentUF: monthlyRentUF ? Number(monthlyRentUF) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo preparar la renovación')
      }

      toast({
        title: 'Renovación preparada',
        description: 'La propiedad quedó actualizada y el nuevo contrato quedó en borrador.',
      })
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo preparar la renovación',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="text-foreground border-border"
          disabled={!hasTenant}
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Renovar contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Renovar contrato</DialogTitle>
          <DialogDescription>
            Prepara un nuevo período para <strong>{propertyName}</strong> sin perder el historial del contrato anterior.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="renew-start">Nuevo inicio</Label>
              <Input
                id="renew-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renew-end">Nuevo término</Label>
              <Input
                id="renew-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="renew-rent-clp">Renta CLP</Label>
              <Input
                id="renew-rent-clp"
                type="number"
                min="0"
                value={monthlyRentCLP}
                onChange={(e) => setMonthlyRentCLP(e.target.value)}
                placeholder="Ej: 550000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renew-rent-uf">Renta UF</Label>
              <Input
                id="renew-rent-uf"
                type="number"
                min="0"
                step="0.01"
                value={monthlyRentUF}
                onChange={(e) => setMonthlyRentUF(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">Qué hará NeiFe al confirmar</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>Actualiza las nuevas fechas del contrato en la propiedad.</li>
              <li>Actualiza la renta vigente para el próximo período.</li>
              <li>Deja listo un nuevo contrato en borrador para subir o reemplazar el PDF.</li>
            </ul>
            {(preview.clp || preview.uf) && (
              <p className="mt-3 text-foreground">
                Nueva renta:{" "}
                {preview.clp ? `$${preview.clp.toLocaleString('es-CL')}` : '—'}
                {preview.uf ? ` · ${preview.uf.toLocaleString('es-CL')} UF` : ''}
              </p>
            )}
          </div>

          {!hasTenant ? (
            <p className="text-sm text-muted-foreground">
              Debes asignar un arrendatario antes de renovar el contrato.
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
            disabled={loading || !startDate || !endDate || (!monthlyRentCLP && !monthlyRentUF)}
            onClick={submit}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4 mr-2" />
            )}
            Preparar renovación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
