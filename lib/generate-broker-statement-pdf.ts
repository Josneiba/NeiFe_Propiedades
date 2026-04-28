import jsPDF from 'jspdf'

export interface BrokerStatementPdfData {
  statementId: string
  brokerName: string
  landlordName: string
  propertyLabel: string
  month: number
  year: number
  grossIncomeCLP: number
  brokerCommissionCLP: number
  maintenanceCLP: number
  otherDeductionsCLP: number
  netTransferCLP: number
  transferReference?: string | null
  transferDate?: Date | null
  notes?: string | null
  items: Array<{
    label: string
    amountCLP: number
  }>
}

const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatCLP(amount: number) {
  return `$${amount.toLocaleString('es-CL')}`
}

export function generateBrokerStatementPdf(data: BrokerStatementPdfData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const margin = 18

  doc.setFillColor(45, 60, 60)
  doc.rect(0, 0, pageWidth, 34, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(250, 246, 242)
  doc.text('RENDICION MENSUAL DEL CORREDOR', margin, 16)
  doc.setFontSize(9)
  doc.setTextColor(213, 195, 182)
  doc.text(`NeiFe - ${MONTH_NAMES[data.month]} ${data.year}`, margin, 24)

  let y = 48

  const field = (label: string, value: string) => {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(130, 130, 130)
    doc.text(label.toUpperCase(), margin, y)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(value, margin, y + 6)
    y += 14
  }

  field('Propiedad', data.propertyLabel)
  field('Corredor', data.brokerName)
  field('Propietario', data.landlordName)

  doc.setDrawColor(213, 195, 182)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  const summaryRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)
    doc.text(label, margin, y)
    doc.text(value, pageWidth - margin, y, { align: 'right' })
    y += 8
  }

  summaryRow('Arriendo cobrado', formatCLP(data.grossIncomeCLP), true)
  summaryRow('Comision corredor', `-${formatCLP(data.brokerCommissionCLP)}`)
  summaryRow('Mantenciones descontadas', `-${formatCLP(data.maintenanceCLP)}`)
  summaryRow('Otros descuentos', `-${formatCLP(data.otherDeductionsCLP)}`)

  if (data.items.length > 0) {
    y += 4
    doc.setFontSize(9)
    doc.setTextColor(130, 130, 130)
    doc.text('DETALLE DE DESCUENTOS', margin, y)
    y += 7
    data.items.forEach((item) => {
      summaryRow(`- ${item.label}`, `-${formatCLP(item.amountCLP)}`)
    })
  }

  y += 4
  doc.setDrawColor(45, 60, 60)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10
  summaryRow('Monto neto a transferir', formatCLP(data.netTransferCLP), true)

  if (data.transferReference) {
    y += 4
    field('Referencia transferencia', data.transferReference)
  }
  if (data.transferDate) {
    field('Fecha transferencia', data.transferDate.toLocaleDateString('es-CL'))
  }
  if (data.notes) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(130, 130, 130)
    doc.text('NOTAS', margin, y)
    y += 6
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    const lines = doc.splitTextToSize(data.notes, pageWidth - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 4
  }

  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text(`ID de rendicion: ${data.statementId.slice(-8).toUpperCase()}`, margin, 282)
  doc.text('Documento generado en NeiFe', pageWidth - margin, 282, { align: 'right' })

  return doc.output('arraybuffer')
}
