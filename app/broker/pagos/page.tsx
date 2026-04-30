import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmPaymentButton } from '@/components/payments/confirm-payment-button'
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
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pendiente' },
      PROCESSING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En revisión' },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Pagado' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Vencido' },
      CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Cancelado' },
    }
    const config = statusMap[status] || statusMap.PENDING
    return <Badge className={`${config.bg} ${config.text} border-0`}>{config.label}</Badge>
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
        <h1 className="text-3xl font-bold text-foreground">Pagos administrados</h1>
        <p className="text-muted-foreground">
          Revisa comprobantes y confirma pagos de las propiedades que gestionas.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <form className="grid gap-4 md:grid-cols-3" action="/broker/pagos" method="GET">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="property">
                Propiedad
              </label>
              <select
                id="property"
                name="property"
                defaultValue={filterPropertyId ?? ''}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="">Todas</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name || property.address}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="status">
                Estado de pago
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="ALL">Todos</option>
                <option value="PAID">Pagado</option>
                <option value="PENDING">Pendiente</option>
                <option value="PROCESSING">En revisión</option>
                <option value="OVERDUE">Vencido</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="behavior">
                Comportamiento
              </label>
              <select
                id="behavior"
                name="behavior"
                defaultValue={behaviorFilter}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="ALL">Todos</option>
                <option value="ONTIME">Al día</option>
                <option value="LATE">Pendientes / revisión</option>
              </select>
            </div>

            <div className="md:col-span-3 flex gap-3 pt-1">
              <Button type="submit" className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90">
                Aplicar filtros
              </Button>
              {(filterPropertyId || statusFilter !== 'ALL' || behaviorFilter !== 'ALL') && (
                <Button variant="outline" className="border-border" asChild>
                  <Link href="/broker/pagos">Limpiar</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#5E8B8C]/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-[#5E8B8C]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total esperado</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  ${stats.total.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagado</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  ${stats.paid.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#C27F79]/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#C27F79]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por revisar</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  ${stats.pending.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="h-12 w-12 text-[#5E8B8C]" />
                </div>
                <h3 className="text-2xl font-semibold text-[#FAF6F2] mb-3">
                  {filterPropertyId || statusFilter !== 'ALL' || behaviorFilter !== 'ALL'
                    ? 'No se encontraron pagos con los filtros aplicados'
                    : properties.length === 0
                      ? 'Aún no tienes propiedades activas para recaudar'
                      : 'Sin pagos registrados'}
                </h3>
                <p className="text-[#9C8578] mb-8 max-w-md mx-auto">
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
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Propiedad</th>
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Arrendatario</th>
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Período</th>
                    <th className="text-right py-3 px-2 font-semibold text-foreground">Monto</th>
                    <th className="text-center py-3 px-2 font-semibold text-foreground">Estado</th>
                    <th className="text-right py-3 px-2 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground font-medium truncate max-w-xs">
                            {payment.property.address}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-muted-foreground">
                        {payment.property.tenant?.name || 'Sin asignar'}
                      </td>
                      <td className="py-4 px-2 text-muted-foreground">
                        {getMonthName(payment.month)} {payment.year}
                      </td>
                      <td className="py-4 px-2 text-right font-medium text-foreground font-mono">
                        ${payment.amountCLP.toLocaleString('es-CL')}
                      </td>
                      <td className="py-4 px-2 text-center">{getStatusBadge(payment.status)}</td>
                      <td className="py-4 px-2">
                        <div className="flex justify-end gap-2">
                          {payment.receipt ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border text-[#5E8B8C] hover:text-[#5E8B8C] hover:bg-[#5E8B8C]/10"
                              asChild
                            >
                              <a href={payment.receipt} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
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
                            className="border-border"
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
