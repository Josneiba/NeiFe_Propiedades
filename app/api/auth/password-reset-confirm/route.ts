import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { buildPasswordResetIdentifier } from '@/lib/password-reset'

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json()

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'Email, código y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const identifier = buildPasswordResetIdentifier(normalizedEmail)
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token,
      },
    })

    if (!record) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier } })
      return NextResponse.json({ error: 'El código expiró' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: passwordHash,
      },
    })

    await prisma.verificationToken.deleteMany({ where: { identifier } })

    return NextResponse.json({
      success: true,
      message: 'Tu contraseña fue actualizada correctamente.',
    })
  } catch (error) {
    console.error('Password reset confirm error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la contraseña' },
      { status: 500 }
    )
  }
}
