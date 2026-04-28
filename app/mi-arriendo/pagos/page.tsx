'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { PaymentModal } from '@/components/payment/payment-modal'
import { getUserIdentity } from '@/lib/identity-documents'

// Format Chilean pesos
function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount)
}

interface Payment {
  id: string
  month: number
  year: number
  amountCLP: number
  totalCLP?: number
  serviceTotalCLP?: number
  serviceItems?: Array<{
    label: string
    amount: number
    billUrl?: string | null
  }>
  water: number
  electricity: number
  gas?: number
  garbage?: number
  commonExpenses?: number
  other?: number
  otherLabel?: string | null
  status: string
  receipt?: string | null
  createdAt?: string
}

interface PaymentSummary {
  currentMonthDueCLP: number
  currentMonthLabel: string | null
  totalOutstandingCLP: number
  overdueBalanceCLP: number
  paymentsPendingCount: number
  paymentsProcessingCount: number
}

interface SecurityDeposit {
  amountCLP: number
  status: string
  receivedAt?: string | null
  returnedAt?: string | null
  returnedAmountCLP?: number | null
  deductionsCLP?: number | null
  deductionNotes?: string | null
}

interface PropertyInfo {
  id: string
  monthlyRent: number
  landlord: {
    bankName: string
    bankAccountType: string
    bankAccountNumber: string
    rut?: string
    documentType?: string | null
    documentNumber?: string | null
    documentNumberNormalized?: string | null
    name?: string
    bankEmail?: string
  }
}

export default function TenantPagosPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [property, setProperty] = useState<PropertyInfo | null>(null)
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [securityDeposit, setSecurityDeposit] = useState<SecurityDeposit | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get payments and property info from API
        const [paymentsRes, propertyRes] = await Promise.all([
          fetch('/api/payments?tenant=true'),
          fetch('/api/properties/current'),
        ])

        if (paymentsRes.ok) {
          const data = await paymentsRes.json()
          if (Array.isArray(data)) {
            setPayments(data)
          } else {
            setPayments(Array.isArray(data.payments) ? data.payments : [])
            setPaymentSummary(data.summary ?? null)
            setSecurityDeposit(data.securityDeposit ?? null)
          }
        }

        if (propertyRes.ok) {
          const data = await propertyRes.json()
          setProperty(data)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statusConfig = {
    PAID: { label: 'Pagado', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    PENDING: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700', icon: Clock },
    OVERDUE: { label: 'Atrasado', className: 'bg-red-100 text-red-700', icon: AlertTriangle },
    PROCESSING: { label: 'En revisión', className: 'bg-blue-100 text-blue-700', icon: Clock },
  }

  const getMonthName = (month: number) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return months[month - 1]
  }

  const getTotal = (payment: Payment) => {
    return payment.totalCLP ?? payment.amountCLP + (payment.serviceTotalCLP ?? 0)
  }

  const payablePayments = payments.filter(
    (payment) => payment.status === 'PENDING' || payment.status === 'OVERDUE'
  )
  const pendingPayment = payablePayments[0] ?? null
  const landlordIdentity = property ? getUserIdentity(property.landlord) : { label: 'Documento', value: '' }
  const securityDepositBalance = securityDeposit
    ? securityDeposit.status === 'RETURNED_FULL'
      ? 0
      : Math.max(
          0,
          securityDeposit.amountCLP -
            (securityDeposit.returnedAmountCLP ?? 0) -
            (securityDeposit.deductionsCLP ?? 0)
        )
    : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Pagos</h1>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Cargando información de pagos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mis Pagos</h1>
        <p className="text-muted-foreground">Historial de pagos y pagos pendientes</p>
      </div>

      {/* Current Payment */}
      {pendingPayment && (
        <Card className="bg-[#2A2520] border-border border-l-4 border-l-[#C27F79]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">
                Pago Pendiente - {getMonthName(pendingPayment.month)} {pendingPayment.year}
              </CardTitle>
              <Badge className={pendingPayment.status === 'OVERDUE' ? 'bg-[#C27F79]/20 text-[#C27F79]' : 'bg-[#F2C94C]/20 text-[#F2C94C]'}>
                <Clock className="h-3 w-3 mr-1" />
                {pendingPayment.status === 'OVERDUE' ? 'Atrasado' : 'Pendiente'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Arriendo</p>
                <p className="font-semibold text-foreground font-mono">
                  {formatCLP(property?.monthlyRent || 0)}
                </p>
              </div>
              {(pendingPayment.serviceItems || []).slice(0, 3).map((item) => (
                <div key={item.label}>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-semibold text-foreground font-mono">
                    {formatCLP(item.amount)}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-[#5E8B8C]">
                  {formatCLP(getTotal(pendingPayment))}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                {paymentSummary?.totalOutstandingCLP ? (
                  <p className="text-sm text-muted-foreground">
                    Total pendiente acumulado:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCLP(paymentSummary.totalOutstandingCLP)}
                    </span>
                  </p>
                ) : null}
                {paymentSummary?.paymentsPendingCount && paymentSummary.paymentsPendingCount > 1 ? (
                  <p className="text-xs text-[#C27F79]">
                    Tienes {paymentSummary.paymentsPendingCount} meses pendientes. Puedes ir regularizándolos uno por uno.
                  </p>
                ) : null}
              </div>
              <Button
                className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
                onClick={() => {
                  setSelectedPayment(pendingPayment)
                  setIsPaymentOpen(true)
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar {getMonthName(pendingPayment.month)} {pendingPayment.year}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pagar este mes</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {formatCLP(paymentSummary?.currentMonthDueCLP ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {paymentSummary?.currentMonthLabel
                ? `Corresponde a ${paymentSummary.currentMonthLabel}`
                : 'Sin cargo pendiente actual'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total pendiente</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {formatCLP(paymentSummary?.totalOutstandingCLP ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {paymentSummary?.paymentsPendingCount
                ? `${paymentSummary.paymentsPendingCount} mes(es) por regularizar`
                : 'Sin deuda acumulada'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pagos en revisión</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {paymentSummary?.paymentsProcessingCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Comprobantes enviados pendientes de confirmación
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Saldo de garantía</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {formatCLP(securityDepositBalance)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {securityDeposit
                ? securityDeposit.status === 'HELD'
                  ? 'Garantía retenida vigente'
                  : `Estado: ${securityDeposit.status}`
                : 'Aún no hay garantía registrada'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay pagos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mes</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Arriendo</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Servicios</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Estado</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Comprobante</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const status = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.PENDING
                    const StatusIcon = status.icon
                    return (
                      <tr 
                        key={payment.id} 
                        className={`border-b border-border ${
                          payment.status === 'PENDING' || payment.status === 'OVERDUE' ? 'bg-muted/30' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <p className="font-medium text-foreground">
                            {getMonthName(payment.month)} {payment.year}
                          </p>
                          {payment.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.createdAt).toLocaleDateString('es-CL')}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right text-foreground">
                          {formatCLP(payment.amountCLP)}
                        </td>
                        <td className="py-4 px-4 text-right text-foreground">
                          {formatCLP(payment.serviceTotalCLP ?? 0)}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-foreground">
                          {formatCLP(getTotal(payment))}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={status.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {payment.receipt ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[#5E8B8C]"
                              asChild
                            >
                              <a href={payment.receipt} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {(payment.status === 'PENDING' || payment.status === 'OVERDUE') ? (
                            <Button
                              size="sm"
                              className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
                              onClick={() => {
                                setSelectedPayment(payment)
                                setIsPaymentOpen(true)
                              }}
                            >
                              Pagar {getMonthName(payment.month)}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#5E8B8C]/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-[#5E8B8C]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Transferencia bancaria</h3>
                <p className="text-sm text-muted-foreground">
                  Realiza una transferencia bancaria e incluye tu documento en el mensaje
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {property && selectedPayment && (
        <PaymentModal 
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false)
            setSelectedPayment(null)
          }}
          onSuccess={() => {
            setIsPaymentOpen(false)
            // Refresh payments list
            window.location.reload()
          }}
          payment={{
            id: selectedPayment.id,
            month: getMonthName(selectedPayment.month),
            year: selectedPayment.year,
            amountCLP: selectedPayment.amountCLP,
            water: selectedPayment.water,
            electricity: selectedPayment.electricity,
            gas: selectedPayment.gas,
            serviceItems: selectedPayment.serviceItems,
          }}
          bankDetails={{
            bank: property.landlord.bankName,
            accountType: property.landlord.bankAccountType,
            accountNumber: property.landlord.bankAccountNumber,
            documentLabel: landlordIdentity.label,
            documentNumber: landlordIdentity.value || '',
            ownerName: property.landlord.name || '',
            email: property.landlord.bankEmail || '',
          }}
        />
      )}
    </div>
  )
}
