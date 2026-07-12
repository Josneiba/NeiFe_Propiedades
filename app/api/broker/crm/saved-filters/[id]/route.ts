import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface SavedFilterRow {
  id: string
  brokerId: string
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const resolvedParams = await (params as Promise<{ id: string }> | { id: string })
  const { id } = resolvedParams

  const existing = await prisma.$queryRaw<SavedFilterRow[]>`
    SELECT id, "brokerId"
    FROM "CrmSavedFilter"
    WHERE id = ${id}
    LIMIT 1
  `

  if (!existing[0] || existing[0].brokerId !== session.user.id) {
    return NextResponse.json({ error: 'Filtro no encontrado' }, { status: 404 })
  }

  await prisma.$executeRaw`
    DELETE FROM "CrmSavedFilter"
    WHERE id = ${id}
  `

  return NextResponse.json({ ok: true })
}
