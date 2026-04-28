'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Deposit = {
  amountCLP: number
  receivedAt: string
  receivedBy: string
  status: 'HELD' | 'RETURNED_FULL' | 'RETURNED_PARTIAL' | 'FORFEITED'
  returnedAt?: string | null
  returnedAmountCLP?: number | null
  deductionsCLP?: number | null
  deductionNotes?: string | null
}

export function SecurityDepositPanel({ propertyId }: { propertyId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    amountCLP: '',
    receivedAt: '',
    receivedBy: '',
    status: 'HELD',
    returnedAt: '',
    returnedAmountCLP: '',
    deductionsCLP: '',
    deductionNotes: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/security-deposit`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar la garantía')
        const deposit: Deposit | null = data.deposit
        if (deposit) {
          setForm({
            amountCLP: String(deposit.amountCLP ?? ''),
            receivedAt: deposit.receivedAt ? deposit.receivedAt.slice(0, 10) : '',
            receivedBy: deposit.receivedBy ?? '',
            status: deposit.status ?? 'HELD',
            returnedAt: deposit.returnedAt ? deposit.returnedAt.slice(0, 10) : '',
            returnedAmountCLP: deposit.returnedAmountCLP ? String(deposit.returnedAmountCLP) : '',
            deductionsCLP: deposit.deductionsCLP ? String(deposit.deductionsCLP) : '',
            deductionNotes: deposit.deductionNotes ?? '',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo cargar la garantía',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [propertyId, toast])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}/security-deposit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCLP: Number(form.amountCLP),
          receivedAt: form.receivedAt,
          receivedBy: form.receivedBy,
          status: form.status,
          returnedAt: form.returnedAt || null,
          returnedAmountCLP: form.returnedAmountCLP ? Number(form.returnedAmountCLP) : null,
          deductionsCLP: form.deductionsCLP ? Number(form.deductionsCLP) : null,
          deductionNotes: form.deductionNotes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la garantía')
      toast({ title: 'Garantía guardada' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar la garantía',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Cargando garantía...</div>
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-lg font-semibold text-foreground">Mes de garantía</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Registra recepción, custodia y devolución del mes de garantía.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Monto CLP">
          <Input value={form.amountCLP} onChange={(e) => setForm((c) => ({ ...c, amountCLP: e.target.value }))} />
        </Field>
        <Field label="Recibido el">
          <Input type="date" value={form.receivedAt} onChange={(e) => setForm((c) => ({ ...c, receivedAt: e.target.value }))} />
        </Field>
        <Field label="Recibido por">
          <Input value={form.receivedBy} onChange={(e) => setForm((c) => ({ ...c, receivedBy: e.target.value }))} />
        </Field>
        <Field label="Estado">
          <select
            value={form.status}
            onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
          >
            <option value="HELD">En custodia</option>
            <option value="RETURNED_FULL">Devuelta completa</option>
            <option value="RETURNED_PARTIAL">Devuelta parcial</option>
            <option value="FORFEITED">Retenida</option>
          </select>
        </Field>
        <Field label="Devuelta el">
          <Input type="date" value={form.returnedAt} onChange={(e) => setForm((c) => ({ ...c, returnedAt: e.target.value }))} />
        </Field>
        <Field label="Monto devuelto">
          <Input value={form.returnedAmountCLP} onChange={(e) => setForm((c) => ({ ...c, returnedAmountCLP: e.target.value }))} />
        </Field>
        <Field label="Descuentos CLP">
          <Input value={form.deductionsCLP} onChange={(e) => setForm((c) => ({ ...c, deductionsCLP: e.target.value }))} />
        </Field>
        <Field label="Notas de descuento">
          <Input value={form.deductionNotes} onChange={(e) => setForm((c) => ({ ...c, deductionNotes: e.target.value }))} />
        </Field>
      </div>

      <Button onClick={save} disabled={saving} className="mt-5 bg-[#75524C] text-[#FAF6F2] hover:bg-[#75524C]/90">
        {saving ? 'Guardando...' : 'Guardar garantía'}
      </Button>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
