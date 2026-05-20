import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import {
  buildPasswordResetIdentifier,
  createPasswordResetCode,
  sendPasswordResetEmail,
} from '@/lib/password-reset'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    if (!resend) {
      return NextResponse.json(
        { error: 'La recuperación por correo no está configurada' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Si existe una cuenta con ese correo, te enviaremos un código.',
      })
    }

    const identifier = buildPasswordResetIdentifier(user.email)
    const token = createPasswordResetCode()
    const expires = new Date(Date.now() + 30 * 60 * 1000)

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    })

    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    })

    const result = await sendPasswordResetEmail({
      resend,
      email: user.email,
      name: user.name,
      token,
    })

    if (result.error) {
      console.error('Password reset email error:', result.error)
      return NextResponse.json(
        { error: 'No se pudo enviar el código de recuperación' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Si existe una cuenta con ese correo, te enviaremos un código.',
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Error al solicitar recuperación de contraseña' },
      { status: 500 }
    )
  }
}
