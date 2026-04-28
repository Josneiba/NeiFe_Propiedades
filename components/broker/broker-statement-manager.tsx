'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Download, FileText, Loader2, Plus, Send, Trash2 } from 'lucide-react'

type PropertyOption = {
  id: string
  label: string
  landlordName: string
  monthlyRentCLP: number | null
  commissionRate: number | null
  commissionType: 'MONTHLY' | 'ONE_TIME' | 'ANNUAL' | null
}

type StatementItem = {
  id: string
  label: string
  amountCLP: number
  type: 'COMMISSION' | 'MAINTENANCE' | 'DEDUCTION'
  notes?: string | null
}

type StatementRecord = {
  id: string
  propertyId: string
  month: number
  year: number
  grossIncomeCLP: number
  brokerCommissionCLP: number
  maintenanceCLP: number
  otherDeductionsCLP: number
  netTransferCLP: number
  status: 'DRAFT' | 'SENT'
  transferReference?: string | null
  property: { name: string | null; address: string; commune: string }
  landlord: { name: string | null; email: string }
  items: StatementItem[]
}

type Props = {
  properties: PropertyOption[]
  initialStatements: StatementRecord[]
}

export function BrokerStatementManager({ properties, initialStatements }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [statements, setStatements] = useState(initialStatements)
  const [form, setForm] = useState({
    propertyId: properties[0]?.id ?? '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    grossIncomeCLP: properties[0]?.monthlyRentCLP ?? 0,
    brokerCommissionCLP:
      properties[0]?.commissionRate != null &&
      properties[0]?.commissionType === 'MONTHLY' &&
      properties[0]?.monthlyRentCLP
        ? Math.round((properties[0].monthlyRentCLP * properties[0].commissionRate) / 100)
        : 0,
    maintenanceCLP: 0,
    otherDeductionsCLP: 0,
    notes: '',
    transferReference: '',
    transferDate: '',
    sendToLandlord: false,
  })
  const [items, setItems] = useState<Array<{ id: string; label: string; amountCLP: number; type: 'MAINTENANCE' | 'DEDUCTION' }>>([])

  const selectedProperty = properties.find((property) => property.id === form.propertyId) ?? null

  if (properties.length === 0) {
    return (
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-8 text-center">
          <p className="text-lg font-medium text-[#FAF6F2]">Todavía no tienes propiedades activas para rendir.</p>
          <p className="mt-2 text-sm text-[#9C8578]">
            Cuando tengas una propiedad administrada desde tu mandato, aquí podrás crear la rendición mensual y abrir su PDF.
          </p>
        </CardContent>
      </Card>
    )
  }

  const computedTotals = useMemo(() => {
    const maintenanceExtra = items
      .filter((item) => item.type === 'MAINTENANCE')
      .reduce((sum, item) => sum + (item.amountCLP || 0), 0)
    const deductionExtra = items
      .filter((item) => item.type === 'DEDUCTION')
      .reduce((sum, item) => sum + (item.amountCLP || 0), 0)

    const maintenance = Math.max(form.maintenanceCLP, maintenanceExtra)
    const deductions = Math.max(form.otherDeductionsCLP, deductionExtra)
    const net =
      Number(form.grossIncomeCLP || 0) -
      Number(form.brokerCommissionCLP || 0) -
      maintenance -
      deductions

    return { maintenance, deductions, net }
  }, [form, items])

  const resetForProperty = (propertyId: string) => {
    const property = properties.find((entry) => entry.id === propertyId)
    setForm((current) => ({
      ...current,
      propertyId,
      grossIncomeCLP: property?.monthlyRentCLP ?? 0,
      brokerCommissionCLP:
        property?.commissionRate != null &&
        property.commissionType === 'MONTHLY' &&
        property.monthlyRentCLP
          ? Math.round((property.monthlyRentCLP * property.commissionRate) / 100)
          : 0,
    }))
  }

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: '',
        amountCLP: 0,
        type: 'DEDUCTION',
      },
    ])
  }

  const saveStatement = async (sendToLandlord: boolean) => {
    setSaving(true)
    try {
      const res = await fetch('/api/broker/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items,
          sendToLandlord,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'No se pudo guardar',
          description: data.error || 'Error al guardar la rendicion',
          variant: 'destructive',
        })
        return
      }

      setStatements((current) => {
        const filtered = current.filter(
          (statement) =>
            !(
              statement.propertyId === data.statement.propertyId &&
              statement.month === data.statement.month &&
              statement.year === data.statement.year
            )
        )
        return [data.statement, ...filtered]
      })

      toast({
        title: sendToLandlord ? 'Rendicion enviada' : 'Rendicion guardada',
        description: sendToLandlord
          ? 'El propietario ya puede verla y descargarla en PDF.'
          : 'Quedo como borrador para que la revises antes de enviarla.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la rendicion',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#B8965A]" />
            Nueva rendición mensual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#D5C3B6]">Propiedad</Label>
              <select
                value={form.propertyId}
                onChange={(e) => resetForProperty(e.target.value)}
                className="w-full rounded-md border border-[#D5C3B6]/10 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.label}
                  </option>
                ))}
              </select>
              {selectedProperty ? (
                <div className="space-y-1">
                  <p className="text-xs text-[#9C8578]">
                    Propietario: {selectedProperty.landlordName}
                  </p>
                  <p className="text-xs text-[#9C8578]">
                    Comisión mandatada:{' '}
                    {selectedProperty.commissionRate != null
                      ? `${selectedProperty.commissionRate}% (${selectedProperty.commissionType === 'MONTHLY'
                          ? 'mensual'
                          : selectedProperty.commissionType === 'ONE_TIME'
                            ? 'única vez'
                            : 'anual'})`
                      : 'No configurada en el mandato'}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#D5C3B6]">Mes</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={form.month}
                  onChange={(e) => setForm((current) => ({ ...current, month: Number(e.target.value) }))}
                  className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#D5C3B6]">Año</Label>
                <Input
                  type="number"
                  min={2024}
                  max={2035}
                  value={form.year}
                  onChange={(e) => setForm((current) => ({ ...current, year: Number(e.target.value) }))}
                  className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FieldMoney label="Arriendo cobrado" value={form.grossIncomeCLP} onChange={(value) => setForm((current) => ({ ...current, grossIncomeCLP: value }))} />
            <FieldMoney label="Comisión corredor" value={form.brokerCommissionCLP} onChange={(value) => setForm((current) => ({ ...current, brokerCommissionCLP: value }))} />
            <FieldMoney label="Mantenciones" value={form.maintenanceCLP} onChange={(value) => setForm((current) => ({ ...current, maintenanceCLP: value }))} />
            <FieldMoney label="Otros descuentos" value={form.otherDeductionsCLP} onChange={(value) => setForm((current) => ({ ...current, otherDeductionsCLP: value }))} />
          </div>

          <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#FAF6F2]">Detalle de descuentos</p>
              <Button type="button" variant="outline" className="border-[#D5C3B6]/10 text-[#FAF6F2]" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar item
              </Button>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-[#9C8578]">
                Agrega aquí mantenciones o descuentos específicos para que queden detallados en la rendición.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="grid md:grid-cols-[1fr_160px_140px_44px] gap-3 items-end">
                  <div className="space-y-2">
                    <Label className="text-[#D5C3B6]">Concepto</Label>
                    <Input
                      value={item.label}
                      onChange={(e) =>
                        setItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, label: e.target.value } : entry
                          )
                        )
                      }
                      className="bg-[#2D3C3C] border-[#D5C3B6]/10 text-[#FAF6F2]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#D5C3B6]">Monto</Label>
                    <Input
                      type="number"
                      value={item.amountCLP}
                      onChange={(e) =>
                        setItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, amountCLP: Number(e.target.value) } : entry
                          )
                        )
                      }
                      className="bg-[#2D3C3C] border-[#D5C3B6]/10 text-[#FAF6F2]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#D5C3B6]">Tipo</Label>
                    <select
                      value={item.type}
                      onChange={(e) =>
                        setItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, type: e.target.value as 'MAINTENANCE' | 'DEDUCTION' }
                              : entry
                          )
                        )
                      }
                      className="w-full rounded-md border border-[#D5C3B6]/10 bg-[#2D3C3C] px-3 py-2 text-[#FAF6F2]"
                    >
                      <option value="MAINTENANCE">Mantención</option>
                      <option value="DEDUCTION">Descuento</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#C27F79]/20 text-[#C27F79]"
                    onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#D5C3B6]">Referencia transferencia</Label>
              <Input
                value={form.transferReference}
                onChange={(e) => setForm((current) => ({ ...current, transferReference: e.target.value }))}
                className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#D5C3B6]">Fecha transferencia</Label>
              <Input
                type="date"
                value={form.transferDate}
                onChange={(e) => setForm((current) => ({ ...current, transferDate: e.target.value }))}
                className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#D5C3B6]">Notas para el propietario</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
              rows={4}
              className="w-full rounded-md border border-[#D5C3B6]/10 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
            />
          </div>

          <div className="rounded-xl bg-[#1C1917] p-4 border border-[#5E8B8C]/20">
            <p className="text-xs uppercase tracking-wider text-[#9C8578] mb-2">Monto neto a transferir</p>
            <p className={`text-3xl font-semibold ${computedTotals.net >= 0 ? 'text-[#FAF6F2]' : 'text-[#C27F79]'}`}>
              ${computedTotals.net.toLocaleString('es-CL')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => saveStatement(false)}
              disabled={saving || !form.propertyId}
              className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Guardar borrador
            </Button>
            <Button
              type="button"
              onClick={() => saveStatement(true)}
              disabled={saving || !form.propertyId}
              className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar al propietario
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">Rendiciones recientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statements.length === 0 ? (
            <p className="text-sm text-[#9C8578]">Todavía no has generado rendiciones.</p>
          ) : (
            statements.slice(0, 8).map((statement) => (
              <div key={statement.id} className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#FAF6F2]">
                      {statement.property.name || statement.property.address}
                    </p>
                    <p className="text-xs text-[#9C8578]">
                      {statement.month}/{statement.year} · {statement.landlord.name || statement.landlord.email}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    statement.status === 'SENT'
                      ? 'bg-[#5E8B8C]/20 text-[#5E8B8C]'
                      : 'bg-[#B8965A]/20 text-[#D5C3B6]'
                  }`}>
                    {statement.status === 'SENT' ? 'Enviada' : 'Borrador'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[#9C8578]">Neto</span>
                  <span className="font-semibold text-[#FAF6F2]">
                    ${statement.netTransferCLP.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/api/broker/statements/${statement.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-[#D5C3B6]/10 px-3 py-2 text-sm text-[#FAF6F2] hover:bg-[#2D3C3C]"
                  >
                    <Download className="h-4 w-4" />
                    Abrir PDF
                  </a>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FieldMoney({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[#D5C3B6]">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
      />
    </div>
  )
}
