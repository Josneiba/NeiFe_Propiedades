import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { generatePublicIdWithPrisma } from '@/lib/public-id'

/**
 * Crea un lead rápido inline y lo adjunta a la oportunidad indicada
 * en una sola operación transaccional.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const {
    name,
    phone,
    email,
    type = 'TENANT',
    budgetMaxCLP,
    desiredCommune,
    notes,
    opportunityId,
  } = body as {
    name?: string
    phone?: string
    email?: string
    type?: 'TENANT' | 'BUYER' | 'INVESTOR'
    budgetMaxCLP?: number
    desiredCommune?: string
    notes?: string
    opportunityId?: string
  }

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 })
  }
  // TODO: Implement lead creation when propertyOpportunity is available in schema
  return NextResponse.json(
    { error: 'Lead creation not yet implemented - schema update pending' },
    { status: 501 }
  )
}
