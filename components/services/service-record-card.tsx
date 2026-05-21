import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDocumentViewUrl } from '@/lib/document-utils'
import {
  Droplets,
  Flame,
  ReceiptText,
  Trash2,
  Zap,
} from 'lucide-react'

type ExtraItem = {
  label: string
  amount: number
  billUrl?: string | null
}

type ServiceRecord = {
  month: number
  year: number
  water: number
  electricity: number
  gas?: number | null
  garbage?: number | null
  commonExpenses?: number | null
  other?: number | null
  otherLabel?: string | null
  notes?: string | null
  waterBillUrl?: string | null
  lightBillUrl?: string | null
  gasBillUrl?: string | null
  garbageBillUrl?: string | null
  commonBillUrl?: string | null
  extraItems?: unknown
}

interface ServiceRecordCardProps {
  record: ServiceRecord
  monthLabel: string
  propertyLabel?: string | null
  propertyMeta?: string | null
  tenantName?: string | null
  highlighted?: boolean
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-CL')}`
}

export function ServiceRecordCard({
  record,
  monthLabel,
  propertyLabel,
  propertyMeta,
  tenantName,
  highlighted = false,
}: ServiceRecordCardProps) {
  const parsedExtraItems = Array.isArray(record.extraItems)
    ? record.extraItems
        .filter((item): item is ExtraItem => {
          if (!item || typeof item !== 'object') return false

          const candidate = item as Record<string, unknown>
          return (
            typeof candidate.label === 'string' &&
            typeof candidate.amount === 'number'
          )
        })
        .filter((item) => item.amount > 0)
    : []

  const extraItems =
    parsedExtraItems.length > 0
      ? parsedExtraItems
      : record.other && record.other > 0
        ? [{ label: record.otherLabel || 'Otro cargo', amount: record.other }]
        : []

  const chargeItems = [
    {
      key: 'water',
      label: 'Agua',
      amount: record.water,
      icon: Droplets,
      accent: 'text-sky-400',
      billUrl: record.waterBillUrl,
    },
    {
      key: 'electricity',
      label: 'Electricidad',
      amount: record.electricity,
      icon: Zap,
      accent: 'text-amber-400',
      billUrl: record.lightBillUrl,
    },
    {
      key: 'gas',
      label: 'Gas',
      amount: record.gas ?? 0,
      icon: Flame,
      accent: 'text-orange-400',
      billUrl: record.gasBillUrl,
    },
    {
      key: 'garbage',
      label: 'Basura',
      amount: record.garbage ?? 0,
      icon: Trash2,
      accent: 'text-[#B8965A]',
      billUrl: record.garbageBillUrl,
    },
    {
      key: 'commonExpenses',
      label: 'Gasto común',
      amount: record.commonExpenses ?? 0,
      icon: ReceiptText,
      accent: 'text-[#D5C3B6]',
      billUrl: record.commonBillUrl,
    },
    ...extraItems.map((item, index) => ({
      key: `extra-${index}`,
      label: item.label,
      amount: item.amount,
      icon: ReceiptText,
      accent: 'text-[#C27F79]',
      billUrl: item.billUrl,
    })),
  ].filter((item) => item.amount > 0)

  const total = chargeItems.reduce((sum, item) => sum + item.amount, 0)
  const bills = chargeItems
    .map((item) => ({
      ...item,
      viewUrl: item.billUrl ? getDocumentViewUrl(item.billUrl) : null,
    }))
    .filter((item) => item.billUrl)

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        highlighted
          ? 'border-[#5E8B8C]/45 bg-[#5E8B8C]/10 shadow-[0_0_0_1px_rgba(94,139,140,0.25)]'
          : 'border-[#D5C3B6]/10 bg-[#1C1917]/35'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#5E8B8C]/15 text-[#5E8B8C]">{monthLabel}</Badge>
            {highlighted ? (
              <Badge className="bg-[#F2C94C]/18 text-[#F2C94C]">Recién actualizado</Badge>
            ) : null}
            {propertyLabel ? (
              <span className="text-sm font-semibold text-[#FAF6F2]">{propertyLabel}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[#9C8578]">
            {propertyMeta ? <span>{propertyMeta}</span> : null}
            {tenantName ? <span>Arrendatario: {tenantName}</span> : null}
          </div>
        </div>

        <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/70 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#9C8578]">Total del período</p>
          <p className="mt-2 text-xl font-semibold text-[#FAF6F2]">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {chargeItems.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.accent}`} />
                <p className="text-sm font-medium text-[#FAF6F2]">{item.label}</p>
              </div>
              <p className="text-sm font-semibold text-[#FAF6F2]">{formatCurrency(item.amount)}</p>
            </div>
            {item.billUrl ? (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#D5C3B6]/15 bg-transparent text-[#D5C3B6] hover:bg-[#D5C3B6]/10 hover:text-[#FAF6F2]"
                  asChild
                >
                  <a href={getDocumentViewUrl(item.billUrl) ?? item.billUrl ?? undefined} target="_blank" rel="noopener noreferrer">
                    Ver boleta
                  </a>
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#9C8578]">Sin boleta adjunta</p>
            )}
          </div>
        ))}
      </div>

      {record.notes ? (
        <div className="mt-4 rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/35 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">Notas del período</p>
          <p className="mt-2 text-sm text-[#D5C3B6]">{record.notes}</p>
        </div>
      ) : null}

      {bills.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {bills.map((item) => (
            <Button
              key={`${item.key}-bill`}
              variant="outline"
              size="sm"
              className="border-[#D5C3B6]/15 bg-transparent text-[#D5C3B6] hover:bg-[#D5C3B6]/10 hover:text-[#FAF6F2]"
              asChild
            >
              <a href={item.viewUrl!} target="_blank" rel="noopener noreferrer">
                Boleta {item.label}
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
