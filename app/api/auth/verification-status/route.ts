import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shouldRequireEmailVerificationForUser } from '@/lib/email-verification'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ requiresVerification: false })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, createdAt: true },
    })

    return NextResponse.json({
      requiresVerification:
        !!user &&
        shouldRequireEmailVerificationForUser({
          createdAt: user.createdAt,
          emailVerified: user.emailVerified,
        }),
    })
  } catch {
    return NextResponse.json({ requiresVerification: false })
  }
}
