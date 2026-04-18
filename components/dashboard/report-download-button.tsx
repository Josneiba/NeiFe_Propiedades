'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import dynamic from 'next/dynamic'

interface ReportData {
  property: {
    address: string
    name?: string
    commune: string
    monthlyRentCLP?: number
    tenant?: { name: string }
  }
  currentPayment?: {
    status: string
    amountCLP: number
    paidDate?: string
  }
  services: Array<{
    name: string
    consumo?: number
    unit?: string
    amountCLP: number
  }>
  maintenance: Array<{
    description?: string
    status: string
  }>
  activeBroker?: {
    name?: string
    email: string
    company?: string
  }
  monthName: string
  currentMonth: number
  currentYear: number
}

interface ReportDownloadButtonProps {
  data: ReportData
}

const statusConfig: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Atrasado',
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function ReportDownloadButton({ data }: ReportDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      
      // Load jsPDF only on client-side, dynamically
      if (typeof window === 'undefined') {
        throw new Error('PDF generation is only available on the client side')
      }
      
      // Use dynamic import to avoid SSR issues
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF()

      // Header
      doc.setFontSize(18)
      doc.text('NeiFe - Reporte Mensual', 20, 20)

      doc.setFontSize(12)
      doc.text(`Mes: ${data.monthName}`, 20, 30)
      doc.text(`Propiedad: ${data.property.name || data.property.address || ''}`, 20, 38)
      doc.text(`Dirección: ${data.property.address || ''}, ${data.property.commune || ''}`, 20, 46)

      let yPos = 56

      // Propiedad Info
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Información de la Propiedad', 20, yPos)
      yPos += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Arrendatario: ${data.property.tenant?.name || 'Sin asignado'}`, 20, yPos)
      yPos += 6
      doc.text(
        `Arriendo Mensual: ${
          data.property.monthlyRentCLP
            ? formatCLP(data.property.monthlyRentCLP)
            : 'No especificado'
        }`,
        20,
        yPos
      )
      yPos += 6
      if (data.activeBroker) {
        doc.text(
          `Administrador: ${data.activeBroker.name || data.activeBroker.email || ''}${
            data.activeBroker.company ? ` (${data.activeBroker.company})` : ''
          }`,
          20,
          yPos
        )
        yPos += 6
      }

      // Pago
      yPos += 4
      doc.setFont('helvetica', 'bold')
      doc.text('Estado de Pago', 20, yPos)
      yPos += 8

      doc.setFont('helvetica', 'normal')
      if (data.currentPayment) {
        doc.text(
          `Estado: ${statusConfig[data.currentPayment.status] || 'Desconocido'}`,
          20,
          yPos
        )
        yPos += 6
        doc.text(`Monto: ${formatCLP(data.currentPayment.amountCLP)}`, 20, yPos)
        yPos += 6
        if (data.currentPayment.paidDate) {
          doc.text(
            `Fecha de Pago: ${new Date(data.currentPayment.paidDate).toLocaleDateString('es-CL')}`,
            20,
            yPos
          )
          yPos += 6
        }
      } else {
        doc.text('Sin movimientos este mes', 20, yPos)
        yPos += 6
      }

      // Servicios
      if (data.services.length > 0) {
        yPos += 4
        doc.setFont('helvetica', 'bold')
        doc.text('Servicios Consumidos', 20, yPos)
        yPos += 8

        doc.setFont('helvetica', 'normal')
        data.services.forEach((service) => {
          doc.text(
            `${service.name}: ${
              service.consumo ? `${service.consumo} ${service.unit || ''}` : 'Sin datos'
            } - ${formatCLP(service.amountCLP)}`,
            20,
            yPos
          )
          yPos += 6
        })
      }

      // Mantenciones
      if (data.maintenance.length > 0) {
        yPos += 4
        doc.setFont('helvetica', 'bold')
        doc.text('Mantenciones Activas', 20, yPos)
        yPos += 8

        doc.setFont('helvetica', 'normal')
        data.maintenance.slice(0, 5).forEach((maint) => {
          doc.text(
            `• ${maint.description || 'Sin descripción'} (${maint.status || ''})`,
            20,
            yPos
          )
          yPos += 6
          if (yPos > 280) {
            doc.addPage()
            yPos = 20
          }
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      doc.save(
        `reporte-${data.property.address.replace(/\s+/g, '-')}-${data.currentMonth}-${data.currentYear}.pdf`
      )
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
      onClick={handleDownload}
      disabled={isLoading}
    >
      <Download className="h-4 w-4 mr-2" />
      {isLoading ? 'Generando...' : 'Descargar PDF'}
    </Button>
  )
}
