import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { MapPin, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

type PaymentStatusConfig = Record<string, { label: string; className: string }>

interface PropertyCardProps {
  property: {
    id: string
    name?: string | null
    address: string
    commune: string
    contractEnd: Date | null
    contractStart?: Date | null
    monthlyRentCLP?: number | null
    tenant: { name: string } | null
    payments: Array<{ status: string }>
    mandates: Array<{ broker: { name: string | null } | null }>
    _count: { maintenance: number }
  }
  statusConfig: PaymentStatusConfig
  isManagedByBroker: boolean
}

export function PropertyCard({
  property,
  statusConfig,
  isManagedByBroker,
}: PropertyCardProps) {
  const currentPayment = property.payments[0]
  const paymentStatus = currentPayment?.status || 'PENDING'
  const statusLabel = statusConfig[paymentStatus]
  const broker = property.mandates[0]?.broker

  const contractEnd = property.contractEnd ? new Date(property.contractEnd) : null
  const contractDays = contractEnd
    ? Math.ceil((contractEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const contractStatus =
    contractDays === null
      ? { label: 'Sin fecha', color: 'text-[#D5C3B6]' }
      : contractDays < 0
        ? { label: 'Vencido', color: 'text-[#C27F79]' }
        : contractDays <= 30
          ? { label: `${contractDays} dias`, color: 'text-[#F2C94C]' }
          : { label: 'Vigente', color: 'text-[#5E8B8C]' }
  const accentColor =
    paymentStatus === 'PAID'
      ? '#5E8B8C'
      : paymentStatus === 'OVERDUE'
        ? '#C27F79'
        : '#F2C94C'
  const contractProgress =
    property.contractStart && contractEnd
      ? Math.min(
          100,
          Math.max(
            0,
            ((Date.now() - new Date(property.contractStart).getTime()) /
              (contractEnd.getTime() - new Date(property.contractStart).getTime())) *
              100
          )
        )
      : null

  return (
    <Link
      href={`/dashboard/propiedades/${property.id}`}
      className={cn(
        'group flex min-h-[260px] flex-col overflow-hidden rounded-2xl border transition-all duration-300',
        isManagedByBroker
          ? 'border-[#5E8B8C]/20 bg-[#244042]/40 hover:border-[#5E8B8C]/40 hover:bg-[#244042]/60'
          : 'border-[#D5C3B6]/10 bg-[#2A2520] hover:border-[#B8965A]/30 hover:bg-[#2A2520]/80'
      )}
    >
      <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: accentColor }} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold leading-tight text-[#FAF6F2]">
              {property.name || property.address}
            </p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-[#9C8578]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {property.commune}
            </p>
          </div>
          {isManagedByBroker && (
            <Badge className="shrink-0 bg-[#5E8B8C]/20 text-[10px] text-[#5E8B8C]">
              Adm. {broker?.name?.split(' ')[0] || 'Corredor'}
            </Badge>
          )}
          {!isManagedByBroker && (
            <Badge className={statusLabel?.className || 'bg-gray-600 text-white'}>
              {statusLabel?.label || 'Sin estado'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-[#1C1917]/60 px-3 py-2.5">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#9C8578]">Pago</p>
            <Badge className={statusLabel?.className || 'bg-gray-600 text-white'}>
              {statusLabel?.label || 'Sin estado'}
            </Badge>
          </div>
          <div className="rounded-xl bg-[#1C1917]/60 px-3 py-2.5">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-[#9C8578]">Arrendatario</p>
            <p className="truncate text-sm font-medium text-[#D5C3B6]">
              {property.tenant?.name || 'Sin asignar'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold leading-none text-[#FAF6F2] tabular-nums">
            {property.monthlyRentCLP
              ? `$${property.monthlyRentCLP.toLocaleString('es-CL')}`
              : 'Sin renta'}
          </span>
          {property._count.maintenance > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#F2C94C]/10 px-2.5 py-1 text-xs font-medium text-[#F2C94C]">
              <Wrench className="h-3.5 w-3.5" />
              {property._count.maintenance} abierta{property._count.maintenance === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div>
          {contractProgress !== null && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1C1917]">
              <div
                className="h-full rounded-full bg-[#5E8B8C]/50 transition-all"
                style={{ width: `${contractProgress}%` }}
              />
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#9C8578]">Contrato</span>
            <span className={cn('text-[11px] font-semibold', contractStatus.color)}>
              {contractStatus.label}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#D5C3B6]/8 px-5 py-3 flex justify-end">
        <span className="text-sm font-medium text-[#5E8B8C] transition-colors group-hover:text-[#8FC4C5]">
          Ver ficha →
        </span>
      </div>
    </Link>
  )
}
