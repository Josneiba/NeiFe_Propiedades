import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

// GET — verificar si el broker actual tiene permiso aprobado para un landlord
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'Solo corredores pueden verificar permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const landlordId = searchParams.get('landlordId')

  if (!landlordId) {
    return NextResponse.json({ error: 'landlordId es requerido' }, { status: 400 })
  }

  try {
    const permission = await prisma.brokerPermission.findUnique({
      where: {
        landlordId_brokerId: {
          landlordId,
          brokerId: session.user.id,
        },
      },
    })

    const status = permission?.status ?? 'NONE'
    const hasPermission = status === 'APPROVED'

    return NextResponse.json({ hasPermission, status, permission })
  } catch (error) {
    console.error('Error checking broker permission:', error)
    return NextResponse.json(
      { error: 'Error al verificar permiso' },
      { status: 500 }
    )
  }
}