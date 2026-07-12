import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface SavedFilterRow {
  id: string
  brokerId: string
  name: string
  criteria: unknown
  createdAt: Date
}

// Filtros guardados por el corredor sobre Contactos.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const filters = await prisma.$queryRaw<SavedFilterRow[]>`
    SELECT id, "brokerId", name, criteria, "createdAt"
    FROM "CrmSavedFilter"
    WHERE "brokerId" = ${session.user.id}
    ORDER BY "createdAt" DESC
  `

  return NextResponse.json(filters)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { name, criteria } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'El nombre del filtro es requerido' }, { status: 400 })
  }

  const savedFilter = await prisma.$queryRaw<SavedFilterRow[]>`
    INSERT INTO "CrmSavedFilter" ("brokerId", name, criteria, "createdAt")
    VALUES (${session.user.id}, ${name.trim()}, ${JSON.stringify(criteria ?? {})}::jsonb, NOW())
    RETURNING id, "brokerId", name, criteria, "createdAt"
  `

  return NextResponse.json(savedFilter[0], { status: 201 })
}
