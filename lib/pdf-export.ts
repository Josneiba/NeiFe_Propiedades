import { prisma } from '@/lib/prisma'
import { PDFDocument, PDFPage, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

export interface PDFExportOptions {
  includeContacts?: boolean
  includeActivities?: boolean
  includeAttachments?: boolean
  includeHistory?: boolean
  format?: 'compact' | 'detailed'
  color?: boolean
}

/**
 * Generate Deal PDF Report
 */
export async function generateDealPDF(
  dealId: string,
  options: PDFExportOptions = {}
): Promise<Buffer> {
  const deal = await prisma.crmDeal.findUnique({
    where: { id: dealId },
    include: {
      contacts: { include: { contact: true } },
      property: true,
      activities: { orderBy: { createdAt: 'desc' }, take: 10 },
      attachments: true,
    },
  })

  if (!deal) throw new Error('Deal not found')

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  let page = pdfDoc.addPage([595, 842]) // A4 size
  const { height, width } = page.getSize()
  let yPosition = height - 50

  // Header
  page.drawText('Reporte de Negocio', {
    x: 50,
    y: yPosition,
    size: 24,
    color: rgb(0.15, 0.18, 0.18),
  })
  yPosition -= 40

  // Deal Info
  const dealInfo = [
    [`Código: ${deal.code}`, `Fase: ${deal.phase}`],
    [`Título: ${deal.title}`, `Estado: ${deal.status}`],
    [`Valor Estimado: $${(deal.estimatedValue || 0).toLocaleString()}`, `Etapa: ${deal.stage}`],
    [`Fecha Vencimiento: ${deal.dueDate?.toLocaleDateString('es-CL') || 'N/A'}`, `Propiedad: ${deal.property?.address || 'N/A'}`],
  ]

  dealInfo.forEach((row) => {
    row.forEach((text, idx) => {
      page.drawText(text, {
        x: idx === 0 ? 50 : 300,
        y: yPosition,
        size: 10,
        color: rgb(0.37, 0.55, 0.55),
      })
    })
    yPosition -= 25
  })

  yPosition -= 15

  // Contacts section
  if (options.includeContacts && deal.contacts.length > 0) {
    page.drawText('Contactos', {
      x: 50,
      y: yPosition,
      size: 14,
      color: rgb(0.15, 0.18, 0.18),
    })
    yPosition -= 25

    deal.contacts.forEach((dc) => {
      const contactText = `• ${dc.contact.name} (${dc.contact.email || ''}) - ${dc.contact.phone || ''}`
      page.drawText(contactText, {
        x: 70,
        y: yPosition,
        size: 9,
        color: rgb(0.6, 0.53, 0.45),
      })
      yPosition -= 15

      if (yPosition < 50) {
        page = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }
    })

    yPosition -= 10
  }

  // Activities section
  if (options.includeActivities && deal.activities.length > 0) {
    page.drawText('Actividades Recientes', {
      x: 50,
      y: yPosition,
      size: 14,
      color: rgb(0.15, 0.18, 0.18),
    })
    yPosition -= 25

    deal.activities.slice(0, 5).forEach((activity) => {
      const activityText = `• [${activity.type}] ${activity.title || 'Sin título'} - ${activity.createdAt.toLocaleDateString('es-CL')}`
      page.drawText(activityText, {
        x: 70,
        y: yPosition,
        size: 9,
        color: rgb(0.6, 0.53, 0.45),
      })
      yPosition -= 15

      if (yPosition < 50) {
        page = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }
    })

    yPosition -= 10
  }

  // Footer
  yPosition = 30
  page.drawText(`Generado: ${new Date().toLocaleDateString('es-CL')} - NeiFe Propiedades`, {
    x: 50,
    y: yPosition,
    size: 8,
    color: rgb(0.61, 0.53, 0.47),
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

/**
 * Generate Contract PDF Report
 */
export async function generateContractPDF(contractId: string): Promise<Buffer> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      property: true,
    },
  })

  if (!contract) throw new Error('Contract not found')

  const pdfDoc = await PDFDocument.create()

  let page = pdfDoc.addPage([595, 842])
  const { height, width } = page.getSize()
  let yPosition = height - 50

  // Title
  page.drawText('Contrato de Arrendamiento', {
    x: 50,
    y: yPosition,
    size: 20,
    color: rgb(0.15, 0.18, 0.18),
  })
  yPosition -= 40

  // Contract details
  const details = [
    `Propiedad: ${contract.property?.address || 'N/A'}`,
    `Renta UF: ${contract.rentUF || 'N/A'}`,
    `Inicio: ${contract.startDate?.toLocaleDateString('es-CL')}`,
    `Término: ${contract.endDate?.toLocaleDateString('es-CL')}`,
    `Estado: ${contract.status}`,
    `Firmado: ${contract.signedAt?.toLocaleDateString('es-CL') || 'Pendiente'}`,
  ]

  details.forEach((detail) => {
    page.drawText(detail, {
      x: 50,
      y: yPosition,
      size: 11,
      color: rgb(0.37, 0.55, 0.55),
    })
    yPosition -= 20
  })

  yPosition -= 15

  // Contract notes
  if (contract.pdfUrl) {
    page.drawText('Documento de contrato disponible en el sistema', {
      x: 50,
      y: yPosition,
      size: 10,
      color: rgb(0.6, 0.53, 0.45),
    })
    yPosition -= 20
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

/**
 * Generate Broker Statement PDF
 */
export async function generateBrokerStatementPDF(
  brokerId: string,
  startDate: Date,
  endDate: Date
): Promise<Buffer> {
  const deals = await prisma.crmDeal.findMany({
    where: {
      brokerId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { activities: true },
  })

  const contracts = await prisma.contract.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595, 842])
  const { height, width } = page.getSize()
  let yPosition = height - 50

  // Title
  page.drawText('Estado de Corredores', {
    x: 50,
    y: yPosition,
    size: 22,
    color: rgb(0.15, 0.18, 0.18),
  })
  yPosition -= 30

  page.drawText(`Período: ${startDate.toLocaleDateString('es-CL')} - ${endDate.toLocaleDateString('es-CL')}`, {
    x: 50,
    y: yPosition,
    size: 11,
    color: rgb(0.6, 0.53, 0.45),
  })
  yPosition -= 40

  // Summary
  const totalValue = deals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0)
  const totalRent = contracts.reduce((sum, c) => sum + (c.rentUF || 0), 0)

  const summary = [
    `Negocios Creados: ${deals.length}`,
    `Valor Total Estimado: $${totalValue.toLocaleString()}`,
    `Contratos Iniciados: ${contracts.length}`,
    `Renta Total (UF): ${totalRent.toFixed(2)}`,
  ]

  summary.forEach((item) => {
    page.drawText(item, {
      x: 50,
      y: yPosition,
      size: 11,
      color: rgb(0.37, 0.55, 0.55),
    })
    yPosition -= 20
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

/**
 * Generate comparison report PDF
 */
export async function generateComparisonPDF(
  dealIds: string[],
  title: string = 'Análisis Comparativo'
): Promise<Buffer> {
  const deals = await prisma.crmDeal.findMany({
    where: { id: { in: dealIds } },
    include: { contacts: { include: { contact: true } }, property: true },
  })

  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595, 842])
  const { height, width } = page.getSize()
  let yPosition = height - 50

  // Title
  page.drawText(title, {
    x: 50,
    y: yPosition,
    size: 20,
    color: rgb(0.15, 0.18, 0.18),
  })
  yPosition -= 40

  // Table header
  const headers = ['Código', 'Título', 'Valor', 'Fase', 'Contactos']
  const colWidths = [80, 150, 80, 100, 80]
  let xPosition = 50

  headers.forEach((header, idx) => {
    page.drawText(header, {
      x: xPosition,
      y: yPosition,
      size: 10,
      color: rgb(0.85, 0.76, 0.7),
    })
    xPosition += colWidths[idx]
  })

  yPosition -= 25

  // Table rows
  deals.forEach((deal) => {
    xPosition = 50
    const row = [
      deal.code,
      deal.title.substring(0, 20),
      `$${(deal.estimatedValue || 0).toLocaleString()}`,
      deal.phase,
      `${deal.contacts.length}`,
    ]

    row.forEach((cell, idx) => {
      page.drawText(cell, {
        x: xPosition,
        y: yPosition,
        size: 9,
        color: rgb(0.6, 0.53, 0.45),
      })
      xPosition += colWidths[idx]
    })

    yPosition -= 20

    if (yPosition < 50) {
      page = pdfDoc.addPage([595, 842])
      yPosition = height - 50
    }
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

/**
 * Export multiple deals as zip
 */
export async function exportDealsAsZip(
  dealIds: string[],
  format: 'pdf' | 'csv' | 'excel' = 'pdf'
): Promise<Buffer> {
  const deals = await prisma.crmDeal.findMany({
    where: { id: { in: dealIds } },
  })

  if (format === 'csv') {
    return exportDealsAsCSV(deals)
  } else if (format === 'excel') {
    return exportDealsAsExcel(deals)
  }

  // Default PDF export
  const pdfDoc = await PDFDocument.create()
  let pageCount = 0

  for (const deal of deals) {
    const pdf = await generateDealPDF(deal.id, {
      includeContacts: true,
      includeActivities: true,
    })
    pageCount++
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

/**
 * Export deals as CSV
 */
function exportDealsAsCSV(deals: any[]): Buffer {
  const headers = ['Código', 'Título', 'Fase', 'Estado', 'Valor', 'Vencimiento']
  const rows = deals.map((deal) => [
    deal.code,
    deal.title,
    deal.phase,
    deal.status,
    deal.estimatedValue || 0,
    deal.dueDate?.toLocaleDateString('es-CL') || '',
  ])

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return Buffer.from(csv, 'utf-8')
}

/**
 * Export deals as Excel
 */
function exportDealsAsExcel(deals: any[]): Buffer {
  // This would use a library like xlsx or exceljs
  // For now, returning CSV as placeholder
  return exportDealsAsCSV(deals)
}
