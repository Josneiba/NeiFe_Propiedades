import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { assertPropertyAccess } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: propertyId } = await params
    const searchParams = request.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    if (!month || !year) {
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 })
    }

    // Verify user has access to this property
    await assertPropertyAccess(propertyId, session.user.id, session.user.role)

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        isActive: true
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    // Get related data separately to avoid type issues
    const [tenant, payments, services, maintenance, mandates, contracts] = await Promise.all([
      property.tenantId ? prisma.user.findUnique({
        where: { id: property.tenantId },
        select: { id: true, name: true, email: true, phone: true, rut: true }
      }) : null,
      prisma.payment.findMany({
        where: {
          propertyId,
          month: month,
          year: year
        },
        take: 1,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.monthlyService.findMany({
        where: {
          propertyId,
          month: month,
          year: year
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.maintenanceRequest.findMany({
        where: {
          propertyId,
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1)
          }
        },
        include: {
          provider: {
            select: { name: true }
          }
        }
      }),
      prisma.mandate.findMany({
        where: { 
          propertyId,
          status: 'ACTIVE' 
        },
        include: {
          broker: { 
            select: { name: true, email: true, company: true } 
          }
        },
        take: 1
      }),
      prisma.contract.findMany({
        where: { 
          propertyId,
          status: {
            in: ['ACTIVE', 'EXPIRING_SOON']
          }
        },
        take: 1,
        orderBy: { createdAt: 'desc' }
      })
    ])

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const monthName = new Date(year, month - 1).toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric',
    })

    const reportData = {
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        commune: property.commune,
        monthlyRentCLP: property.monthlyRentCLP,
        tenant: tenant
      },
      currentPayment: payments[0] || null,
      services: services.flatMap(service => {
        const serviceList = []
        if (service.water > 0) {
          serviceList.push({
            id: service.id + '-water',
            type: 'WATER',
            name: 'Agua',
            consumption: service.water,
            unit: 'm³',
            amountCLP: service.water,
            paidBy: 'TENANT'
          })
        }
        if (service.electricity > 0) {
          serviceList.push({
            id: service.id + '-electricity',
            type: 'ELECTRICITY',
            name: 'Electricidad',
            consumption: service.electricity,
            unit: 'kWh',
            amountCLP: service.electricity,
            paidBy: 'TENANT'
          })
        }
        if (service.gas > 0) {
          serviceList.push({
            id: service.id + '-gas',
            type: 'GAS',
            name: 'Gas',
            consumption: service.gas,
            unit: 'm³',
            amountCLP: service.gas,
            paidBy: 'TENANT'
          })
        }
        return serviceList
      }),
      maintenance: maintenance.map(maint => ({
        id: maint.id,
        title: maint.category,
        description: maint.description,
        status: maint.status,
        provider: maint.provider
      })),
      activeBroker: mandates[0]?.broker || null,
      monthName,
      currentMonth: month,
      currentYear: year
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating property report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
