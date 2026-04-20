import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'

// PATCH - aprobar o rechazar solicitud de acceso a propiedad
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'LANDLORD') {
    return NextResponse.json(
      { error: 'Solo propietarios pueden gestionar solicitudes de acceso' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { action } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    const accessRequest = await prisma.propertyAccessRequest.findFirst({
      where: {
        id: params.id,
        landlordId: session.user.id,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    if (accessRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta solicitud ya fue procesada' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      updatedAt: new Date(),
    }

    if (action === 'approve') {
      updateData.approvedAt = new Date()
    } else {
      updateData.rejectedAt = new Date()
    }

    const updatedRequest = await prisma.propertyAccessRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // If approved, create a mandate
    if (action === 'approve') {
      // Check if there's already an active mandate
      const existingMandate = await prisma.mandate.findFirst({
        where: {
          propertyId: accessRequest.propertyId,
          brokerId: accessRequest.brokerId,
          status: 'ACTIVE'
        }
      })

      if (!existingMandate) {
        await prisma.mandate.create({
          data: {
            propertyId: accessRequest.propertyId,
            ownerId: accessRequest.landlordId,
            brokerId: accessRequest.brokerId,
            status: 'ACTIVE',
            signedByOwner: true,
            ownerSignedAt: new Date(),
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            notes: `Mandato creado automáticamente desde solicitud de acceso aprobada`
          }
        })
      }

      // Update property to mark as managed by broker
      await prisma.property.update({
        where: { id: accessRequest.propertyId },
        data: { managedBy: accessRequest.brokerId }
      })
    }

    // Notify the broker
    const notificationTitle = action === 'approve'
      ? 'Solicitud de acceso aprobada'
      : 'Solicitud de acceso rechazada'
    const notificationMessage = action === 'approve'
      ? `${session.user.name} ha aprobado tu solicitud para administrar la propiedad ${accessRequest.property.name || accessRequest.property.address}.`
      : `${session.user.name} ha rechazado tu solicitud para administrar la propiedad ${accessRequest.property.name || accessRequest.property.address}.`

    await createNotification(
      accessRequest.brokerId,
      'SYSTEM',
      notificationTitle,
      notificationMessage,
      action === 'approve' ? `/broker/propiedades/${accessRequest.propertyId}` : undefined
    )

    // Log activity
    await logActivity(
      session.user.id,
      action === 'approve' ? 'PROPERTY_ACCESS_APPROVED' : 'PROPERTY_ACCESS_REJECTED',
      `${action === 'approve' ? 'Aprobada' : 'Rechazada'} solicitud de acceso para propiedad ${accessRequest.property.name || accessRequest.property.address}`,
      accessRequest.propertyId,
      {
        requestId: accessRequest.id,
        brokerId: accessRequest.brokerId,
        action
      }
    )

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Error updating property access request:', error)
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}

// DELETE - eliminar solicitud (solo el corredor que la envió)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return NextResponse.json(
      { error: 'Solo corredores pueden eliminar sus solicitudes' },
      { status: 403 }
    )
  }

  try {
    const accessRequest = await prisma.propertyAccessRequest.findUnique({
      where: { id: params.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })

    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    if (accessRequest.brokerId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta solicitud' },
        { status: 403 }
      )
    }

    if (accessRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo puedes eliminar solicitudes pendientes' },
        { status: 400 }
      )
    }

    await prisma.propertyAccessRequest.delete({
      where: { id: params.id }
    })

    // Log activity
    await logActivity(
      session.user.id,
      'PROPERTY_ACCESS_DELETED',
      `Eliminó solicitud de acceso para propiedad ${accessRequest.property.name || accessRequest.property.address}`,
      accessRequest.propertyId
    )

    return NextResponse.json({
      message: 'Solicitud eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error deleting property access request:', error)
    return NextResponse.json(
      { error: 'Error al eliminar solicitud' },
      { status: 500 }
    )
  }
}
