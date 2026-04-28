import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

// POST - sincronizar acceso de corredor a propiedades
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { landlordId, brokerId, propertyIds } = body

    if (!landlordId || !brokerId || !propertyIds?.length) {
      return NextResponse.json({ 
        error: 'Se requieren landlordId, brokerId y propertyIds' 
      }, { status: 400 })
    }

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

    const broker = await prisma.user.findUnique({
      where: { id: brokerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        rut: true,
        documentNumberNormalized: true,
      },
    })

    if (!broker) {
      return NextResponse.json({ error: 'Corredor no encontrado' }, { status: 404 })
    }

    // Crear mandatos para todas las propiedades especificadas
    const mandates = await Promise.all(
      propertyIds.map(async (propertyId: string) => {
        // Verificar que la propiedad existe y pertenece al landlord
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { id: true, landlordId: true }
        })

        if (!property || property.landlordId !== landlordId) {
          return null
        }

        const existingMandate = await prisma.mandate.findFirst({
          where: {
            propertyId,
            brokerId,
            ownerId: landlordId,
          },
        })

        if (existingMandate) {
          await prisma.mandate.update({
            where: { id: existingMandate.id },
            data: {
              status: 'ACTIVE',
              startsAt: existingMandate.startsAt ?? new Date(),
            },
          })
        } else {
          await prisma.mandate.create({
            data: {
              propertyId,
              ownerId: landlordId,
              brokerId,
              status: 'ACTIVE',
              startsAt: new Date(),
              signedByOwner: true,
              signedByBroker: true,
              ownerSignedAt: new Date(),
              brokerSignedAt: new Date(),
            },
          })
        }

        await prisma.property.update({
          where: { id: propertyId },
          data: {
            managedBy: brokerId,
            agentId: broker.id,
            agentName: broker.name,
            agentEmail: broker.email,
            agentPhone: broker.phone ?? '',
            agentCompany: broker.company ?? '',
            agentRut: broker.rut ?? broker.documentNumberNormalized ?? '',
            commissionRate: null,
            commissionType: null,
            updatedAt: new Date(),
          },
        })

        return { propertyId }
      })
    )

    // Filtrar mandatos exitosos
    const successfulMandates = mandates.filter(
      (mandate): mandate is { propertyId: string } => mandate !== null
    )

    await logActivity(
      session.user.id,
      'BROKER_PROPERTY_SYNC',
      `Sincronizadas ${successfulMandates.length} propiedades para el corredor`,
      undefined,
      {
        landlordId,
        brokerId,
        propertyIds: successfulMandates.map(m => m.propertyId),
        mandateCount: successfulMandates.length
      }
    )

    return NextResponse.json({ 
      success: true,
      syncedProperties: successfulMandates.length,
      totalRequested: propertyIds.length
    })

  } catch (error) {
    console.error('Error syncing broker property access:', error)
    return NextResponse.json(
      { error: 'Error al sincronizar acceso a propiedades' },
      { status: 500 }
    )
  }
}
