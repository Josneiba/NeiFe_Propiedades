import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import {
  generateVerificationCode,
  sendVerificationEmail,
  shouldRequireEmailVerificationForUser,
} from '@/lib/email-verification'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    if (!resend) {
      return NextResponse.json(
        { error: 'El envio de correos no esta configurado' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No existe una cuenta con ese email' },
        { status: 404 }
      )
    }

    if (
      !shouldRequireEmailVerificationForUser({
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
      })
    ) {
      return NextResponse.json({
        success: true,
        message: 'Esta cuenta no requiere verificacion por email.',
      })
    }

    const token = generateVerificationCode()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    })

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    })

    const result = await sendVerificationEmail({
      resend,
      email: user.email,
      name: user.name,
      token,
    })

    if (result.error) {
      console.error('Email resend error:', result.error)
      return NextResponse.json(
        { error: 'No se pudo reenviar el codigo de verificacion' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Te enviamos un nuevo codigo de verificacion.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Error al reenviar el codigo' },
      { status: 500 }
    )
  }
}
