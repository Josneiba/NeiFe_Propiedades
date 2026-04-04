import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).max(100),
})

// PATCH — cambiar contraseña
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { currentPassword, newPassword } = passwordSchema.parse(body)

    // Obtener usuario actual con contraseña
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 401 }
      )
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating password:', error)
    return NextResponse.json(
      { error: 'Error al cambiar la contraseña' },
      { status: 500 }
    )
  }
}
