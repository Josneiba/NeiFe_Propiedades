import jsPDF from 'jspdf'

const MONTH_NAMES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function formatCLP(amount: number) {
  return `$${amount.toLocaleString('es-CL')}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export interface MonthlyReportData {
  landlordName: string
  month: number
  year: number
  generatedAt: Date
  summary: {
    totalCollectedCLP: number
    occupancyRate: number
    collectionRate: number
    totalProperties: number
    rentedProperties: number
  }
  properties: Array<{
    address: string
    commune: string
    tenantName: string | null
    amountCLP: number
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'NO_TENANT'
    contractEndDate: Date | null
    daysUntilExpiry: number | null
  }>
  activeMaintenance: Array<{
    propertyAddress: string
    description: string
    status: string
    category: string
  }>
  expiringContracts: Array<{
    propertyAddress: string
    daysUntilExpiry: number
    tenantName: string | null
  }>
  projectedNextMonthCLP: number
}

export async function generateMonthlyReportPDF(data: MonthlyReportData): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  const contentWidth = pageWidth - margin * 2

  const headerHeight = 110
  doc.setFillColor(45, 60, 60)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor('#FAF6F2')
  doc.text('NeiFe.', margin, 50)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#D5C3B6')
  doc.text(`Resumen Mensual — ${MONTH_NAMES[data.month]} ${data.year}`, margin, 72)

  doc.setFontSize(9)
  doc.setTextColor('#FAF6F2')
  doc.text(`Preparado para: ${data.landlordName}`, margin, 92)
  doc.text(`Generado el: ${formatDate(data.generatedAt)}`, margin, 106)

  doc.setDrawColor('#D5C3B6')
  doc.setLineWidth(0.5)
  doc.line(margin, headerHeight + 5, pageWidth - margin, headerHeight + 5)

  let y = headerHeight + 25

  const cardWidth = (contentWidth - 24) / 3
  const cardHeight = 72
  const cards = [
    {
      label: 'Recaudado',
      value: formatCLP(data.summary.totalCollectedCLP),
      detail: `${data.summary.totalProperties} propiedades`,
    },
    {
      label: 'Ocupación',
      value: `${data.summary.occupancyRate}%`,
      detail: `${data.summary.rentedProperties} arrendadas`,
    },
    {
      label: 'Cobrado %',
      value: `${data.summary.collectionRate}%`,
      detail: 'del total arrendado',
    },
  ]

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 12)
    doc.setDrawColor('#D5C3B6')
    doc.setLineWidth(0.8)
    doc.rect(x, y, cardWidth, cardHeight)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#9C8578')
    doc.text(card.label, x + 12, y + 18)

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor('#1C1917')
    doc.text(card.value, x + 12, y + 43)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#9C8578')
    doc.text(card.detail, x + 12, y + 58)
  })

  y += cardHeight + 30

  const sectionHeader = (title: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor('#FAF6F2')
    doc.text(title, margin, y)
    y += 14
    doc.setDrawColor('#D5C3B6')
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 16
  }

  const addPageIfNeeded = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 100) {
      doc.addPage()
      y = margin
    }
  }

  sectionHeader('Detalle por propiedad')

  const tableHeaders = ['Propiedad', 'Arrendatario', 'Renta', 'Estado']
  const colWidths = [contentWidth * 0.40, contentWidth * 0.25, contentWidth * 0.18, contentWidth * 0.17]
  const rowHeight = 18

  doc.setFillColor(45, 60, 60)
  doc.rect(margin, y, contentWidth, rowHeight, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#FAF6F2')

  let cellX = margin + 4
  tableHeaders.forEach((header, index) => {
    doc.text(header, cellX, y + 12)
    cellX += colWidths[index]
  })

  y += rowHeight

  data.properties.forEach((property, index) => {
    addPageIfNeeded(rowHeight + 4)
    const rowTop = y
    doc.setFillColor(index % 2 === 0 ? '#FAF6F2' : '#F5EFE9')
    doc.rect(margin, rowTop, contentWidth, rowHeight, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor('#1C1917')

    const propertyLabel = `${property.address} · ${property.commune}`
    const textLines = doc.splitTextToSize(propertyLabel, colWidths[0] - 8)
    doc.text(textLines, margin + 4, rowTop + 12)

    doc.text(property.tenantName || 'Sin arrendatario', margin + 4 + colWidths[0], rowTop + 12)
    doc.text(formatCLP(property.amountCLP), margin + 4 + colWidths[0] + colWidths[1], rowTop + 12)

    const statusLabels: Record<string, string> = {
      PAID: 'PAGADO',
      PENDING: 'PENDIENTE',
      OVERDUE: 'ATRASADO',
      NO_TENANT: 'SIN TENANT',
    }
    const statusColors: Record<string, string> = {
      PAID: '#5E8B8C',
      PENDING: '#F2C94C',
      OVERDUE: '#C27F79',
      NO_TENANT: '#9C8578',
    }
    const statusText = statusLabels[property.paymentStatus]
    doc.setTextColor(statusColors[property.paymentStatus] ?? '#9C8578')
    doc.text(statusText, margin + 4 + colWidths[0] + colWidths[1] + colWidths[2], rowTop + 12)

    y += rowHeight
  })

  y += 18
  sectionHeader('Mantenciones activas')
  addPageIfNeeded(60)

  if (data.activeMaintenance.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor('#9C8578')
    doc.text('No hay mantenciones activas este mes.', margin + 4, y)
    y += 18
  } else {
    data.activeMaintenance.forEach((item) => {
      addPageIfNeeded(32)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor('#1C1917')
      doc.text(`• ${item.propertyAddress} — ${item.description}`, margin + 4, y)
      y += 12
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor('#9C8578')
      doc.text(`${item.category} · ${item.status}`, margin + 16, y)
      y += 16
    })
  }

  sectionHeader('Contratos por vencer')
  addPageIfNeeded(60)

  if (data.expiringContracts.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor('#9C8578')
    doc.text('No hay contratos próximos a vencer en los próximos 60 días.', margin + 4, y)
    y += 18
  } else {
    data.expiringContracts.forEach((contract) => {
      addPageIfNeeded(32)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor('#1C1917')
      doc.text(`• ${contract.propertyAddress}`, margin + 4, y)
      y += 12
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor('#9C8578')
      doc.text(`Vence en ${contract.daysUntilExpiry} días · ${contract.tenantName || 'Sin arrendatario'}`, margin + 16, y)
      y += 16
    })
  }

  sectionHeader('Proyección próximo mes')
  addPageIfNeeded(44)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor('#FAF6F2')
  doc.text(`Ingresos esperados: ${formatCLP(data.projectedNextMonthCLP)}`, margin + 4, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#9C8578')
  doc.text('Basado en arriendos activos y contratos vigentes.', margin + 4, y)

  const footerHeight = 40
  doc.setFillColor(28, 25, 23)
  doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#9C8578')
  doc.text('NeiFe · neife.cl · Generado automáticamente', margin, pageHeight - 18)
  doc.text('Cumple Ley 18.101 · Ley 19.628', pageWidth - margin, pageHeight - 18, {
    align: 'right',
  })

  const buffer = await doc.output('arraybuffer')
  return Buffer.from(buffer)
}
