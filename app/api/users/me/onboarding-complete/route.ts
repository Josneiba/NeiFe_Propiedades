import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Mark onboarding as completed
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingDone: true,
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error marking onboarding complete:', error)
    return NextResponse.json(
      { error: 'Error al marcar onboarding como completado' },
      { status: 500 }
    )
  }
}
