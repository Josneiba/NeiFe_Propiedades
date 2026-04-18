import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { assertPropertyOwner } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId } = body

    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad es requerido' }, { status: 400 })
    }

    // Verify user is the property owner
    await assertPropertyOwner(propertyId, session.user.id)

    // Find and revoke active mandate
    const activeMandate = await prisma.mandate.findFirst({
      where: {
        propertyId,
        status: 'ACTIVE'
      }
    })

    if (!activeMandate) {
      return NextResponse.json({ error: 'No hay mandato activo para esta propiedad' }, { status: 404 })
    }

    // Update mandate status to REVOKED
    const revokedMandate = await prisma.mandate.update({
      where: {
        id: activeMandate.id
      },
      data: {
        status: 'REVOKED',
        updatedAt: new Date()
      }
    })

    // Limpiar managedBy en la propiedad
    await prisma.property.update({
      where: { id: activeMandate.propertyId },
      data: { managedBy: null }
    })

    // Notificar al corredor que el mandato fue revocado
    await prisma.notification.create({
      data: {
        userId: activeMandate.brokerId,
        type: 'SYSTEM',
        title: 'Mandato revocado',
        message: `El propietario ha revocado tu mandato de administración`,
        link: '/broker/mandatos',
      }
    })

    return NextResponse.json({
      message: 'Mandato revocado exitosamente',
      mandate: revokedMandate
    })
  } catch (error) {
    console.error('Error revoking mandate:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
