import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { getUnifiedContacts } from '@/lib/contactos'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const contacts = await getUnifiedContacts(session.user.id)
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error loading unified contacts:', error)
    return NextResponse.json({ error: 'No se pudieron cargar los contactos' }, { status: 500 })
  }
}
