// app/api/crm/deals/[id]/contacts/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { CrmDealRole } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const body = await request.json()
  const { contactId, role, isPrimary } = body

  if (!contactId || !role) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: contactId, role' },
      { status: 400 }
    )
  }

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
    const link = await prisma.crmDealContact.create({
      data: {
        dealId: params.id,
        contactId,
        role: role as CrmDealRole,
        isPrimary: isPrimary ?? false,
      },
      include: { contact: true },
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El contacto ya está vinculado a este deal' },
        { status: 409 }
      )
    }
    console.error('Error linking contact:', error)
    return NextResponse.json(
      { error: 'Error al vincular contacto' },
      { status: 500 }
    )
  }
}
