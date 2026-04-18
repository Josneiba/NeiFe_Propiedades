import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

// GET — obtener solicitudes de corredores que el broker envió
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'Solo corredores pueden ver sus solicitudes' }, { status: 403 })
  }

  try {
    const permissions = await prisma.brokerPermission.findMany({
      where: {
        brokerId: session.user.id,
      },
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error fetching broker sent permissions:', error)
    return NextResponse.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    )
  }
}
