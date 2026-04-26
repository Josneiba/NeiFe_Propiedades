import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json()

    if (!email || !token) {
      return NextResponse.json({ error: 'Email y código requeridos' }, { status: 400 })
    }

    const record = await prisma.verificationToken.findFirst({
      where: { identifier: email, token },
    })

    if (!record) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier: email } })
      return NextResponse.json({ error: 'El código expiró. Regístrate de nuevo.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Error al verificar' }, { status: 500 })
  }
}
