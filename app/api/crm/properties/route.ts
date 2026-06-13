// app/api/crm/properties/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { generateCrmCode } from '@/lib/crm-codes'
import { NextRequest, NextResponse } from 'next/server'
import {
  CrmPropertyType,
  CrmOperationType,
  CrmPropertyStatus,
} from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const brokerId = session.user.id
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const q = searchParams.get('q')

  const where: any = { brokerId }

  if (status) {
    where.crmStatus = status
  }

  if (type) {
    where.type = type
  }

  if (q) {
    where.OR = [
      { address: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { commune: { contains: q, mode: 'insensitive' } },
    ]
  }

  const properties = await prisma.crmProperty.findMany({
    where,
    include: {
      owner: { select: { id: true, code: true, name: true } },
      deals: { select: { id: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(properties)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const body = await request.json()

  const {
    address,
    commune,
    type,
    operationType,
    bedrooms,
    bathrooms,
    sqMeters,
    askingPrice,
    ownerId,
    notes,
  } = body

  if (!address || !commune || !type || !operationType) {
    return NextResponse.json(
      {
        error: 'Faltan campos requeridos: address, commune, type, operationType',
      },
      { status: 400 }
    )
  }

  try {
    const property = await prisma.$transaction(async (tx) => {
      const code = await generateCrmCode('INMU', tx)

      return tx.crmProperty.create({
        data: {
          code,
          address,
          commune,
          type: type as CrmPropertyType,
          operationType: operationType as CrmOperationType,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          sqMeters: sqMeters ? parseFloat(sqMeters) : null,
          askingPrice: askingPrice ? parseFloat(askingPrice) : null,
          crmStatus: 'LEAD',
          ownerId: ownerId || null,
          brokerId,
          notes: notes || null,
        },
        include: { owner: true, deals: true },
      })
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Error al crear propiedad' },
      { status: 500 }
    )
  }
}
