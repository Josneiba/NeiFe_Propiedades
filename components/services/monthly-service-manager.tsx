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
import {
  AlertCircle,
  CheckCircle2,
  Droplets,
  FilePlus2,
  Flame,
  Loader2,
  Plus,
  ReceiptText,
  Trash2,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
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

type BaseServiceKey = 'water' | 'electricity' | 'gas' | 'garbage' | 'commonExpenses'
type ServiceField = BaseServiceKey | 'custom'

type CustomCharge = {
  id: string
  label: string
  amount: string
  billUrl?: string
}

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const serviceCatalog: Array<{
  key: BaseServiceKey
  label: string
  help: string
  icon: typeof Droplets
  accent: string
  field: string
}> = [
  {
    key: 'water',
    label: 'Agua',
    help: 'Cuenta de agua potable',
    icon: Droplets,
    accent: 'text-sky-400',
    field: 'water',
  },
  {
    key: 'electricity',
    label: 'Electricidad',
    help: 'Boleta de luz',
    icon: Zap,
    accent: 'text-amber-400',
    field: 'electricity',
  },
  {
    key: 'gas',
    label: 'Gas',
    help: 'Cuenta de gas',
    icon: Flame,
    accent: 'text-orange-400',
    field: 'gas',
  },
  {
    key: 'garbage',
    label: 'Basura',
    help: 'Derecho de aseo o retiro',
    icon: Trash2,
    accent: 'text-[#B8965A]',
    field: 'garbage',
  },
  {
    key: 'commonExpenses',
    label: 'Gasto común',
    help: 'Gastos compartidos del edificio o condominio',
    icon: ReceiptText,
    accent: 'text-[#D5C3B6]',
    field: 'commonExpenses',
  },
]

function formatCLP(amount: number) {
  return `$${amount.toLocaleString('es-CL')}`
}

function createCustomCharge() {
  return {
    id: crypto.randomUUID(),
    label: '',
    amount: '',
    billUrl: undefined,
  }
}

export function MonthlyServiceManager({
  properties,
  defaultPropertyId,
  title = 'Registrar servicios del mes',
  description = 'Activa solo los cobros que correspondan a esta propiedad y período.',
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const now = useMemo(() => new Date(), [])
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'propertyId' | 'month' | 'year' | 'services' | 'custom', string>>
  >({})
  const [form, setForm] = useState({
    propertyId: defaultPropertyId ?? properties[0]?.id ?? '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    water: '',
    electricity: '',
    gas: '',
    garbage: '',
    commonExpenses: '',
    notes: '',
  })
  const [billUrls, setBillUrls] = useState<Partial<Record<BaseServiceKey, string>>>({})
  const [activeServices, setActiveServices] = useState<ServiceField[]>(['water', 'electricity'])
  const [customCharges, setCustomCharges] = useState<CustomCharge[]>([])

  const activeBaseServices = activeServices.filter((service): service is BaseServiceKey => service !== 'custom')
  const availableServices = serviceCatalog.filter((service) => !activeBaseServices.includes(service.key))
  const hasCustomSection = activeServices.includes('custom')

  const customTotal = customCharges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const serviceTotal = activeBaseServices.reduce(
    (sum, key) => sum + (Number(form[key]) || 0),
    0,
  )
  const totalAmount = serviceTotal + customTotal
  const attachedBills =
    Object.values(billUrls).filter(Boolean).length +
    customCharges.filter((item) => item.billUrl).length

  const activeServiceLabels = [
    ...activeBaseServices.map((key) => serviceCatalog.find((service) => service.key === key)?.label || key),
    ...(hasCustomSection && customCharges.length > 0 ? customCharges.map((item) => item.label || 'Cargo personalizado') : []),
  ]

  const updateField = (field: keyof typeof form, value: string) => {
    setSubmitError(null)
    setSubmitSuccess(null)
    setFieldErrors((current) => ({ ...current, [field]: undefined, services: undefined }))
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addService = (service: ServiceField) => {
    if (service === 'custom') {
      setActiveServices((current) => (current.includes('custom') ? current : [...current, 'custom']))
      if (customCharges.length === 0) {
        setCustomCharges([createCustomCharge()])
      }
      return
    }

    setActiveServices((current) => (current.includes(service) ? current : [...current, service]))
  }

  const removeService = (service: ServiceField) => {
    setActiveServices((current) => current.filter((item) => item !== service))
    if (service === 'custom') {
      setCustomCharges([])
      return
    }

    setForm((current) => ({ ...current, [service]: '' }))
    setBillUrls((current) => ({ ...current, [service]: undefined }))
  }

  const updateCustomCharge = (id: string, patch: Partial<CustomCharge>) => {
    setSubmitError(null)
    setSubmitSuccess(null)
    setFieldErrors((current) => ({ ...current, custom: undefined, services: undefined }))
    setCustomCharges((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const addCustomCharge = () => {
    if (!hasCustomSection) {
      setActiveServices((current) => [...current, 'custom'])
    }
    setCustomCharges((current) => [...current, createCustomCharge()])
  }

  const removeCustomCharge = (id: string) => {
    setCustomCharges((current) => {
      const next = current.filter((item) => item.id !== id)
      if (next.length === 0) {
        setActiveServices((services) => services.filter((service) => service !== 'custom'))
      }
      return next
    })
  }

  const validateForm = () => {
    const nextErrors: Partial<Record<'propertyId' | 'month' | 'year' | 'services' | 'custom', string>> = {}
    const month = Number(form.month)
    const year = Number(form.year)
    const validCustomCharges = customCharges.filter(
      (item) => item.label.trim() && (Number(item.amount) || 0) > 0,
    )

    if (!form.propertyId) {
      nextErrors.propertyId = 'Selecciona la propiedad donde se aplicará este cobro.'
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      nextErrors.month = 'Selecciona un mes válido.'
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      nextErrors.year = 'Ingresa un año válido.'
    }

    if (activeServices.length === 0) {
      nextErrors.services = 'Debes activar al menos un servicio o cargo para continuar.'
    }

    if (totalAmount <= 0) {
      nextErrors.services = 'Ingresa al menos un monto mayor a 0.'
    }

    if (
      hasCustomSection &&
      customCharges.some((item) => item.label.trim() || item.amount.trim()) &&
      validCustomCharges.length === 0
    ) {
      nextErrors.custom = 'Cada cargo personalizado debe tener nombre y monto mayor a 0.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!validateForm()) {
      toast({
        title: 'Revisa el registro',
        description: 'Aún faltan datos antes de guardar los servicios del período.',
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
        water: activeBaseServices.includes('water') ? Number(form.water) || 0 : 0,
        waterBillUrl: billUrls.water,
        electricity: activeBaseServices.includes('electricity') ? Number(form.electricity) || 0 : 0,
        lightBillUrl: billUrls.electricity,
        gas: activeBaseServices.includes('gas') ? Number(form.gas) || 0 : 0,
        gasBillUrl: billUrls.gas,
        garbage: activeBaseServices.includes('garbage') ? Number(form.garbage) || 0 : 0,
        garbageBillUrl: billUrls.garbage,
        commonExpenses: activeBaseServices.includes('commonExpenses')
          ? Number(form.commonExpenses) || 0
          : 0,
        commonBillUrl: billUrls.commonExpenses,
        extraItems: customCharges
          .filter((item) => item.label.trim() && (Number(item.amount) || 0) > 0)
          .map((item) => ({
            label: item.label.trim(),
            amount: Number(item.amount) || 0,
            billUrl: item.billUrl,
          })),
        other: 0,
        otherLabel: undefined,
        notes: form.notes.trim() || undefined,
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

      const savedKey = `${form.propertyId}-${Number(form.year)}-${Number(form.month)}`
      toast({
        title: 'Servicios guardados',
        description: 'El período quedó actualizado y visible para el arrendatario.',
      })
      setSubmitSuccess('Registro guardado correctamente. Actualizaremos el historial para mostrar este período.')
      router.push(
        `${pathname}?property=${form.propertyId}&month=${Number(form.month)}&year=${Number(form.year)}&saved=${savedKey}#service-records`,
      )
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
    <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-[#FAF6F2]">{title}</CardTitle>
            <p className="mt-1 text-sm text-[#9C8578]">{description}</p>
          </div>
          <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/45 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">Resumen del período</p>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[#9C8578]">Total</p>
                <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCLP(totalAmount)}</p>
              </div>
              <div>
                <p className="text-[#9C8578]">Cobros</p>
                <p className="mt-1 font-semibold text-[#FAF6F2]">{activeBaseServices.length + customCharges.length}</p>
              </div>
              <div>
                <p className="text-[#9C8578]">Boletas</p>
                <p className="mt-1 font-semibold text-[#FAF6F2]">{attachedBills}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">1. Contexto del cobro</p>
            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.6fr))]">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Propiedad</Label>
                <select
                  id="propertyId"
                  value={form.propertyId}
                  onChange={(e) => updateField('propertyId', e.target.value)}
                  className={cn(
                    'w-full rounded-md border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]',
                    fieldErrors.propertyId && 'border-[#C27F79]',
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

              <div className="space-y-2">
                <Label htmlFor="month">Mes</Label>
                <select
                  id="month"
                  value={form.month}
                  onChange={(e) => updateField('month', e.target.value)}
                  className={cn(
                    'w-full rounded-md border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]',
                    fieldErrors.month && 'border-[#C27F79]',
                  )}
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
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
                  className={cn(
                    'border-[#D5C3B6]/20 bg-[#1C1917] text-[#FAF6F2]',
                    fieldErrors.year && 'border-[#C27F79] focus-visible:ring-[#C27F79]',
                  )}
                />
                {fieldErrors.year ? <p className="text-xs text-[#C27F79]">{fieldErrors.year}</p> : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/45 p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">2. Qué verá el arrendatario</p>
            <p className="mt-3 text-sm text-[#9C8578]">
              Verá solo los servicios cargados para este mes, con su monto, boleta e indicaciones extra si las agregas.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeServiceLabels.length > 0 ? (
                activeServiceLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[#5E8B8C]/20 bg-[#5E8B8C]/10 px-3 py-1 text-xs font-medium text-[#D5C3B6]"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#9C8578]">Aún no has seleccionado cobros.</span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">3. Agrega solo los servicios que aplican</p>
              <p className="mt-1 text-sm text-[#9C8578]">
                No cargues campos que esta propiedad no usa. Puedes añadirlos o quitarlos libremente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableServices.map((service) => (
                <Button
                  key={service.key}
                  type="button"
                  variant="outline"
                  className="border-[#D5C3B6]/15 bg-transparent text-[#D5C3B6] hover:bg-[#D5C3B6]/10 hover:text-[#FAF6F2]"
                  onClick={() => addService(service.key)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {service.label}
                </Button>
              ))}
              {!hasCustomSection ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#B8965A]/20 bg-transparent text-[#B8965A] hover:bg-[#B8965A]/10"
                  onClick={() => addService('custom')}
                >
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  Cargo personalizado
                </Button>
              ) : null}
            </div>
          </div>
          {fieldErrors.services ? (
            <p className="mt-3 text-sm text-[#C27F79]">{fieldErrors.services}</p>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {activeBaseServices.map((serviceKey) => {
            const service = serviceCatalog.find((item) => item.key === serviceKey)
            if (!service) return null

            const Icon = service.icon
            return (
              <div
                key={service.key}
                className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/45 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D3C3C]">
                      <Icon className={cn('h-4 w-4', service.accent)} />
                    </div>
                    <div>
                      <p className="font-medium text-[#FAF6F2]">{service.label}</p>
                      <p className="text-xs text-[#9C8578]">{service.help}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeService(service.key)}
                    className="rounded-lg p-2 text-[#9C8578] transition-colors hover:bg-[#D5C3B6]/10 hover:text-[#C27F79]"
                    title={`Quitar ${service.label.toLowerCase()}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                  <div className="space-y-2">
                    <Label htmlFor={service.field}>Monto</Label>
                    <Input
                      id={service.field}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form[service.key]}
                      onChange={(e) => updateField(service.key, e.target.value)}
                      className="border-[#D5C3B6]/20 bg-[#2D3C3C]/40 text-[#FAF6F2]"
                    />
                  </div>

                  <DocumentUploader
                    label={`Boleta de ${service.label.toLowerCase()}`}
                    description="Adjunta PDF o imagen si la tienes"
                    currentUrl={billUrls[service.key]}
                    folder="boletas"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onUpload={(url) => {
                      setBillUrls((current) => ({ ...current, [service.key]: url }))
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {hasCustomSection ? (
          <div className="rounded-2xl border border-[#B8965A]/15 bg-[#B8965A]/[0.06] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">4. Cargos personalizados</p>
                <p className="mt-1 text-sm text-[#9C8578]">
                  Úsalo para internet, estacionamiento, aseo municipal u otros cobros no estándar.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#B8965A]/30 bg-transparent text-[#B8965A] hover:bg-[#B8965A]/10"
                  onClick={addCustomCharge}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar cargo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[#9C8578] hover:bg-[#D5C3B6]/10 hover:text-[#FAF6F2]"
                  onClick={() => removeService('custom')}
                >
                  Quitar sección
                </Button>
              </div>
            </div>

            {fieldErrors.custom ? (
              <p className="mt-3 text-sm text-[#C27F79]">{fieldErrors.custom}</p>
            ) : null}

            <div className="mt-4 space-y-4">
              {customCharges.map((charge, index) => (
                <div
                  key={charge.id}
                  className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/45 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D3C3C]">
                        <WalletCards className="h-4 w-4 text-[#B8965A]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#FAF6F2]">Cargo adicional {index + 1}</p>
                        <p className="text-xs text-[#9C8578]">Nombre claro y monto del cobro</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomCharge(charge.id)}
                      className="rounded-lg p-2 text-[#9C8578] transition-colors hover:bg-[#D5C3B6]/10 hover:text-[#C27F79]"
                      title="Quitar cargo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
                    <div className="space-y-2">
                      <Label htmlFor={`custom-label-${charge.id}`}>Nombre del cargo</Label>
                      <Input
                        id={`custom-label-${charge.id}`}
                        value={charge.label}
                        onChange={(e) => updateCustomCharge(charge.id, { label: e.target.value })}
                        placeholder="Ej: Internet, estacionamiento, aseo municipal"
                        className="border-[#D5C3B6]/20 bg-[#2D3C3C]/40 text-[#FAF6F2]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`custom-amount-${charge.id}`}>Monto</Label>
                      <Input
                        id={`custom-amount-${charge.id}`}
                        type="number"
                        min="0"
                        value={charge.amount}
                        onChange={(e) => updateCustomCharge(charge.id, { amount: e.target.value })}
                        placeholder="0"
                        className="border-[#D5C3B6]/20 bg-[#2D3C3C]/40 text-[#FAF6F2]"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <DocumentUploader
                      label="Boleta o respaldo del cargo"
                      description="Opcional, pero recomendable para que el cobro sea fácil de entender"
                      currentUrl={charge.billUrl}
                      folder="boletas"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onUpload={(url) => updateCustomCharge(charge.id, { billUrl: url })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
          <Label htmlFor="notes" className="text-[#FAF6F2]">Notas para el arrendatario</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Ej: El gasto común incluye consumo de agua caliente. La boleta de internet se cargó en un ítem adicional."
            className="mt-3 min-h-[120px] border-[#D5C3B6]/20 bg-[#2D3C3C]/40 text-[#FAF6F2]"
          />
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
