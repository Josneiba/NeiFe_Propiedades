import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { ensureStandardSavedViews, executeSavedView } from '@/lib/crm-saved-views'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const entity = request.nextUrl.searchParams.get('entity') || 'CONTACTS'
  await ensureStandardSavedViews(prisma, session.user.id)

  const [views, standardViews] = await Promise.all([
    prisma.crmSavedView.findMany({
      where: { brokerId: session.user.id, entity: entity as any },
      orderBy: [{ isStandard: 'asc' }, { updatedAt: 'desc' }],
    }),
    prisma.crmSavedView.findMany({
      where: { brokerId: session.user.id, entity: entity as any, isStandard: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const enriched = await Promise.all([...views, ...standardViews].map(async (view) => {
    const result = await executeSavedView(prisma, session.user.id, {
      entity: view.entity as any,
      filters: (view.filters as Record<string, unknown>) ?? {},
      sortBy: view.sortBy,
      sortOrder: view.sortOrder,
    })
    return { ...view, resultCount: result.count }
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await request.json()
  const view = await prisma.crmSavedView.create({
    data: {
      brokerId: session.user.id,
      name: body.name,
      entity: body.entity,
      filters: body.filters ?? {},
      sortBy: body.sortBy ?? null,
      sortOrder: body.sortOrder ?? 'asc',
      isStandard: false,
    },
  })

  return NextResponse.json(view, { status: 201 })
}
