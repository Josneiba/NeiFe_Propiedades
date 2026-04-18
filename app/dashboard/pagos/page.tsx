import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Building2,
  Check,
  DollarSign,
  Download,
  Clock
} from "lucide-react"
import Link from "next/link"

interface PaymentWithProperty {
  id: string
  month: number
  year: number
  status: string
  amountCLP: number
  receipt: string | null
  property: {
    id: string
    address: string
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
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { property: filterPropertyId, status: statusFilter = "ALL", behavior: behaviorFilter = "ALL" } =
    await searchParams

  const properties = await prisma.property.findMany({
    where: { landlordId: session.user.id, isActive: true },
    select: { id: true, name: true, address: true },
    orderBy: { createdAt: "desc" },
  })

  const filterProperty =
    filterPropertyId != null && filterPropertyId !== ""
      ? await prisma.property.findFirst({
          where: {
            id: filterPropertyId,
            landlordId: session.user.id,
          },
          select: { id: true, name: true, address: true },
        })
      : null

  if (filterPropertyId && !filterProperty) {
    redirect("/dashboard/pagos")
  }

  // Add pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Get all payments for this landlord's properties
  let payments = (await prisma.payment.findMany({
    where: {
      property: {
        landlordId: session.user.id,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
    },
    include: {
      property: {
        select: {
          id: true,
          address: true,
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
    ...(statusFilter !== "ALL" && {
      status: statusFilter as any,
    }),
  })) as PaymentWithProperty[]

  // Check if there are more payments to load
  const totalPayments = await prisma.payment.count({
    where: {
      property: {
        landlordId: session.user.id,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
      ...(statusFilter !== "ALL" && {
        status: statusFilter as any,
      }),
    },
  })
  const hasMorePayments = page * 50 < totalPayments

  payments =
    behaviorFilter === "ONTIME"
      ? payments.filter((p) => p.status === "PAID")
      : behaviorFilter === "LATE"
      ? payments.filter((p) => p.status === "OVERDUE" || p.status === "PENDING")
      : payments

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-gray-100", text: "text-gray-700", label: "Pendiente" },
      PROCESSING: { bg: "bg-amber-100", text: "text-amber-700", label: "En revisión" },
      PAID: { bg: "bg-green-100", text: "text-green-700", label: "Pagado" },
      OVERDUE: { bg: "bg-red-100", text: "text-red-700", label: "Vencido" },
      CANCELLED: { bg: "bg-slate-100", text: "text-slate-700", label: "Cancelado" },
    }
    const config = statusMap[status] || statusMap.PENDING
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    )
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Pagos</h1>
        <p className="text-muted-foreground">Monitorea y confirma pagos de tus arrendatarios</p>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <form className="grid gap-4 md:grid-cols-3" action="/dashboard/pagos" method="GET">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="property">
                Propiedad
              </label>
              <select
                id="property"
                name="property"
                defaultValue={filterPropertyId ?? ""}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="">Todas</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.address}
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
                <option value="ONTIME">Al día (Pagados)</option>
                <option value="LATE">Atrasados / Pendientes</option>
              </select>
            </div>

            <div className="md:col-span-3 flex gap-3 pt-1">
              <Button type="submit" className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90">
                Aplicar filtros
              </Button>
              {(filterPropertyId || statusFilter !== "ALL" || behaviorFilter !== "ALL") && (
                <Button variant="outline" className="border-border" asChild>
                  <Link href="/dashboard/pagos">Limpiar</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

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
                <p className="text-2xl font-bold text-foreground money font-mono">
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
                <p className="text-2xl font-bold text-foreground money font-mono">
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
                <p className="text-2xl font-bold text-foreground money font-mono">
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
                  Sin pagos registrados
                </h3>
                <p className="text-[#9C8578] mb-8 max-w-md mx-auto">
                  Los pagos aparecerán aquí una vez que configures una propiedad con arrendatario.
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
                      <td className="py-4 px-2 text-right font-medium text-foreground money">
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
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              asChild
                            >
                              <Link href={`/api/payments/${payment.id}/confirm`}>
                                Confirmar
                              </Link>
                            </Button>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setPage(page + 1)}
                variant="outline"
                className="border-border text-foreground"
              >
                Ver más
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
