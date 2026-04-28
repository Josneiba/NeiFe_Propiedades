import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { canAccessMandate } from '@/lib/mandates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  Receipt,
  ShieldCheck,
  Wrench,
} from 'lucide-react'

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Pagado', className: 'bg-[#5E8B8C] text-white' },
  PENDING: { label: 'Pendiente', className: 'bg-[#C27F79] text-white' },
  OVERDUE: { label: 'Atrasado', className: 'bg-red-600 text-white' },
  PROCESSING: { label: 'En revisión', className: 'bg-[#F2C94C] text-[#1C1917]' },
}

function formatDate(value?: Date | null) {
  if (!value) return 'No definida'
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value)
}

function formatCurrency(value?: number | null) {
  if (value == null) return 'No informado'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value)
}

export default async function SharedMandateDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const mandate = await prisma.mandate.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          tenant: {
            select: {
              name: true,
              email: true,
            },
          },
          payments: {
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: 3,
          },
          maintenance: {
            where: {
              status: {
                in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
              },
            },
            orderBy: { updatedAt: 'desc' },
            take: 5,
          },
          inspections: {
            orderBy: { scheduledAt: 'asc' },
            take: 3,
          },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      broker: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
    },
  })

  if (!mandate || !canAccessMandate(mandate, session.user.id)) {
    redirect('/dashboard')
  }

  const latestStatement = await prisma.brokerStatement.findFirst({
    where: { propertyId: mandate.propertyId, brokerId: mandate.brokerId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
  })

  const recentMessages = await prisma.brokerMessage.findMany({
    where: { propertyId: mandate.propertyId, senderId: mandate.brokerId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      subject: true,
      type: true,
      createdAt: true,
      sendEmail: true,
      emailStatus: true,
    },
  })

  const currentPayment = mandate.property.payments[0] ?? null
  const paymentStatus = currentPayment
    ? paymentStatusConfig[currentPayment.status] || {
        label: currentPayment.status,
        className: 'bg-[#9C8578] text-white',
      }
    : null

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#5E8B8C] text-white">Seguimiento compartido</Badge>
            <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">
              {mandate.status === 'ACTIVE' ? 'Mandato activo' : mandate.status}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-foreground">
            {mandate.property.name || mandate.property.address}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Vista en solo lectura para que propietario y corredor compartan el mismo estado operativo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="border-border text-foreground">
            <Link href={`/mandatos/${mandate.id}/documento`}>
              <FileText className="mr-2 h-4 w-4" />
              Ver mandato firmado
            </Link>
          </Button>
          <Button asChild className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
            <a href={`/api/mandates/${mandate.id}/document?download=1`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Descargar PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pago actual</p>
            <p className="mt-3 text-xl font-semibold text-foreground">
              {currentPayment ? formatCurrency(currentPayment.amountCLP) : 'Sin registro'}
            </p>
            {paymentStatus ? (
              <Badge className={`mt-3 ${paymentStatus.className}`}>{paymentStatus.label}</Badge>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Aún no existe registro del mes</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mantenciones abiertas</p>
            <p className="mt-3 text-xl font-semibold text-foreground">{mandate.property.maintenance.length}</p>
            <p className="mt-3 text-sm text-muted-foreground">Seguimiento operativo en curso</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Próxima inspección</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {mandate.property.inspections[0] ? formatDate(mandate.property.inspections[0].scheduledAt) : 'Sin agenda'}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {mandate.property.inspections[0]?.status || 'No programada'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Última rendición</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {latestStatement ? `${latestStatement.month}/${latestStatement.year}` : 'Sin rendición'}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {latestStatement ? formatCurrency(latestStatement.netTransferCLP) : 'Aún no generada'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-5 w-5 text-[#5E8B8C]" />
                Relación de mandato
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Propietario</p>
                <p className="mt-2 font-semibold text-foreground">{mandate.owner.name || mandate.owner.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">{mandate.owner.email}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Corredor</p>
                <p className="mt-2 font-semibold text-foreground">{mandate.broker.name || mandate.broker.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">{mandate.broker.email}</p>
                {mandate.broker.company ? (
                  <p className="mt-1 text-sm text-muted-foreground">{mandate.broker.company}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vigencia</p>
                <p className="mt-2 text-foreground">
                  {formatDate(mandate.startsAt)} al {formatDate(mandate.expiresAt)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Comisión</p>
                <p className="mt-2 text-foreground">
                  {mandate.commissionRate != null
                    ? `${mandate.commissionRate}%`
                    : 'No definida'}
                  {mandate.commissionType ? ` · ${mandate.commissionType}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Wrench className="h-5 w-5 text-[#5E8B8C]" />
                Mantenciones activas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mandate.property.maintenance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay mantenciones abiertas.</p>
              ) : (
                mandate.property.maintenance.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.description}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.category} · abierta desde {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Mail className="h-5 w-5 text-[#5E8B8C]" />
                Últimos avisos enviados por el corredor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no se han enviado avisos al arrendatario.</p>
              ) : (
                recentMessages.map((message) => (
                  <div key={message.id} className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="font-medium text-foreground">{message.subject}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {message.type} · {formatDate(message.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {message.sendEmail
                        ? message.emailStatus === 'SENT'
                          ? 'Enviado por app y email'
                          : 'Registrado en app; email con falla'
                        : 'Enviado solo por app'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5 text-[#5E8B8C]" />
                Pagos recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mandate.property.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
              ) : (
                mandate.property.payments.map((payment) => {
                  const status = paymentStatusConfig[payment.status] || {
                    label: payment.status,
                    className: 'bg-[#9C8578] text-white',
                  }
                  return (
                    <div key={payment.id} className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {payment.month}/{payment.year}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatCurrency(payment.amountCLP)}
                          </p>
                        </div>
                        <Badge className={status.className}>{status.label}</Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Receipt className="h-5 w-5 text-[#5E8B8C]" />
                Última rendición
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestStatement ? (
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="font-medium text-foreground">
                    {latestStatement.month}/{latestStatement.year}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Bruto: {formatCurrency(latestStatement.grossIncomeCLP)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Comisión: {formatCurrency(latestStatement.brokerCommissionCLP)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Neto a transferir: {formatCurrency(latestStatement.netTransferCLP)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no existe una rendición para esta propiedad.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-[#5E8B8C]" />
                Contexto actual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Arrendatario: {mandate.property.tenant?.name || 'Sin arrendatario'}</p>
              <p>Correo: {mandate.property.tenant?.email || 'Sin correo'}</p>
              <p>Renta actual: {formatCurrency(mandate.property.monthlyRentCLP)}</p>
              <p>Contrato vigente hasta: {formatDate(mandate.property.contractEnd)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
