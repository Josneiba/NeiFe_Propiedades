import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  rut: z.string().max(20).optional(),
  bankName: z.string().max(100).optional(),
  bankAccountType: z.string().max(50).optional(),
  bankAccountNumber: z.string().max(50).optional(),
  bankEmail: z.string().email().optional(),
})

// GET — obtener datos del usuario actual
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        avatar: true,
        bankName: true,
        bankAccountType: true,
        bankAccountNumber: true,
        bankEmail: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos del usuario' },
      { status: 500 }
    )
  }
}

// PATCH — actualizar perfil e información bancaria
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateProfileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...data,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        bankName: true,
        bankAccountType: true,
        bankAccountNumber: true,
        bankEmail: true,
      },
    })

    return NextResponse.json({ user, message: 'Perfil actualizado correctamente' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    )
  }
}
