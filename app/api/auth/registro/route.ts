import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  rut: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['LANDLORD', 'TENANT']),
  privacyAccepted: z.boolean().refine((v) => v === true),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (exists) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        rut: data.rut,
        phone: data.phone,
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
      },
      select: { id: true, email: true, name: true, role: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta' },
      { status: 500 }
    )
  }
}
