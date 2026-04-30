import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { getUserIdentity } from '@/lib/identity-documents'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params

  // Split into two parallel queries for better performance
  const [basicProperty, operationalData] = await Promise.all([
    // Query 1: Basic property data (landlord, tenant, mandates)
    prisma.property.findFirst({
      where: {
        id,
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
      },
      select: {
        id: true,
        name: true,
        address: true,
        commune: true,
        region: true,
        monthlyRentCLP: true,
        monthlyRentUF: true,
        contractStart: true,
        contractEnd: true,
        isActive: true,
        landlord: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rut: true,
            documentType: true,
            documentNumber: true,
            documentNumberNormalized: true,
          },
        },
        mandates: {
          where: {
            brokerId: session.user.id,
            status: 'ACTIVE',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            startsAt: true,
            expiresAt: true,
            notes: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
            broker: {
              select: {
                name: true,
                email: true,
                company: true,
              },
            },
          },
        },
      },
    }),
    // Query 2: Operational data (payments, services, maintenance, providers, inspections)
    prisma.property.findFirst({
      where: {
        id,
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
      },
      select: {
        id: true,
        payments: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 6,
          select: {
            id: true,
            status: true,
            month: true,
            year: true,
            amountCLP: true,
            receipt: true,
          },
        },
        services: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 3,
          select: {
            id: true,
            month: true,
            year: true,
            water: true,
            electricity: true,
            gas: true,
            garbage: true,
            commonExpenses: true,
            other: true,
            otherLabel: true,
          },
        },
        maintenance: {
          where: {
            status: {
              in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            category: true,
            description: true,
            status: true,
            createdAt: true,
          },
        },
        providers: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                specialty: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        inspections: {
          orderBy: {
            scheduledAt: 'asc',
          },
          take: 4,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            type: true,
          },
        },
      },
    }),
  ])

  if (!basicProperty) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
  }

  const tenantIdentity = basicProperty.tenant ? getUserIdentity(basicProperty.tenant) : null

  return NextResponse.json({
    ...basicProperty,
    payments: operationalData?.payments,
    services: operationalData?.services,
    maintenance: operationalData?.maintenance,
    providers: operationalData?.providers,
    inspections: operationalData?.inspections,
    tenantIdentity,
  })
}
