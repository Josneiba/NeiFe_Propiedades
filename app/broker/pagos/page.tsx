import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmPaymentButton } from '@/components/payments/confirm-payment-button'
import { paymentStatus } from '@/lib/broker-design'
import { getDocumentKindLabel, getDocumentViewUrl } from '@/lib/document-utils'
import {
  Building2,
  Check,
  Clock,
  CreditCard,
  Download,
  DollarSign,
} from 'lucide-react'

interface PaymentWithProperty {
  id: string
  month: number
  year: number
  status: string
  amountCLP: number
  amountUF: number
  method: string | null
  notes: string | null
  paidAt: Date | null
  createdAt: Date
  receipt: string | null
  property: {
    id: string
    address: string
    commune: string
    tenant: {
      name: string | null
      email: string
    } | null
  }
}

export default async function BrokerPagosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; status?: string; behavior?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    redirect('/dashboard')
  }

  const {
    property: filterPropertyId,
    status: statusFilter = 'ALL',
    behavior: behaviorFilter = 'ALL',
  } = await searchParams

  const managedPropertyWhere =
    session.user.role === 'BROKER'
      ? {
          isActive: true,
          mandates: {
            some: {
              brokerId: session.user.id,
              status: 'ACTIVE' as const,
            },
          },
        }
      : {
          isActive: true,
          managedBy: session.user.id,
        }

  const [properties, filterProperty] = await Promise.all([
    prisma.property.findMany({
      where: managedPropertyWhere,
      select: { id: true, name: true, address: true },
      orderBy: { createdAt: 'desc' },
    }),
    filterPropertyId
      ? prisma.property.findFirst({
          where: {
            id: filterPropertyId,
            ...managedPropertyWhere,
          },
          select: { id: true, name: true, address: true },
        })
      : Promise.resolve(null),
  ])

  if (filterPropertyId && !filterProperty) {
    redirect('/broker/pagos')
  }

  let payments = (await prisma.payment.findMany({
    where: {
      property: {
        ...managedPropertyWhere,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
      ...(statusFilter !== 'ALL' ? { status: statusFilter as any } : {}),
    },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          commune: true,
          tenant: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 50,
  })) as PaymentWithProperty[]

  payments =
    behaviorFilter === 'ONTIME'
      ? payments.filter((payment) => payment.status === 'PAID')
      : behaviorFilter === 'LATE'
        ? payments.filter((payment) =>
            ['OVERDUE', 'PENDING', 'PROCESSING'].includes(payment.status)
          )
        : payments

  const getStatusBadge = (status: string) => {
    const conf = paymentStatus[status as keyof typeof paymentStatus] ?? paymentStatus.PENDING
    return <Badge className={conf.badge}>{conf.label}</Badge>
  }

  const getMonthName = (month: number) => {
    const months = [
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
    return months[month - 1]
  }

  const stats = {
    total: payments.reduce((sum, payment) => sum + payment.amountCLP, 0),
    paid: payments.reduce(
      (sum, payment) => (payment.status === 'PAID' ? sum + payment.amountCLP : sum),
      0
    ),
    pending: payments.reduce(
      (sum, payment) =>
        ['PENDING', 'OVERDUE', 'PROCESSING'].includes(payment.status)
          ? sum + payment.amountCLP
          : sum,
      0
    ),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Pagos administrados</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">Revisa comprobantes y confirma pagos de tus propiedades</p>
      </div>

      <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-4">
        <form className="grid gap-3 sm:grid-cols-3" action="/broker/pagos" method="GET">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9C8578] uppercase tracking-wider" htmlFor="property">Propiedad</label>
            <select id="property" name="property" defaultValue={filterPropertyId ?? ''}
              className="w-full rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2.5 text-sm text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]">
              <option value="">Todas las propiedades</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name || p.address}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9C8578] uppercase tracking-wider" htmlFor="status">Estado</label>
            <select id="status" name="status" defaultValue={statusFilter}
              className="w-full rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2.5 text-sm text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]">
              <option value="ALL">Todos</option>
              <option value="PAID">Pagado</option>
              <option value="PENDING">Pendiente</option>
              <option value="PROCESSING">En revisión</option>
              <option value="OVERDUE">Atrasado</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9C8578] uppercase tracking-wider" htmlFor="behavior">Comportamiento</label>
            <select id="behavior" name="behavior" defaultValue={behaviorFilter}
              className="w-full rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2.5 text-sm text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]">
              <option value="ALL">Todos</option>
              <option value="ONTIME">Al día</option>
              <option value="LATE">Pendientes</option>
            </select>
          </div>
          <div className="sm:col-span-3 flex gap-2 pt-1">
            <button type="submit"
              className="rounded-lg bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] px-4 py-2 text-sm font-medium transition-colors">
              Aplicar
            </button>
            {(filterPropertyId || statusFilter !== 'ALL' || behaviorFilter !== 'ALL') && (
              <a href="/broker/pagos"
                className="rounded-lg border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/5 px-4 py-2 text-sm font-medium transition-colors">
                Limpiar
              </a>
            )}
          </div>
        </form>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#5E8B8C]/20 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-[#5E8B8C]" />
              </div>
              <div>
                <p className="text-xs text-[#9C8578]">Total esperado</p>
                <p className="text-xl font-semibold font-mono text-[#FAF6F2]">
                  ${stats.total.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#5E8B8C]/20 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-[#5E8B8C]" />
              </div>
              <div>
                <p className="text-xs text-[#9C8578]">Pagado</p>
                <p className="text-xl font-semibold font-mono text-[#FAF6F2]">
                  ${stats.paid.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C27F79]/20 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-[#C27F79]" />
              </div>
              <div>
                <p className="text-xs text-[#9C8578]">Por revisar</p>
                <p className="text-xl font-semibold font-mono text-[#FAF6F2]">
                  ${stats.pending.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-6 pt-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Historial de pagos</p>
          {payments.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#5E8B8C]/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-[#5E8B8C]/50" />
              </div>
              <h3 className="text-lg font-medium text-[#FAF6F2] mb-2">
                {filterPropertyId || statusFilter !== 'ALL' || behaviorFilter !== 'ALL'
                  ? 'No se encontraron pagos con los filtros aplicados'
                  : properties.length === 0
                    ? 'Aún no tienes propiedades activas para recaudar'
                    : 'Sin pagos registrados'}
              </h3>
              <p className="text-sm text-[#9C8578] mb-5 max-w-md mx-auto">
                {filterPropertyId || statusFilter !== 'ALL' || behaviorFilter !== 'ALL'
                  ? 'Intenta cambiar los filtros para ver más resultados.'
                  : properties.length === 0
                    ? 'Cuando un propietario apruebe un mandato activo, verás aquí todos los pagos de esa cartera.'
                    : 'Los pagos aparecerán aquí cuando una propiedad administrada tenga arriendo activo.'}
              </p>
              {properties.length === 0 && (
                <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]" asChild>
                  <Link href="/broker/mandatos">Ir a mandatos</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D5C3B6]/10">
                    <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Propiedad</th>
                    <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Arrendatario</th>
                    <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Período</th>
                    <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Monto</th>
                    <th className="text-center py-3 px-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Estado</th>
                    <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#9C8578]" />
                          <span className="text-[#FAF6F2] font-medium truncate max-w-xs">
                            {payment.property.address}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#9C8578]">
                        {payment.property.tenant?.name || 'Sin asignar'}
                      </td>
                      <td className="py-3 px-3 text-[#9C8578]">
                        {getMonthName(payment.month)} {payment.year}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-[#FAF6F2] font-mono">
                        ${payment.amountCLP.toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 px-3 text-center">{getStatusBadge(payment.status)}</td>
                      <td className="py-3 px-3">
                        <div className="flex justify-end gap-2">
                          {payment.receipt ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#D5C3B6]/20 text-[#5E8B8C] hover:text-[#5E8B8C] hover:bg-[#5E8B8C]/10"
                              asChild
                            >
                              <a href={getDocumentViewUrl(payment.receipt) ?? payment.receipt} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Ver {getDocumentKindLabel(payment.receipt).toLowerCase()}
                              </a>
                            </Button>
                          ) : null}
                          {payment.status === 'PROCESSING' && payment.receipt ? (
                            <ConfirmPaymentButton
                              paymentId={payment.id}
                              label="Confirmar"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            />
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10"
                            asChild
                          >
                            <Link href={`/broker/propiedades/${payment.property.id}`}>
                              Ver ficha
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
