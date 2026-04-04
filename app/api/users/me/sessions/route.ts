import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

// DELETE — cerrar todas las otras sesiones del usuario
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Obtener el sessionToken actual del usuario
    // Nota: En next-auth v5, el sessionToken viene en las cookies
    const currentSessionToken = req.cookies.get('authjs.session-token')?.value ?? 
                               req.cookies.get('__Secure-authjs.session-token')?.value

    // Eliminar todas las sesiones excepto la actual
    const result = await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        ...(currentSessionToken && { sessionToken: { not: currentSessionToken } }),
      },
    })

    return NextResponse.json({
      message: 'Otras sesiones cerradas correctamente',
      deletedCount: result.count,
    })
  } catch (error) {
    console.error('Error deleting sessions:', error)
    return NextResponse.json(
      { error: 'Error al cerrar las sesiones' },
      { status: 500 }
    )
  }
}
