import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { isMandateError, signMandate } from '@/lib/mandates'

const signSchema = z.object({
  role: z.enum(['owner', 'broker']),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const data = signSchema.parse(body)

    const result = await signMandate({
      mandateId: id,
      signerId: session.user.id,
      signerRole: data.role,
    })

    return NextResponse.json({
      mandate: result.mandate,
      activated: result.activated,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (isMandateError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error signing mandate:', error)
    return NextResponse.json(
      { error: 'Error al firmar mandato' },
      { status: 500 }
    )
  }
}
