import Link from 'next/link'
import Image from 'next/image'
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
    monthlyRentCLP: number | null
    contractStart: Date | null
    contractEnd: Date | null
    landlord?: { name: string | null } | null
    tenant: { name: string | null } | null
    payments: Array<{ status: string }>
    mandates: Array<{ id?: string; broker?: { name: string | null } | null }>
    photos?: Array<{ url: string; order: number }>
    _count: { maintenance: number }
  }
  statusConfig: PaymentStatusConfig
  isManagedByBroker: boolean
  href?: string
  footerLabel?: string
  ownerLabel?: string
}

export function PropertyCard({
  property,
  statusConfig,
  isManagedByBroker,
  href,
  footerLabel = 'Ver detalle →',
  ownerLabel = 'Propietario',
}: PropertyCardProps) {
  const currentPayment = property.payments[0]
  const paymentStatus = currentPayment?.status || 'PENDING'
  const statusLabel = statusConfig[paymentStatus]

  const coverPhoto = property.photos
    ? [...property.photos].sort((a, b) => a.order - b.order)[0]
    : null

  const accentColor =
    paymentStatus === 'PAID'
      ? '#5E8B8C'
      : paymentStatus === 'OVERDUE'
        ? '#C27F79'
        : '#F2C94C'

  const contractEnd = property.contractEnd ? new Date(property.contractEnd) : null
  const contractStart = property.contractStart ? new Date(property.contractStart) : null
  const daysLeft = contractEnd
    ? Math.ceil((contractEnd.getTime() - Date.now()) / 86_400_000)
    : null
  const contractPct =
    contractStart && contractEnd
      ? Math.min(
          100,
          Math.max(
            0,
            ((Date.now() - contractStart.getTime()) /
              (contractEnd.getTime() - contractStart.getTime())) *
              100,
          ),
        )
      : null

  return (
    <Link
      href={href ?? `/dashboard/propiedades/${property.id}`}
      className={cn(
        'group flex min-h-[260px] flex-col rounded-2xl border overflow-hidden transition-all duration-200',
        isManagedByBroker
          ? 'border-[#5E8B8C]/20 bg-[#244042]/40 hover:border-[#5E8B8C]/40'
          : 'border-[#D5C3B6]/10 bg-[#2D3C3C] hover:border-[#5E8B8C]/30',
      )}
    >
      <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: accentColor }} />

      <div className="relative h-28 w-full flex-shrink-0 bg-[#1C1917]/60 overflow-hidden">
        {coverPhoto ? (
          <Image
            src={coverPhoto.url}
            alt={property.name || property.address}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-12 w-12 text-[#D5C3B6]/20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base text-[#FAF6F2] truncate leading-tight group-hover:text-white transition-colors">
              {property.name || property.address}
            </p>
            <p className="text-sm text-[#9C8578] truncate mt-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {property.commune}
            </p>
          </div>
          <Badge className={cn('shrink-0 text-[11px] px-2 py-0.5', statusLabel?.className || 'bg-gray-600 text-white')}>
            {statusLabel?.label || 'Sin estado'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-[#1C1917]/60 px-3 py-2.5">
            <p className="text-[10px] text-[#9C8578] uppercase tracking-wider mb-1">{ownerLabel}</p>
            <p className="text-sm truncate font-medium">
              {property.landlord?.name ? (
                <span className="text-[#D5C3B6]">{property.landlord.name}</span>
              ) : (
                <span className="text-[#9C8578] italic">Sin asignar</span>
              )}
            </p>
          </div>
          <div className="rounded-xl bg-[#1C1917]/60 px-3 py-2.5">
            <p className="text-[10px] text-[#9C8578] uppercase tracking-wider mb-1">Arrendatario</p>
            <p className="text-sm truncate font-medium">
              {property.tenant?.name ? (
                <span className="text-[#D5C3B6]">{property.tenant.name}</span>
              ) : (
                <span className="text-[#9C8578] italic">Sin asignar</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold text-[#FAF6F2] tabular-nums leading-none">
            {property.monthlyRentCLP ? (
              `$${property.monthlyRentCLP.toLocaleString('es-CL')}`
            ) : (
              <span className="text-[#9C8578] font-normal text-sm">Sin renta</span>
            )}
          </span>
          {property._count.maintenance > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#F2C94C]/10 px-2.5 py-1 text-xs font-medium text-[#F2C94C]">
              <Wrench className="h-3.5 w-3.5" />
              {property._count.maintenance} abierta{property._count.maintenance === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {contractPct !== null && (
          <div className="mt-auto">
            <div className="h-1.5 w-full rounded-full bg-[#1C1917] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#5E8B8C]/50 transition-all"
                style={{ width: `${contractPct}%` }}
              />
            </div>
            <p className="text-[11px] text-[#9C8578] mt-1.5">
              {daysLeft !== null && daysLeft > 0
                ? `Vence en ${daysLeft}d`
                : daysLeft === 0
                  ? 'Vence hoy'
                  : 'Vencido'}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[#D5C3B6]/8 px-5 py-3 flex justify-end">
        <span className="text-sm text-[#5E8B8C] group-hover:text-[#8FC4C5] font-medium transition-colors">
          {footerLabel}
        </span>
      </div>
    </Link>
  )
}
