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
  water: number
  electricity: number
  gas?: number
  status: string
  receipt?: string | null
  createdAt?: string
}

interface PropertyInfo {
  id: string
  monthlyRent: number
  landlord: {
    bankName: string
    bankAccountType: string
    bankAccountNumber: string
    rut?: string
    name?: string
    bankEmail?: string
  }
}

export default function TenantPagosPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [property, setProperty] = useState<PropertyInfo | null>(null)
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
          setPayments(Array.isArray(data) ? data : data.payments || [])
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
    const charges = (payment.water || 0) + (payment.electricity || 0) + (payment.gas ?? 0)
    return payment.totalCLP ?? payment.amountCLP + charges
  }

  const pendingPayment = payments.find(p => p.status === 'PENDING' || p.status === 'OVERDUE')

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
              {pendingPayment.water > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Agua</p>
                  <p className="font-semibold text-foreground font-mono">
                    {formatCLP(pendingPayment.water)}
                  </p>
                </div>
              )}
              {pendingPayment.electricity > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Luz</p>
                  <p className="font-semibold text-foreground font-mono">
                    {formatCLP(pendingPayment.electricity)}
                  </p>
                </div>
              )}
              {(pendingPayment.gas ?? 0) > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Gas</p>
                  <p className="font-semibold text-foreground font-mono">
                    {formatCLP(pendingPayment.gas ?? 0)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-[#5E8B8C]">
                  {formatCLP(getTotal(pendingPayment))}
                </p>
              </div>
            </div>
            <Button 
              className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
              onClick={() => {
                setSelectedPayment(pendingPayment)
                setIsPaymentOpen(true)
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pagar ahora
            </Button>
          </CardContent>
        </Card>
      )}

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
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Monto</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Estado</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Comprobante</th>
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
                  Realiza una transferencia bancaria e incluye tu RUT en el mensaje
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
          }}
          bankDetails={{
            bank: property.landlord.bankName,
            accountType: property.landlord.bankAccountType,
            accountNumber: property.landlord.bankAccountNumber,
            rut: property.landlord.rut || '',
            ownerName: property.landlord.name || '',
            email: property.landlord.bankEmail || '',
          }}
        />
      )}
    </div>
  )
}
