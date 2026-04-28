import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity, logUnauthorizedAccess } from '@/lib/activity'
import { z } from 'zod'
import { assertBrokerAccess } from '@/lib/permissions'

const createSchema = z.object({
  propertyId: z.string(),
  category: z.enum([
    'PLUMBING',
    'ELECTRICAL',
    'STRUCTURAL',
    'APPLIANCES',
    'CLEANING',
    'OTHER',
  ]),
  description: z.string().min(10),
  photos: z.string().array().default([]),
})

// GET — listar mantenciones con filtros
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const where: any =
      session.user.role === 'BROKER'
        ? {
            property: {
              OR: [
                { managedBy: session.user.id },
                {
                  mandates: {
                    some: {
                      brokerId: session.user.id,
                      status: 'ACTIVE',
                    },
                  },
                },
              ],
            },
          }
        : {
            property: {
              landlordId: session.user.id,
            },
          }

    if (propertyId) where.propertyId = propertyId
    if (status) where.status = status
    if (category) where.category = category

    const maintenance = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        requester: { select: { name: true, email: true, phone: true } },
        provider: { select: { name: true, phone: true, email: true } },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            tenant: {
              select: {
                name: true,
              },
            },
            providers: {
              include: {
                provider: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        timeline: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ maintenance })
  } catch (error) {
    console.error('Error fetching maintenance:', error)
    return NextResponse.json(
      { error: 'Error al obtener mantenciones' },
      { status: 500 }
    )
  }
}

// POST — crear solicitud de mantención (desde arrendatario)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    if (session.user.role === 'TENANT') {
      const userProperty = await prisma.property.findFirst({
        where: { tenantId: session.user.id, id: data.propertyId },
        select: { id: true },
      })

      if (!userProperty) {
        logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
        return NextResponse.json(
          { error: 'No eres arrendatario de esta propiedad' },
          { status: 403 }
        )
      }
    } else if (session.user.role === 'LANDLORD' || session.user.role === 'OWNER') {
      const landlordProperty = await prisma.property.findFirst({
        where: { landlordId: session.user.id, id: data.propertyId },
        select: { id: true },
      })

      if (!landlordProperty) {
        logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
        return NextResponse.json(
          { error: 'Sin acceso a esta propiedad' },
          { status: 403 }
        )
      }
    } else if (session.user.role === 'BROKER') {
      try {
        await assertBrokerAccess(data.propertyId, session.user.id)
      } catch {
        logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
        return NextResponse.json(
          { error: 'Sin acceso a esta propiedad' },
          { status: 403 }
        )
      }
    } else {
      logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Determinar responsabilidad según categoría (Ley 18.101)
    const landlordResponsible = ['PLUMBING', 'ELECTRICAL', 'STRUCTURAL'].includes(
      data.category
    )

    const legalReference =
      'Art. 1924 Código Civil — Obligaciones del arrendador'

    const maintenance = await prisma.maintenanceRequest.create({
      data: {
        ...data,
        requesterId: session.user.id,
        isLandlordResp: landlordResponsible,
        legalReference,
        status: 'REQUESTED',
        timeline: {
          create: {
            status: 'REQUESTED',
            note: 'Solicitud realizada',
          },
        },
      },
      include: {
        property: true,
        timeline: true,
      },
    })

    const notifyUserId = maintenance.property.managedBy || maintenance.property.landlordId
    if (notifyUserId) {
      await createNotification(
        notifyUserId,
        'MAINTENANCE_NEW',
        'Nueva solicitud de mantención',
        `${data.category}: ${data.description}`,
        maintenance.property.managedBy
          ? `/broker/propiedades/${maintenance.propertyId}`
          : '/dashboard/mantenciones'
      )
    }

    await logActivity(
      session.user.id,
      'MAINTENANCE_REQUESTED',
      `Solicitud de mantención: ${data.category}`,
      data.propertyId
    )

    return NextResponse.json({ maintenance }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating maintenance:', error)
    return NextResponse.json(
      { error: 'Error al crear solicitud de mantención' },
      { status: 500 }
    )
  }
}
