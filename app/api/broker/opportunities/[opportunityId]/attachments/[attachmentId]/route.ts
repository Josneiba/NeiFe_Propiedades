import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'

// TODO: Implement when PropertyOpportunity and Lead models are added to schema

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ opportunityId: string; attachmentId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return NextResponse.json(
    { error: 'Feature not yet implemented - schema update pending' },
    { status: 501 }
  )
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ opportunityId: string; attachmentId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return NextResponse.json(
    { error: 'Feature not yet implemented - schema update pending' },
    { status: 501 }
  )
}
