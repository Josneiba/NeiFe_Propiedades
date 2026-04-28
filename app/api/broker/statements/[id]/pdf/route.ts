import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { generateBrokerStatementPdf } from '@/lib/generate-broker-statement-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params

  const statement = await prisma.brokerStatement.findUnique({
    where: { id },
    include: {
      broker: { select: { id: true, name: true, email: true } },
      landlord: { select: { id: true, name: true, email: true } },
      property: { select: { address: true, commune: true, name: true } },
      items: true,
    },
  })

  if (!statement) {
    return NextResponse.json({ error: 'Rendicion no encontrada' }, { status: 404 })
  }

  const canAccess =
    statement.brokerId === session.user.id || statement.landlordId === session.user.id

  if (!canAccess) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const pdf = generateBrokerStatementPdf({
    statementId: statement.id,
    brokerName: statement.broker.name || statement.broker.email,
    landlordName: statement.landlord.name || statement.landlord.email,
    propertyLabel: statement.property.name || `${statement.property.address}, ${statement.property.commune}`,
    month: statement.month,
    year: statement.year,
    grossIncomeCLP: statement.grossIncomeCLP,
    brokerCommissionCLP: statement.brokerCommissionCLP,
    maintenanceCLP: statement.maintenanceCLP,
    otherDeductionsCLP: statement.otherDeductionsCLP,
    netTransferCLP: statement.netTransferCLP,
    transferReference: statement.transferReference,
    transferDate: statement.transferDate,
    notes: statement.notes,
    items: statement.items.map((item) => ({
      label: item.label,
      amountCLP: item.amountCLP,
    })),
  })

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="rendicion-${statement.month}-${statement.year}.pdf"`,
    },
  })
}
