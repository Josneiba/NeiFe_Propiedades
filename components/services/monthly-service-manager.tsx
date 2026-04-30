'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { DocumentUploader } from '@/components/ui/document-uploader'

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
  const { toast } = useToast()
  const now = useMemo(() => new Date(), [])
  const [saving, setSaving] = useState(false)
  const [billUrls, setBillUrls] = useState<Partial<Record<BillType, string>>>({})
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
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.propertyId) {
      toast({
        title: 'Falta una propiedad',
        description: 'Selecciona la propiedad que corresponde a estos servicios.',
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
        electricity: Number(form.electricity) || 0,
        gas: Number(form.gas) || 0,
        garbage: Number(form.garbage) || 0,
        commonExpenses: Number(form.commonExpenses) || 0,
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

      for (const [type, url] of Object.entries(billUrls) as Array<[BillType, string | undefined]>) {
        if (!url) continue

        const fd = new FormData()
        fd.append('file', await fetch(url).then(r => r.blob()))
        fd.append('propertyId', form.propertyId)
        fd.append('month', form.month)
        fd.append('year', form.year)
        fd.append('type', type)

        const uploadRes = await fetch('/api/services/upload', {
          method: 'POST',
          body: fd,
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || `No se pudo subir ${billLabels[type]}`)
        }
      }

      toast({
        title: 'Servicios actualizados',
        description: 'El arrendatario ya puede ver los cargos y boletas de este período.',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudieron actualizar los servicios',
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
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="propertyId">Propiedad</Label>
            <select
              id="propertyId"
              value={form.propertyId}
              onChange={(e) => updateField('propertyId', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            >
              <option value="">Selecciona una propiedad</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name || property.address}
                </option>
              ))}
            </select>
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
              />
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
              />
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
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Observaciones para el arrendatario"
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
