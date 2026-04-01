import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

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

    const where: any = {
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
        property: { select: { name: true, address: true } },
        requester: { select: { name: true, email: true, phone: true } },
        provider: { select: { name: true, phone: true, email: true } },
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

    // Notificar al arrendador
    if (maintenance.property.landlordId) {
      await createNotification(
        maintenance.property.landlordId,
        'MAINTENANCE_NEW',
        'Nueva solicitud de mantención',
        `${data.category}: ${data.description}`,
        '/dashboard/mantenciones'
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
