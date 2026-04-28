import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { getCalendarSummary } from '@/lib/calendar-summary'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const scope = req.nextUrl.searchParams.get('scope') === 'broker' ? 'broker' : 'landlord'

  if (scope === 'broker' && session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (
    scope === 'landlord' &&
    session.user.role !== 'LANDLORD' &&
    session.user.role !== 'OWNER'
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const summary = await getCalendarSummary(session.user.id, scope)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching calendar summary:', error)
    return NextResponse.json(
      { error: 'Error al obtener resumen del calendario' },
      { status: 500 }
    )
  }
}
