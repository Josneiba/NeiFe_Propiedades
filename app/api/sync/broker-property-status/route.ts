import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

// GET - verificar estado de sincronización de propiedades
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const landlordId = searchParams.get('landlordId')
  const brokerId = searchParams.get('brokerId')

  if (!landlordId || !brokerId) {
    return NextResponse.json({ 
      error: 'Se requieren landlordId y brokerId' 
    }, { status: 400 })
  }

  try {
    // Verificar que el broker tiene permiso aprobado
    const permission = await prisma.brokerPermission.findFirst({
      where: {
        landlordId,
        brokerId,
        status: 'APPROVED'
      }
    })

    if (!permission) {
      return NextResponse.json({ 
        error: 'El corredor no tiene permiso aprobado' 
      }, { status: 403 })
    }

    // Obtener todas las propiedades del landlord
    const properties = await prisma.property.findMany({
      where: { landlordId },
      select: { id: true, name: true, address: true }
    })

    // Verificar cuántas tienen mandatos activos
    const mandates = await prisma.mandate.findMany({
      where: {
        propertyId: { in: properties.map(p => p.id) },
        brokerId,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({ 
      total: properties.length,
      synced: mandates.length,
      lastSync: permission.updatedAt
    })

  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Error al verificar estado de sincronización' },
      { status: 500 }
    )
  }
}
