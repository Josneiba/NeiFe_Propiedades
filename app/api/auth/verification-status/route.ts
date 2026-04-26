import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function shouldRequireEmailVerification() {
  return process.env.NODE_ENV === 'production' && Boolean(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ requiresVerification: false })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    })

    return NextResponse.json({
      requiresVerification:
        shouldRequireEmailVerification() && !!user && user.emailVerified === null,
    })
  } catch {
    return NextResponse.json({ requiresVerification: false })
  }
}
