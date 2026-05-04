import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaymentReceiptDownload } from "@/components/payments/payment-receipt-download"
import { ConfirmPaymentButton } from "@/components/payments/confirm-payment-button"
import { GenerateMonthlyPaymentsButton } from "@/components/payments/generate-monthly-payments-button"
import { PageHeader } from "@/components/ui/page-header"
import { NativeSelect } from "@/components/ui/native-select"
import { paymentStatusConfig } from "@/lib/status-config"
import { 
  Building2,
  Check,
  DollarSign,
  Download,
  Clock,
  CreditCard
} from "lucide-react"
import Link from "next/link"

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

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; status?: string; behavior?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role === "BROKER") {
    redirect("/broker")
  }
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { property: filterPropertyId, status: statusFilter = "ALL", behavior: behaviorFilter = "ALL" } =
    await searchParams

  const [properties, filterProperty] = await Promise.all([
    prisma.property.findMany({
      where: { landlordId: session.user.id, isActive: true },
      select: { id: true, name: true, address: true },
      orderBy: { createdAt: "desc" },
    }),
    filterPropertyId != null && filterPropertyId !== ""
      ? prisma.property.findFirst({
          where: {
            id: filterPropertyId,
            landlordId: session.user.id,
          },
          select: { id: true, name: true, address: true },
        })
      : Promise.resolve(null),
  ])

  if (filterPropertyId && !filterProperty) {
    redirect("/dashboard/pagos")
  }

  const page = 1

  // Get all payments for this landlord's properties
  let payments = (await prisma.payment.findMany({
    where: {
      property: {
        landlordId: session.user.id,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
      ...(statusFilter !== "ALL" && {
        status: statusFilter as any,
      }),
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
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 50,
    skip: (page - 1) * 50,
  })) as PaymentWithProperty[]

  payments =
    behaviorFilter === "ONTIME"
      ? payments.filter((p) => p.status === "PAID")
      : behaviorFilter === "LATE"
      ? payments.filter((p) => p.status === "OVERDUE" || p.status === "PENDING")
      : payments

  const getStatusBadge = (status: string) => {
    const config =
      paymentStatusConfig[status as keyof typeof paymentStatusConfig] ??
      paymentStatusConfig.PENDING
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getMonthName = (month: number) => {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    return months[month - 1]
  }

  // Calculate summary stats
  const stats = {
    total: payments.reduce((sum, p) => sum + p.amountCLP, 0),
    paid: payments.reduce((sum, p) => (p.status === "PAID" ? sum + p.amountCLP : sum), 0),
    pending: payments.reduce((sum, p) => (p.status === "PENDING" ? sum + p.amountCLP : sum), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Gestión de Pagos"
        description="Monitorea y confirma los pagos de tus arrendatarios"
      />

      {session.user.role === "OWNER" && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium text-foreground">Generación manual de pagos</p>
              <p className="text-sm text-muted-foreground">
                Úsalo para crear los pagos del mes sin esperar al cron del día 1.
              </p>
            </div>
            <GenerateMonthlyPaymentsButton />
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2A2520] p-4">
        <form className="grid gap-3 sm:grid-cols-3" action="/dashboard/pagos" method="GET">
          <NativeSelect label="Propiedad" name="property" id="property" defaultValue={filterPropertyId ?? ""}>
            <option value="">Todas las propiedades</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.address}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect label="Estado" name="status" id="status" defaultValue={statusFilter}>
            <option value="ALL">Todos los estados</option>
            <option value="PAID">Pagado</option>
            <option value="PENDING">Pendiente</option>
            <option value="PROCESSING">En revisión</option>
            <option value="OVERDUE">Atrasado</option>
            <option value="CANCELLED">Cancelado</option>
          </NativeSelect>

          <NativeSelect label="Comportamiento" name="behavior" id="behavior" defaultValue={behaviorFilter ?? ""}>
            <option value="ALL">Sin filtro</option>
            <option value="ONTIME">Pagadores puntuales</option>
            <option value="LATE">Con atrasos</option>
          </NativeSelect>

          <div className="flex gap-3 sm:col-span-3 sm:justify-end">
            <button
              type="submit"
              className="rounded-lg bg-[#5E8B8C] px-4 py-2 text-sm font-medium text-[#FAF6F2] transition-colors hover:bg-[#5E8B8C]/90"
            >
              Aplicar filtros
            </button>
            {(filterPropertyId || statusFilter !== "ALL" || behaviorFilter !== "ALL") && (
              <Button variant="outline" className="border-[#D5C3B6]/15 text-[#D5C3B6]" asChild>
                <Link href="/dashboard/pagos">Limpiar</Link>
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Summary Cards */}
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
                  ${stats.total.toLocaleString("es-CL")}
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
                  ${stats.paid.toLocaleString("es-CL")}
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
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  ${stats.pending.toLocaleString("es-CL")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="h-12 w-12 text-[#5E8B8C]" />
                </div>
                <h3 className="text-2xl font-semibold text-[#FAF6F2] mb-3">
                  {filterPropertyId || statusFilter !== "ALL" || behaviorFilter !== "ALL"
                    ? "No se encontraron pagos con los filtros aplicados"
                    : "Sin pagos registrados"}
                </h3>
                <p className="text-[#9C8578] mb-8 max-w-md mx-auto">
                  {filterPropertyId || statusFilter !== "ALL" || behaviorFilter !== "ALL"
                    ? "Intenta cambiar los filtros para ver más resultados."
                    : "Los pagos aparecerán aquí una vez que configures una propiedad con arrendatario."}
                </p>
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
                        {payment.property.tenant?.name || "Sin asignar"}
                      </td>
                      <td className="py-4 px-2 text-muted-foreground">
                        {getMonthName(payment.month)} {payment.year}
                      </td>
                      <td className="py-4 px-2 text-right font-medium text-foreground font-mono">
                        ${payment.amountCLP.toLocaleString("es-CL")}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="py-4 px-2 text-right space-x-2 flex justify-end">
                        {payment.status === "PROCESSING" && payment.receipt && (
                          <>
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
                            <ConfirmPaymentButton paymentId={payment.id} />
                          </>
                        )}
                        {payment.status === "PAID" && payment.receipt && (
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
                        )}
                        {payment.status === "PAID" && (
                          <PaymentReceiptDownload
                            payment={{
                              id: payment.id,
                              month: payment.month,
                              year: payment.year,
                              amountCLP: payment.amountCLP,
                              amountUF: payment.amountUF,
                              paidAt: payment.paidAt?.toISOString() || null,
                              createdAt: payment.createdAt.toISOString(),
                              method: payment.method,
                              notes: payment.notes,
                              property: {
                                address: payment.property.address,
                                commune: payment.property.commune,
                                tenant: payment.property.tenant
                                  ? { name: payment.property.tenant.name }
                                  : null,
                              },
                            }}
                            landlordName={session.user.name || "Arrendador"}
                          />
                        )}
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
