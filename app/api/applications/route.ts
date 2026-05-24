import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { normalizeRut, validateRut } from '@/lib/validate-rut'
import { createNotification } from '@/lib/notifications'

const createApplicationSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  rut: z.string().min(8).max(20),
  monthlyIncome: z.coerce.number().int().positive(),
  currentEmployer: z.string().max(120).optional(),
  message: z.string().max(1200).optional(),
  documents: z.array(z.string().url()).max(6).default([]),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (
    session.user.role !== 'LANDLORD' &&
    session.user.role !== 'OWNER' &&
    session.user.role !== 'BROKER'
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const status = req.nextUrl.searchParams.get('status')

    const applications = await prisma.tenantApplication.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        property:
          session.user.role === 'BROKER'
            ? {
                isActive: true,
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
              }
            : {
                landlordId: session.user.id,
                isActive: true,
              },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            commune: true,
            applicationOpen: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching tenant applications:', error)
    return NextResponse.json(
      { error: 'Error al obtener las postulaciones' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createApplicationSchema.parse(body)
    const rut = normalizeRut(data.rut)

    if (!validateRut(rut)) {
      return NextResponse.json({ error: 'RUT inválido' }, { status: 400 })
    }

    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        isActive: true,
        tenantId: null,
        applicationOpen: true,
      },
      select: {
        id: true,
        address: true,
        landlordId: true,
        managedBy: true,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Esta propiedad no está recibiendo postulaciones' },
        { status: 404 }
      )
    }

    const existing = await prisma.tenantApplication.findFirst({
      where: {
        propertyId: property.id,
        OR: [{ email: data.email }, { rut }],
        status: { in: ['PENDING', 'REVIEWING'] },
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una postulación activa con este email o RUT' },
        { status: 409 }
      )
    }

    const application = await prisma.tenantApplication.create({
      data: {
        propertyId: property.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        rut,
        monthlyIncome: data.monthlyIncome,
        currentEmployer: data.currentEmployer,
        message: data.message,
        documents: data.documents,
      },
    })

    await createNotification({
      userId: property.managedBy ?? property.landlordId,
      type: 'SYSTEM',
      title: 'Nueva postulación recibida',
      message: `Se recibió una postulación para ${property.address}.`,
      link: property.managedBy
        ? `/broker/propiedades/${property.id}`
        : `/dashboard/propiedades/${property.id}?tab=postulaciones`
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    console.error('Error creating tenant application:', error)
    return NextResponse.json(
      { error: 'Error al crear la postulación' },
      { status: 500 }
    )
  }
}
