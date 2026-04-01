import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
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

export default async function PagosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD") redirect("/dashboard")

  // Get all payments for this landlord's properties
  const payments = (await prisma.payment.findMany({
    where: {
      property: {
        landlordId: session.user.id,
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
  })) as PaymentWithProperty[]

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
                <p className="text-2xl font-bold text-foreground">
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
                <p className="text-2xl font-bold text-foreground">
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
                <p className="text-2xl font-bold text-foreground">
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
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay pagos registrados aún</p>
            </div>
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
                      <td className="py-4 px-2 text-right font-mono font-medium text-foreground">
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
        </CardContent>
      </Card>
    </div>
  )
}
