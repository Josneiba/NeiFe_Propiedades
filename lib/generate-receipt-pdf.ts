import jsPDF from 'jspdf'

interface ReceiptData {
  paymentId: string
  propertyAddress: string
  propertyCommune: string
  landlordName: string
  tenantName: string
  month: number
  year: number
  amountCLP: number
  amountUF: number
  paidAt: Date
  method?: string
  notes?: string
}

const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function generateReceiptPDF(data: ReceiptData): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 24
  const pageWidth = 210

  doc.setFillColor(45, 60, 60)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(250, 246, 242)
  doc.text('COMPROBANTE DE PAGO', margin, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 133, 120)
  doc.text('NeiFe - Gestion de Arriendos', margin, 26)
  doc.text(`N° ${data.paymentId.slice(-8).toUpperCase()}`, pageWidth - margin - 30, 26)

  let y = 55

  doc.setFillColor(94, 139, 140)
  doc.roundedRect(margin, y - 6, 32, 9, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(250, 246, 242)
  doc.text('PAGADO', margin + 7, y)
  y += 12

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(`${monthNames[data.month]} ${data.year}`, margin, y)
  y += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Pagado el ${data.paidAt.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, y)
  y += 14

  doc.setDrawColor(213, 195, 182)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  const row = (label: string, value: string, yPos: number) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(130, 130, 130)
    doc.text(label.toUpperCase(), margin, yPos)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text(value, margin, yPos + 5)
  }

  row('Propiedad', `${data.propertyAddress}, ${data.propertyCommune}`, y); y += 16
  row('Arrendatario', data.tenantName, y); y += 16
  row('Arrendador', data.landlordName, y); y += 16

  doc.line(margin, y, pageWidth - margin, y)
  y += 12

  doc.setFillColor(242, 240, 238)
  doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 24, 3, 3, 'F')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('MONTO PAGADO', margin + 8, y + 5)

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(`$${data.amountCLP.toLocaleString('es-CL')}`, margin + 8, y + 16)

  doc.setFontSize(9)
  doc.setTextColor(130, 130, 130)
  doc.text(`UF ${data.amountUF.toFixed(4)}`, pageWidth - margin - 30, y + 16)

  y += 32

  if (data.method) {
    row('Metodo de pago', data.method, y); y += 16
  }
  if (data.notes) {
    row('Notas', data.notes, y); y += 16
  }

  doc.setFontSize(8)
  doc.setTextColor(170, 170, 170)
  doc.text('Este comprobante es generado automaticamente por NeiFe.', margin, 275)
  doc.text('Para consultas: neife.cl', margin, 280)
  doc.text(new Date().toLocaleDateString('es-CL'), pageWidth - margin - 20, 280)

  return doc.output('blob')
}
