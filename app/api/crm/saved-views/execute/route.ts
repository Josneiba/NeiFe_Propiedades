import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { executeSavedView, ensureStandardSavedViews } from '@/lib/crm-saved-views'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  try {
    const body = await request.json()
    await ensureStandardSavedViews(prisma, session.user.id)
    const result = await executeSavedView(prisma, session.user.id, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'No se pudo ejecutar la vista' }, { status: 500 })
  }
}
