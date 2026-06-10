import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'

/**
 * Búsqueda de leads disponibles para adjuntar a una oportunidad.
 * TODO: Implement when Lead model is available in schema
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // TODO: Implement lead search when lead model is available
  return NextResponse.json(
    { error: 'Lead search not yet implemented - schema update pending', leads: [] },
    { status: 501 }
  )
}
