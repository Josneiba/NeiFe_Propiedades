import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

type PaymentStatusConfig = Record<string, { label: string; className: string }>

interface PropertyCardProps {
  property: {
    id: string
    address: string
    commune: string
    contractEnd: Date | null
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

  return (
    <Link
      href={`/dashboard/propiedades/${property.id}`}
      className={cn(
        'group block rounded-xl border p-4 transition-all duration-300',
        isManagedByBroker
          ? 'border-[#5E8B8C]/20 bg-[#244042]/40 hover:border-[#5E8B8C]/40 hover:bg-[#244042]/60'
          : 'border-[#D5C3B6]/10 bg-[#2A2520] hover:border-[#B8965A]/30 hover:bg-[#2A2520]/80'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#FAF6F2]">{property.address}</p>
          <p className="truncate text-xs text-[#9C8578]">{property.commune}</p>
        </div>
        {isManagedByBroker && (
          <Badge className="shrink-0 bg-[#5E8B8C]/20 text-[10px] text-[#5E8B8C]">
            Adm. {broker?.name?.split(' ')[0] || 'Corredor'}
          </Badge>
        )}
      </div>

      {property.tenant && (
        <div className="mb-3 flex items-center gap-2 text-xs text-[#9C8578]">
          <span className="font-medium">Arrendatario</span>
          <span className="truncate text-[#D5C3B6]">{property.tenant.name}</span>
        </div>
      )}

      <div className="space-y-2 border-t border-[#D5C3B6]/10 pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-wide text-[#9C8578]">Pago</span>
          <Badge className={statusLabel?.className || 'bg-gray-600 text-white'}>
            {statusLabel?.label || 'Sin estado'}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-wide text-[#9C8578]">Contrato</span>
          <span className={cn('text-[10px] font-semibold', contractStatus.color)}>
            {contractStatus.label}
          </span>
        </div>

        {property._count.maintenance > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-wide text-[#9C8578]">Mantenciones</span>
            <Badge className="bg-[#F2C94C]/20 text-[10px] text-[#F2C94C]">
              {property._count.maintenance} pendiente{property._count.maintenance > 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[#9C8578]">
        <span>{isManagedByBroker ? 'Vista coordinada' : 'Gestion directa'}</span>
        <span className="inline-flex items-center gap-1 text-[#D5C3B6] transition-colors group-hover:text-[#FAF6F2]">
          <Eye className="h-3.5 w-3.5" />
          Ver detalle
        </span>
      </div>
    </Link>
  )
}
