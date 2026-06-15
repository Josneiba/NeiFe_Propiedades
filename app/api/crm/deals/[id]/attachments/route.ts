import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await paramsPromise
  const brokerId = session.user.id

  // Verificar que el deal pertenece al broker
  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    select: { brokerId: true },
  })

  if (!deal || deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const attachments = await prisma.crmDealAttachment.findMany({
    where: { dealId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(attachments)
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await paramsPromise
  const brokerId = session.user.id
  const body = await request.json()

  const { fileName, fileUrl, fileSize, mimeType } = body

  if (!fileName || !fileUrl) {
    return NextResponse.json(
      { error: 'fileName y fileUrl requeridos' },
      { status: 400 }
    )
  }

  // Verificar que el deal pertenece al broker
  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    select: { brokerId: true },
  })

  if (!deal || deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const attachment = await prisma.crmDealAttachment.create({
    data: {
      dealId: id,
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      mimeType,
      uploadedBy: brokerId,
    },
  })

  return NextResponse.json(attachment)
}
