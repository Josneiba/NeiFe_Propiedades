import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'

// GET — obtener solicitudes de corredores para el landlord actual
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'Solo propietarios pueden ver solicitudes de corredores' }, { status: 403 })
  }

  try {
    const permissions = await prisma.brokerPermission.findMany({
      where: { landlordId: session.user.id },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error fetching broker permissions:', error)
    return NextResponse.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    )
  }
}

// POST — crear o reactivar solicitud de permiso del corredor al propietario
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
    const landlordId = typeof body?.landlordId === 'string' ? body.landlordId : null

    if (!landlordId) {
      return NextResponse.json({ error: 'landlordId es requerido' }, { status: 400 })
    }

    if (landlordId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes solicitar permiso sobre tu propia cuenta' },
        { status: 400 }
      )
    }

    const landlord = await prisma.user.findUnique({
      where: { id: landlordId },
      select: { id: true, role: true, name: true, email: true },
    })

    if (!landlord || (landlord.role !== 'LANDLORD' && landlord.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'El usuario seleccionado no es un propietario válido' },
        { status: 404 }
      )
    }

    const existing = await prisma.brokerPermission.findUnique({
      where: {
        landlordId_brokerId: {
          landlordId,
          brokerId: session.user.id,
        },
      },
    })

    if (existing?.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Ya tienes permiso aprobado para este propietario' },
        { status: 409 }
      )
    }

    const permission = await prisma.brokerPermission.upsert({
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

    // Get property info if propertyId is provided
    let propertyInfo = null
    if (body.propertyId) {
      try {
        propertyInfo = await prisma.property.findUnique({
          where: { id: body.propertyId },
          select: { id: true, name: true, address: true }
        })
      } catch (error) {
        console.log('Error getting property info:', error)
      }
    }

    // Todas las solicitudes del corredor se revisan desde el panel "Corredores".
    const notificationLink = propertyInfo 
      ? '/dashboard/solicitudes-corredores?tab=propiedades'
      : '/dashboard/solicitudes-corredores'

    await createNotification(
      landlordId,
      'SYSTEM',
      propertyInfo 
        ? 'Solicitud de acceso a propiedad específica'
        : 'Solicitud de corredor recibida',
      `El corredor ${session.user.name || session.user.email} solicita administrar${propertyInfo ? ` la propiedad: ${propertyInfo.name || propertyInfo.address}` : ' tus propiedades'}.`,
      notificationLink
    )

    await logActivity(
      session.user.id,
      'BROKER_PERMISSION_REQUESTED',
      `Solicitud de permiso enviada a ${landlord.name || landlord.email}`,
      undefined,
      {
        landlordId,
        permissionId: permission.id,
      }
    )

    return NextResponse.json({ permission }, { status: 201 })
  } catch (error) {
    console.error('Error creating broker permission:', error)
    return NextResponse.json(
      { error: 'Error al crear solicitud de permiso' },
      { status: 500 }
    )
  }
}
