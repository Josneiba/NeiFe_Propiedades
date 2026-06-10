// app/api/crm/deals/[id]/contacts/[contactId]/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string; contactId: string }> }
) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id

  // Verify deal ownership
  const deal = await prisma.crmDeal.findUnique({
    where: { id: params.id },
    select: { brokerId: true },
  })

  if (!deal) {
    return NextResponse.json(
      { error: 'Operación no encontrada' },
      { status: 404 }
    )
  }

  if (deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  try {
    await prisma.crmDealContact.delete({
      where: {
        dealId_contactId: {
          dealId: params.id,
          contactId: params.contactId,
        },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Vínculo no encontrado' },
        { status: 404 }
      )
    }
    console.error('Error unlinking contact:', error)
    return NextResponse.json(
      { error: 'Error al desvincular contacto' },
      { status: 500 }
    )
  }
}
