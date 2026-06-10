// app/api/crm/metrics/recalculate/route.ts
import { auth } from '@/lib/auth-session'
import { recalculateAllScores } from '@/lib/crm-scoring'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const brokerId = session.user.id

  try {
    await recalculateAllScores(brokerId)
    return NextResponse.json({ ok: true, message: 'Scores recalculados exitosamente' })
  } catch (error) {
    console.error('Error recalculating scores:', error)
    return NextResponse.json(
      { error: 'Error al recalcular scores' },
      { status: 500 }
    )
  }
}
