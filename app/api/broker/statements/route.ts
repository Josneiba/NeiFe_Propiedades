import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

const itemSchema = z.object({
  label: z.string().min(1),
  amountCLP: z.number().int().nonnegative(),
  type: z.enum(['COMMISSION', 'MAINTENANCE', 'DEDUCTION']),
  notes: z.string().optional(),
})

const statementSchema = z.object({
  propertyId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2035),
  grossIncomeCLP: z.number().int().positive(),
  brokerCommissionCLP: z.number().int().nonnegative(),
  maintenanceCLP: z.number().int().nonnegative().default(0),
  otherDeductionsCLP: z.number().int().nonnegative().default(0),
  notes: z.string().max(500).optional(),
  transferReference: z.string().max(120).optional(),
  transferDate: z.string().optional(),
  items: z.array(itemSchema).default([]),
  sendToLandlord: z.boolean().optional().default(false),
})

async function getBrokerProperty(propertyId: string, brokerId: string) {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      OR: [
        { managedBy: brokerId },
        {
          mandates: {
            some: {
              brokerId,
              status: 'ACTIVE',
            },
          },
        },
      ],
    },
    select: {
      id: true,
      address: true,
      commune: true,
      landlordId: true,
      landlord: {
        select: { id: true, name: true, email: true },
      },
      tenant: {
        select: { id: true, name: true, email: true },
      },
    },
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const statements = await prisma.brokerStatement.findMany({
    where: {
      brokerId: session.user.id,
    },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          commune: true,
          name: true,
        },
      },
      landlord: {
        select: {
          name: true,
          email: true,
        },
      },
      items: true,
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ statements })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const raw = await req.json()
    const data = statementSchema.parse(raw)

    const property = await getBrokerProperty(data.propertyId, session.user.id)
    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const itemMaintenance = data.items
      .filter((item) => item.type === 'MAINTENANCE')
      .reduce((sum, item) => sum + item.amountCLP, 0)
    const itemDeductions = data.items
      .filter((item) => item.type === 'DEDUCTION')
      .reduce((sum, item) => sum + item.amountCLP, 0)

    const maintenanceCLP = Math.max(data.maintenanceCLP, itemMaintenance)
    const otherDeductionsCLP = Math.max(data.otherDeductionsCLP, itemDeductions)
    const netTransferCLP =
      data.grossIncomeCLP -
      data.brokerCommissionCLP -
      maintenanceCLP -
      otherDeductionsCLP

    if (netTransferCLP < 0) {
      return NextResponse.json(
        { error: 'El monto neto no puede ser negativo' },
        { status: 400 }
      )
    }

    const transferDate = data.transferDate ? new Date(data.transferDate) : null
    const status = data.sendToLandlord ? 'SENT' : 'DRAFT'

    const statement = await prisma.brokerStatement.upsert({
      where: {
        propertyId_month_year: {
          propertyId: data.propertyId,
          month: data.month,
          year: data.year,
        },
      },
      update: {
        brokerCommissionCLP: data.brokerCommissionCLP,
        grossIncomeCLP: data.grossIncomeCLP,
        maintenanceCLP,
        otherDeductionsCLP,
        netTransferCLP,
        notes: data.notes,
        transferReference: data.transferReference,
        transferDate,
        status,
        items: {
          deleteMany: {},
          create: data.items,
        },
      },
      create: {
        brokerId: session.user.id,
        landlordId: property.landlordId,
        propertyId: property.id,
        month: data.month,
        year: data.year,
        grossIncomeCLP: data.grossIncomeCLP,
        brokerCommissionCLP: data.brokerCommissionCLP,
        maintenanceCLP,
        otherDeductionsCLP,
        netTransferCLP,
        notes: data.notes,
        transferReference: data.transferReference,
        transferDate,
        status,
        items: {
          create: data.items,
        },
      },
      include: {
        items: true,
        property: {
          select: {
            id: true,
            address: true,
            commune: true,
            name: true,
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (data.sendToLandlord) {
      await createNotification(
        property.landlordId,
        'SYSTEM',
        'Nueva rendicion mensual disponible',
        `${session.user.name || session.user.email} publico la rendicion de ${property.address} para ${data.month}/${data.year}.`,
        '/dashboard#rendiciones-recibidas'
      )
    }

    return NextResponse.json({ statement }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Datos invalidos' },
        { status: 400 }
      )
    }
    console.error('Error creating broker statement:', error)
    return NextResponse.json(
      { error: 'Error al guardar la rendicion' },
      { status: 500 }
    )
  }
}
