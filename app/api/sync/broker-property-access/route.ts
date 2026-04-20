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

        // Crear o actualizar mandato
        return prisma.mandate.upsert({
          where: {
            propertyId_brokerId: {
              propertyId,
              brokerId
            }
          },
          update: {
            status: 'ACTIVE',
            startsAt: new Date(),
            commissionRate: 0.05, // 5% por defecto
            commissionType: 'MONTHLY'
          },
          create: {
            propertyId,
            brokerId,
            status: 'ACTIVE',
            startsAt: new Date(),
            commissionRate: 0.05,
            commissionType: 'MONTHLY'
          }
        })
      })
    )

    // Filtrar mandatos exitosos
    const successfulMandates = mandates.filter(m => m !== null)

    // Actualizar información del broker en las propiedades
    await Promise.all(
      successfulMandates.map(mandate => 
        prisma.property.update({
          where: { id: mandate.propertyId },
          data: {
            agentName: session.user.name,
            agentEmail: session.user.email,
            agentPhone: session.user.phone || '',
            agentCompany: session.user.company || '',
            agentRut: session.user.rut || '',
            updatedAt: new Date()
          }
        })
      )
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
