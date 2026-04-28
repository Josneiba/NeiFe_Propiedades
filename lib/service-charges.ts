type ExtraServiceItem = {
  label: string
  amount: number
  billUrl?: string | null
}

export type ServiceChargeItem = {
  key: string
  label: string
  amount: number
  billUrl?: string | null
}

type ServiceLike = {
  water?: number | null
  waterBillUrl?: string | null
  electricity?: number | null
  lightBillUrl?: string | null
  gas?: number | null
  gasBillUrl?: string | null
  garbage?: number | null
  garbageBillUrl?: string | null
  commonExpenses?: number | null
  commonBillUrl?: string | null
  other?: number | null
  otherLabel?: string | null
  extraItems?: unknown
}

function safeAmount(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function normalizeExtraServiceItems(extraItems: unknown): ExtraServiceItem[] {
  if (!Array.isArray(extraItems)) return []

  const items = extraItems
    .map<ExtraServiceItem | null>((item, index) => {
      if (!item || typeof item !== 'object') return null
      const raw = item as Record<string, unknown>
      const label =
        typeof raw.label === 'string' && raw.label.trim()
          ? raw.label.trim()
          : `Item ${index + 1}`
      const amount =
        typeof raw.amount === 'number' && Number.isFinite(raw.amount) ? raw.amount : 0
      const billUrl =
        typeof raw.billUrl === 'string' && raw.billUrl.trim() ? raw.billUrl.trim() : null

      return { label, amount, billUrl }
    })

  return items.filter((item): item is ExtraServiceItem => Boolean(item && item.amount > 0))
}

export function buildServiceChargeItems(service?: ServiceLike | null): ServiceChargeItem[] {
  if (!service) return []

  const baseItems: ServiceChargeItem[] = [
    {
      key: 'water',
      label: 'Agua',
      amount: safeAmount(service.water),
      billUrl: service.waterBillUrl ?? null,
    },
    {
      key: 'electricity',
      label: 'Luz',
      amount: safeAmount(service.electricity),
      billUrl: service.lightBillUrl ?? null,
    },
    {
      key: 'gas',
      label: 'Gas',
      amount: safeAmount(service.gas),
      billUrl: service.gasBillUrl ?? null,
    },
    {
      key: 'garbage',
      label: 'Basura',
      amount: safeAmount(service.garbage),
      billUrl: service.garbageBillUrl ?? null,
    },
    {
      key: 'commonExpenses',
      label: 'Gasto común',
      amount: safeAmount(service.commonExpenses),
      billUrl: service.commonBillUrl ?? null,
    },
  ]

  if (safeAmount(service.other) > 0) {
    baseItems.push({
      key: 'other',
      label: service.otherLabel?.trim() || 'Otro',
      amount: safeAmount(service.other),
    })
  }

  const extra = normalizeExtraServiceItems(service.extraItems).map((item, index) => ({
    key: `extra-${index}`,
    label: item.label,
    amount: item.amount,
    billUrl: item.billUrl ?? null,
  }))

  return [...baseItems, ...extra].filter((item) => item.amount > 0)
}

export function getServiceChargesTotal(service?: ServiceLike | null): number {
  return buildServiceChargeItems(service).reduce((sum, item) => sum + item.amount, 0)
}
