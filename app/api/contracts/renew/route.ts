import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { canManageContracts, getManagedPropertiesWhere } from '@/lib/contracts'

const renewSchema = z
  .object({
    propertyId: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    monthlyRentCLP: z.number().int().positive().nullable().optional(),
    monthlyRentUF: z.number().positive().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startDate)
    const end = new Date(value.endDate)

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: 'Fecha de inicio inválida',
      })
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Fecha de término inválida',
      })
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'La fecha de término debe ser posterior al inicio',
      })
    }

    if (value.monthlyRentCLP == null && value.monthlyRentUF == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['monthlyRentCLP'],
        message: 'Debes indicar al menos una renta para la renovación',
      })
    }
  })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!canManageContracts(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = renewSchema.parse(await req.json())
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)

    const property = await prisma.property.findFirst({
      where: {
        id: body.propertyId,
        ...getManagedPropertiesWhere(session.user.id, session.user.role),
      },
      select: {
        id: true,
        address: true,
        tenantId: true,
        contractStart: true,
        contractEnd: true,
        monthlyRentCLP: true,
        monthlyRentUF: true,
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            pdfUrl: true,
          },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    if (!property.tenantId) {
      return NextResponse.json(
        { error: 'Debes tener un arrendatario asignado para renovar el contrato' },
        { status: 400 }
      )
    }

    const latestContract = property.contracts[0] ?? null

    const result = await prisma.$transaction(async (tx) => {
      const updatedProperty = await tx.property.update({
        where: { id: property.id },
        data: {
          contractStart: startDate,
          contractEnd: endDate,
          monthlyRentCLP: body.monthlyRentCLP ?? null,
          monthlyRentUF: body.monthlyRentUF ?? null,
        },
      })

      const contract =
        latestContract &&
        latestContract.status !== 'ACTIVE' &&
        latestContract.status !== 'EXPIRED'
          ? await tx.contract.update({
              where: { id: latestContract.id },
              data: {
                status: 'DRAFT',
                landlordSign: null,
                tenantSign: null,
                signedAt: null,
                startDate,
                endDate,
                rentUF: body.monthlyRentUF ?? null,
              },
            })
          : await tx.contract.create({
              data: {
                propertyId: property.id,
                pdfUrl: null,
                status: 'DRAFT',
                startDate,
                endDate,
                rentUF: body.monthlyRentUF ?? null,
              },
            })

      return { updatedProperty, contract }
    })

    return NextResponse.json(
      {
        property: result.updatedProperty,
        contract: result.contract,
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    console.error('[contracts renew POST]', e)
    return NextResponse.json(
      { error: 'Error al preparar la renovación del contrato' },
      { status: 500 }
    )
  }
}
