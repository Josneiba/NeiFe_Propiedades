import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, attachmentId } = await paramsPromise
  const brokerId = session.user.id

  // Verificar que el deal pertenece al broker
  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    select: { brokerId: true },
  })

  if (!deal || deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  // Verificar que el attachment pertenece al deal
  const attachment = await prisma.crmDealAttachment.findUnique({
    where: { id: attachmentId },
    select: { dealId: true },
  })

  if (!attachment || attachment.dealId !== id) {
    return NextResponse.json({ error: 'Attachment no encontrado' }, { status: 404 })
  }

  await prisma.crmDealAttachment.delete({
    where: { id: attachmentId },
  })

  return NextResponse.json({ ok: true })
}
