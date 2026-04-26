'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateReceiptPDF } from '@/lib/generate-receipt-pdf'

interface PaymentReceiptDownloadProps {
  payment: {
    id: string
    month: number
    year: number
    amountCLP: number
    amountUF: number
    paidAt: string | null
    createdAt: string
    method: string | null
    notes: string | null
    property: {
      address: string
      commune: string
      tenant: {
        name: string | null
      } | null
    }
  }
  landlordName: string
}

export function PaymentReceiptDownload({
  payment,
  landlordName,
}: PaymentReceiptDownloadProps) {
  const downloadReceipt = () => {
    const blob = generateReceiptPDF({
      paymentId: payment.id,
      propertyAddress: payment.property.address,
      propertyCommune: payment.property.commune,
      landlordName,
      tenantName: payment.property.tenant?.name || 'Arrendatario',
      month: payment.month,
      year: payment.year,
      amountCLP: payment.amountCLP,
      amountUF: payment.amountUF,
      paidAt: new Date(payment.paidAt || payment.createdAt),
      method: payment.method || undefined,
      notes: payment.notes || undefined,
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comprobante-${payment.month}-${payment.year}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-border text-[#5E8B8C] hover:text-[#5E8B8C] hover:bg-[#5E8B8C]/10"
      onClick={downloadReceipt}
      title="Descargar comprobante"
    >
      <Download className="h-4 w-4" />
    </Button>
  )
}
