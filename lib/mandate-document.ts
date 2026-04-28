import { createHash } from 'crypto'
import jsPDF from 'jspdf'

export type MandateDocumentSnapshot = {
  version: 1
  mandateId: string
  documentNumber: string
  generatedAt: string
  status: string
  property: {
    id: string
    name: string | null
    address: string
    commune?: string | null
    region?: string | null
  }
  owner: {
    id: string
    name: string
    email: string
  }
  broker: {
    id: string
    name: string
    email: string
    company?: string | null
  }
  terms: {
    startsAt?: string | null
    expiresAt?: string | null
    commissionRate?: number | null
    commissionType?: string | null
    notes?: string | null
  }
  signatures: {
    owner: {
      signed: boolean
      name: string
      signedAt?: string | null
    }
    broker: {
      signed: boolean
      name: string
      signedAt?: string | null
    }
  }
  legal: {
    title: string
    statement: string
  }
}

type SnapshotInput = {
  id: string
  status: string
  createdAt?: Date | string
  startsAt?: Date | null
  expiresAt?: Date | null
  commissionRate?: number | null
  commissionType?: string | null
  notes?: string | null
  signedByOwner: boolean
  signedByBroker: boolean
  ownerSignedAt?: Date | null
  brokerSignedAt?: Date | null
  documentNumber?: string | null
  property: {
    id: string
    name: string | null
    address: string
    commune?: string | null
    region?: string | null
  }
  owner: {
    id: string
    name: string | null
    email: string
  }
  broker: {
    id: string
    name: string | null
    email: string
    company?: string | null
  }
}

function formatIso(value?: Date | string | null) {
  if (!value) return null
  return new Date(value).toISOString()
}

export function buildMandateDocumentNumber(mandateId: string, createdAt?: Date | string) {
  const date = createdAt ? new Date(createdAt) : new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `MND-${y}${m}-${mandateId.slice(-6).toUpperCase()}`
}

export function buildMandateDocumentSnapshot(
  mandate: SnapshotInput
): MandateDocumentSnapshot {
  return {
    version: 1,
    mandateId: mandate.id,
    documentNumber:
      mandate.documentNumber || buildMandateDocumentNumber(mandate.id, mandate.createdAt),
    generatedAt: new Date().toISOString(),
    status: mandate.status,
    property: {
      id: mandate.property.id,
      name: mandate.property.name,
      address: mandate.property.address,
      commune: mandate.property.commune,
      region: mandate.property.region,
    },
    owner: {
      id: mandate.owner.id,
      name: mandate.owner.name || mandate.owner.email,
      email: mandate.owner.email,
    },
    broker: {
      id: mandate.broker.id,
      name: mandate.broker.name || mandate.broker.email,
      email: mandate.broker.email,
      company: mandate.broker.company,
    },
    terms: {
      startsAt: formatIso(mandate.startsAt),
      expiresAt: formatIso(mandate.expiresAt),
      commissionRate: mandate.commissionRate ?? null,
      commissionType: mandate.commissionType ?? null,
      notes: mandate.notes ?? null,
    },
    signatures: {
      owner: {
        signed: mandate.signedByOwner,
        name: mandate.owner.name || mandate.owner.email,
        signedAt: formatIso(mandate.ownerSignedAt),
      },
      broker: {
        signed: mandate.signedByBroker,
        name: mandate.broker.name || mandate.broker.email,
        signedAt: formatIso(mandate.brokerSignedAt),
      },
    },
    legal: {
      title: 'Mandato de administración inmobiliaria digital',
      statement:
        'Las partes acuerdan la administración de la propiedad indicada, con trazabilidad digital de firmas, comisiones, vigencia y responsables operativos dentro de NeiFe.',
    },
  }
}

export function buildMandateDocumentHash(snapshot: MandateDocumentSnapshot) {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')
}

function formatDate(value?: string | null) {
  if (!value) return 'No definida'
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatCommission(snapshot: MandateDocumentSnapshot) {
  if (snapshot.terms.commissionRate == null) return 'No definida'
  const type =
    snapshot.terms.commissionType === 'ONE_TIME'
      ? 'única vez'
      : snapshot.terms.commissionType === 'ANNUAL'
        ? 'anual'
        : 'mensual'
  return `${snapshot.terms.commissionRate}% (${type})`
}

function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, width: number) {
  const lines = pdf.splitTextToSize(text, width)
  pdf.text(lines, x, y)
  return y + lines.length * 16
}

export function generateMandatePdf(snapshot: MandateDocumentSnapshot) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  })

  const hash = buildMandateDocumentHash(snapshot)
  const margin = 48
  const contentWidth = 500
  let y = 56

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('NeiFe', margin, y)
  y += 26

  pdf.setFontSize(16)
  pdf.text(snapshot.legal.title, margin, y)
  y += 22

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Documento: ${snapshot.documentNumber}`, margin, y)
  pdf.text(`Hash: ${hash}`, margin + 250, y)
  y += 20

  pdf.setDrawColor(180, 180, 180)
  pdf.line(margin, y, margin + contentWidth, y)
  y += 24

  pdf.setFontSize(11)
  y = addWrappedText(pdf, snapshot.legal.statement, margin, y, contentWidth)
  y += 16

  pdf.setFont('helvetica', 'bold')
  pdf.text('Propiedad', margin, y)
  y += 16
  pdf.setFont('helvetica', 'normal')
  y = addWrappedText(
    pdf,
    `${snapshot.property.name || snapshot.property.address} · ${snapshot.property.address}, ${snapshot.property.commune || ''} ${snapshot.property.region || ''}`.trim(),
    margin,
    y,
    contentWidth
  )
  y += 12

  pdf.setFont('helvetica', 'bold')
  pdf.text('Partes', margin, y)
  y += 16
  pdf.setFont('helvetica', 'normal')
  y = addWrappedText(
    pdf,
    `Propietario: ${snapshot.owner.name} (${snapshot.owner.email})`,
    margin,
    y,
    contentWidth
  )
  y = addWrappedText(
    pdf,
    `Corredor: ${snapshot.broker.name} (${snapshot.broker.email})${snapshot.broker.company ? ` · ${snapshot.broker.company}` : ''}`,
    margin,
    y,
    contentWidth
  )
  y += 12

  pdf.setFont('helvetica', 'bold')
  pdf.text('Términos del mandato', margin, y)
  y += 16
  pdf.setFont('helvetica', 'normal')
  y = addWrappedText(pdf, `Inicio: ${formatDate(snapshot.terms.startsAt)}`, margin, y, contentWidth)
  y = addWrappedText(pdf, `Término: ${formatDate(snapshot.terms.expiresAt)}`, margin, y, contentWidth)
  y = addWrappedText(pdf, `Comisión: ${formatCommission(snapshot)}`, margin, y, contentWidth)
  y = addWrappedText(
    pdf,
    `Notas: ${snapshot.terms.notes || 'Sin observaciones adicionales.'}`,
    margin,
    y,
    contentWidth
  )
  y += 18

  pdf.setFont('helvetica', 'bold')
  pdf.text('Firmas registradas', margin, y)
  y += 18
  pdf.setFont('helvetica', 'normal')
  y = addWrappedText(
    pdf,
    `Propietario: ${snapshot.signatures.owner.signed ? `Firmado por ${snapshot.signatures.owner.name} el ${formatDate(snapshot.signatures.owner.signedAt)}` : 'Pendiente de firma'}`,
    margin,
    y,
    contentWidth
  )
  y = addWrappedText(
    pdf,
    `Corredor: ${snapshot.signatures.broker.signed ? `Firmado por ${snapshot.signatures.broker.name} el ${formatDate(snapshot.signatures.broker.signedAt)}` : 'Pendiente de firma'}`,
    margin,
    y,
    contentWidth
  )
  y += 18

  pdf.setFontSize(9)
  pdf.setTextColor(90, 90, 90)
  addWrappedText(
    pdf,
    `Documento generado por NeiFe el ${formatDate(snapshot.generatedAt)}. Esta evidencia representa la aceptación digital registrada dentro de la plataforma y su integridad puede validarse con el hash indicado.`,
    margin,
    y,
    contentWidth
  )

  return Buffer.from(pdf.output('arraybuffer'))
}
