import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'

// GET - obtener solicitudes de acceso a propiedades
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const propertyId = searchParams.get('propertyId')
  const landlordId = searchParams.get('landlordId')

  try {
    let requests
    let whereClause: any = {}

    if (session.user.role === 'LANDLORD') {
      // Landlords see requests for their properties
      whereClause = {
        property: {
          landlordId: session.user.id
        }
      }
      
      // If specific propertyId is provided, filter further
      if (propertyId) {
        whereClause.property.id = propertyId
      }
      
      requests = await prisma.propertyAccessRequest.findMany({
        where: whereClause,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              commune: true
            }
          },
          broker: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (session.user.role === 'BROKER') {
      // Brokers see their own requests
      whereClause = {
        brokerId: session.user.id
      }
      
      // If specific propertyId is provided, filter further
      if (propertyId) {
        whereClause.propertyId = propertyId
      }
      
      requests = await prisma.propertyAccessRequest.findMany({
        where: whereClause,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              commune: true,
              landlordId: true,
              landlord: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching property access requests:', error)
    return NextResponse.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    )
  }
}

// POST - crear nueva solicitud de acceso a propiedad
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER') {
    return NextResponse.json(
      { error: 'Solo corredores pueden solicitar acceso a propiedades' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { propertyId, message } = body

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId es requerido' },
        { status: 400 }
      )
    }

    // Verify property exists and get landlord info
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // A property-specific access request only makes sense after the
    // landlord has approved the general broker relationship.
    const permission = await prisma.brokerPermission.findUnique({
      where: {
        landlordId_brokerId: {
          landlordId: property.landlordId,
          brokerId: session.user.id,
        },
      },
      select: { status: true },
    })

    if (!permission || permission.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Primero necesitas permiso aprobado del arrendador para administrar sus propiedades' },
        { status: 403 }
      )
    }

    // Check if broker already has an active mandate for this property
    const existingMandate = await prisma.mandate.findFirst({
      where: {
        propertyId,
        brokerId: session.user.id,
        status: 'ACTIVE'
      }
    })

    if (existingMandate) {
      return NextResponse.json(
        { error: 'Ya tienes un mandato activo para esta propiedad' },
        { status: 409 }
      )
    }

    const existingRequest = await prisma.propertyAccessRequest.findUnique({
      where: {
        propertyId_brokerId: {
          propertyId,
          brokerId: session.user.id,
        },
      },
    })

    if (existingRequest?.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente para esta propiedad' },
        { status: 409 }
      )
    }

    const accessRequest = await prisma.propertyAccessRequest.upsert({
      where: {
        propertyId_brokerId: {
          propertyId,
          brokerId: session.user.id,
        },
      },
      update: {
        landlordId: property.landlordId,
        message: message || null,
        status: 'PENDING',
        approvedAt: null,
        rejectedAt: null,
      },
      create: {
        propertyId,
        brokerId: session.user.id,
        landlordId: property.landlordId,
        message: message || null,
        status: 'PENDING'
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            commune: true
          }
        }
      }
    })

    // Notify the landlord - send both new and old notification types to ensure delivery
    await createNotification(
      property.landlordId,
      'SYSTEM',
      'Nueva solicitud de acceso a propiedad',
      `El corredor ${session.user.name || session.user.email} solicita administrar la propiedad ${property.name || property.address}`,
      `/dashboard/solicitudes-corredores?tab=propiedades`
    )

    // Log activity
    await logActivity(
      session.user.id,
      'PROPERTY_ACCESS_REQUESTED',
      `Solicitó acceso a la propiedad ${property.name || property.address}`,
      propertyId,
      {
        propertyId,
        landlordId: property.landlordId,
        requestId: accessRequest.id
      }
    )

    return NextResponse.json({ request: accessRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating property access request:', error)
    return NextResponse.json(
      { error: 'Error al crear solicitud de acceso' },
      { status: 500 }
    )
  }
}
