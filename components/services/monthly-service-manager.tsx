'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { DocumentUploader } from '@/components/ui/document-uploader'
import { cn } from '@/lib/utils'

type PropertyOption = {
  id: string
  name: string | null
  address: string
}

type Props = {
  properties: PropertyOption[]
  defaultPropertyId?: string | null
  title?: string
  description?: string
}

type BillType = 'water' | 'electricity' | 'gas' | 'garbage' | 'commonExpenses'

const billLabels: Record<BillType, string> = {
  water: 'Boleta agua',
  electricity: 'Boleta luz',
  gas: 'Boleta gas',
  garbage: 'Boleta basura',
  commonExpenses: 'Boleta gasto común',
}

export function MonthlyServiceManager({
  properties,
  defaultPropertyId,
  title = 'Registrar servicios del mes',
  description = 'Carga montos y boletas para que el arrendatario vea el detalle completo.',
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const now = useMemo(() => new Date(), [])
  const [saving, setSaving] = useState(false)
  const [billUrls, setBillUrls] = useState<Partial<Record<BillType, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form | 'amounts', string>>>({})
  const [form, setForm] = useState({
    propertyId: defaultPropertyId ?? properties[0]?.id ?? '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    water: '0',
    electricity: '0',
    gas: '0',
    garbage: '0',
    commonExpenses: '0',
    other: '0',
    otherLabel: '',
    notes: '',
  })

  const updateField = (field: keyof typeof form, value: string) => {
    setSubmitError(null)
    setSubmitSuccess(null)
    setFieldErrors((current) => ({ ...current, [field]: undefined, amounts: undefined }))
    setForm((current) => ({ ...current, [field]: value }))
  }

  const numericFields: Array<keyof typeof form> = [
    'water',
    'electricity',
    'gas',
    'garbage',
    'commonExpenses',
    'other',
  ]

  const billCount = Object.values(billUrls).filter(Boolean).length
  const totalAmount = numericFields.reduce((sum, field) => sum + (Number(form[field]) || 0), 0)

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof typeof form | 'amounts', string>> = {}
    const month = Number(form.month)
    const year = Number(form.year)

    if (!form.propertyId) {
      nextErrors.propertyId = 'Selecciona la propiedad que corresponde a este período.'
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      nextErrors.month = 'Ingresa un mes válido entre 1 y 12.'
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      nextErrors.year = 'Ingresa un año válido.'
    }

    if (totalAmount <= 0) {
      nextErrors.amounts = 'Debes ingresar al menos un cargo mayor a 0 para guardar el registro.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!validateForm()) {
      toast({
        title: 'Revisa el formulario',
        description: 'Hay campos pendientes o inválidos antes de guardar.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        propertyId: form.propertyId,
        month: Number(form.month),
        year: Number(form.year),
        water: Number(form.water) || 0,
        waterBillUrl: billUrls.water,
        electricity: Number(form.electricity) || 0,
        lightBillUrl: billUrls.electricity,
        gas: Number(form.gas) || 0,
        gasBillUrl: billUrls.gas,
        garbage: Number(form.garbage) || 0,
        garbageBillUrl: billUrls.garbage,
        commonExpenses: Number(form.commonExpenses) || 0,
        commonBillUrl: billUrls.commonExpenses,
        other: Number(form.other) || 0,
        otherLabel: form.otherLabel || undefined,
        notes: form.notes || undefined,
      }

      const createRes = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const createData = await createRes.json()
      if (!createRes.ok) {
        throw new Error(createData.error || 'No se pudo guardar el registro de servicios')
      }

      toast({
        title: 'Servicios actualizados',
        description: 'El arrendatario ya puede ver los cargos y boletas de este período.',
      })
      setSubmitSuccess('Registro guardado correctamente. Te llevaremos al período recién actualizado.')
      const savedKey = `${form.propertyId}-${Number(form.year)}-${Number(form.month)}`
      router.push(`${pathname}?property=${form.propertyId}&month=${Number(form.month)}&year=${Number(form.year)}&saved=${savedKey}&flash=updated#service-records`)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron actualizar los servicios'
      setSubmitError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {submitSuccess ? (
          <Alert className="border-[#5E8B8C]/30 bg-[#5E8B8C]/10 text-[#D5C3B6]">
            <CheckCircle2 className="text-[#5E8B8C]" />
            <AlertTitle className="text-[#FAF6F2]">Registro guardado</AlertTitle>
            <AlertDescription className="text-[#9C8578]">{submitSuccess}</AlertDescription>
          </Alert>
        ) : null}

        {submitError ? (
          <Alert className="border-[#C27F79]/30 bg-[#C27F79]/10 text-[#D5C3B6]" variant="destructive">
            <AlertCircle />
            <AlertTitle className="text-[#FAF6F2]">No se pudo guardar</AlertTitle>
            <AlertDescription className="text-[#D5C3B6]">{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">Vista previa del período</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-[#9C8578]">Período</p>
                <p className="mt-1 text-sm font-semibold text-[#FAF6F2]">
                  {form.month.padStart(2, '0')}/{form.year}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9C8578]">Total informado</p>
                <p className="mt-1 text-sm font-semibold text-[#FAF6F2]">
                  ${totalAmount.toLocaleString('es-CL')}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9C8578]">Boletas adjuntas</p>
                <p className="mt-1 text-sm font-semibold text-[#FAF6F2]">{billCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/45 p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">Qué verá el arrendatario</p>
            <p className="mt-3 text-sm text-[#9C8578]">
              Un resumen por período con cargos, boletas y notas. Si subes documentos, quedarán visibles directamente en el registro final.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="propertyId">Propiedad</Label>
            <select
              id="propertyId"
              value={form.propertyId}
              onChange={(e) => updateField('propertyId', e.target.value)}
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2 text-foreground",
                fieldErrors.propertyId && "border-[#C27F79] focus:border-[#C27F79]"
              )}
            >
              <option value="">Selecciona una propiedad</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name || property.address}
                </option>
              ))}
            </select>
            {fieldErrors.propertyId ? (
              <p className="text-xs text-[#C27F79]">{fieldErrors.propertyId}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mes</Label>
              <Input
                id="month"
                type="number"
                min="1"
                max="12"
                value={form.month}
                onChange={(e) => updateField('month', e.target.value)}
                className={cn(fieldErrors.month && "border-[#C27F79] focus-visible:ring-[#C27F79]")}
              />
              {fieldErrors.month ? <p className="text-xs text-[#C27F79]">{fieldErrors.month}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                min="2024"
                max="2100"
                value={form.year}
                onChange={(e) => updateField('year', e.target.value)}
                className={cn(fieldErrors.year && "border-[#C27F79] focus-visible:ring-[#C27F79]")}
              />
              {fieldErrors.year ? <p className="text-xs text-[#C27F79]">{fieldErrors.year}</p> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['water', 'Agua'],
            ['electricity', 'Luz'],
            ['gas', 'Gas'],
            ['commonExpenses', 'Gasto común'],
            ['garbage', 'Basura'],
            ['other', form.otherLabel || 'Otro cargo'],
          ].map(([field, label]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{label}</Label>
              <Input
                id={field}
                type="number"
                min="0"
                value={form[field as keyof typeof form]}
                onChange={(e) => updateField(field as keyof typeof form, e.target.value)}
              />
            </div>
          ))}
        </div>
        {fieldErrors.amounts ? (
          <p className="text-sm text-[#C27F79]">{fieldErrors.amounts}</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="otherLabel">Nombre del otro cargo</Label>
            <Input
              id="otherLabel"
              value={form.otherLabel}
              onChange={(e) => updateField('otherLabel', e.target.value)}
              placeholder="Ej: Internet, aseo municipal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas del período</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Observaciones para el arrendatario"
              className="min-h-[96px]"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(billLabels) as BillType[]).map((type) => (
            <DocumentUploader
              key={type}
              label={billLabels[type]}
              description={`Adjunta la boleta de ${billLabels[type].replace('Boleta ', '').toLowerCase()}`}
              currentUrl={billUrls[type]}
              folder="boletas"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onUpload={(url) => {
                setBillUrls((prev) => ({ ...prev, [type]: url }))
              }}
            />
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar servicios del mes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
