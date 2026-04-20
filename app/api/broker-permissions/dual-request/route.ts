import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'

// POST - crear solicitud dual (ambos sistemas)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return NextResponse.json(
      { error: 'Solo corredores pueden solicitar permisos' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { landlordId, propertyId, message } = body

    if (!landlordId) {
      return NextResponse.json({ error: 'landlordId es requerido' }, { status: 400 })
    }

    if (landlordId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes solicitar permiso sobre tu propia cuenta' },
        { status: 400 }
      )
    }

    // 1. Crear solicitud en el sistema antiguo (broker-permissions)
    const oldPermission = await prisma.brokerPermission.upsert({
      where: {
        landlordId_brokerId: {
          landlordId,
          brokerId: session.user.id,
        },
      },
      update: {
        status: 'PENDING',
        approvedAt: null,
        rejectedAt: null,
      },
      create: {
        landlordId,
        brokerId: session.user.id,
        status: 'PENDING',
      },
    })

    // 2. Guardar información de la propiedad en la nota del sistema antiguo
    let propertyInfo = null
    if (propertyId) {
      try {
        // Verificar que la propiedad existe y pertenece al landlord
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { id: true, name: true, address: true, landlordId: true }
        })

        if (property && property.landlordId === landlordId) {
          propertyInfo = property
        }
      } catch (error) {
        console.log('No se pudo verificar la propiedad (continuando con antiguo):', error)
      }
    }

    // 3. Enviar notificaciones duales para asegurar entrega
    const landlord = await prisma.user.findUnique({
      where: { id: landlordId },
      select: { id: true, name: true, email: true }
    })

    if (landlord) {
      // Notificación del sistema antiguo
      await createNotification(
        landlordId,
        'SYSTEM',
        'Solicitud de corredor recibida',
        `El corredor ${session.user.name || session.user.email} solicita administrar tus propiedades.`,
        '/dashboard/solicitudes-corredores'
      )

      // Si hay propertyId, enviar notificación específica de propiedad
      if (propertyId && propertyInfo) {
        await createNotification(
          landlordId,
          'SYSTEM',
          'Solicitud de acceso a propiedad específica',
          `El corredor ${session.user.name || session.user.email} solicita administrar: ${propertyInfo.name || propertyInfo.address}`,
          `/dashboard/propiedades/${propertyId}?tab=resumen`
        )
      }
    }

    await logActivity(
      session.user.id,
      'BROKER_PERMISSION_REQUESTED',
      `Solicitud de permiso enviada a ${landlord?.name || landlord?.email}`,
      undefined,
      {
        landlordId,
        permissionId: oldPermission.id,
        propertyId: propertyId || null
      }
    )

    return NextResponse.json({ 
      success: true,
      oldPermission,
      propertyInfo 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating dual permission request:', error)
    return NextResponse.json(
      { error: 'Error al crear solicitud de permiso' },
      { status: 500 }
    )
  }
}
