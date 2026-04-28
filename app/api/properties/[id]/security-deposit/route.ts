import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { assertPropertyAccess } from '@/lib/permissions'

const depositSchema = z.object({
  amountCLP: z.coerce.number().int().positive(),
  receivedAt: z.string().optional(),
  receivedBy: z.string().min(2),
  status: z.enum(['HELD', 'RETURNED_FULL', 'RETURNED_PARTIAL', 'FORFEITED']).optional(),
  returnedAt: z.string().optional().nullable(),
  returnedAmountCLP: z.coerce.number().int().optional().nullable(),
  deductionsCLP: z.coerce.number().int().optional().nullable(),
  deductionNotes: z.string().optional().nullable(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    try {
      await assertPropertyAccess(id, session.user.id, session.user.role)
    } catch {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const deposit = await prisma.securityDeposit.findUnique({
      where: { propertyId: id },
    })

    return NextResponse.json({ deposit })
  } catch (error) {
    console.error('Error fetching security deposit:', error)
    return NextResponse.json(
      { error: 'Error al obtener garantía' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'LANDLORD' && session.user.role !== 'OWNER' && session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    try {
      await assertPropertyAccess(id, session.user.id, session.user.role)
    } catch {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const body = await req.json()
    const data = depositSchema.parse(body)

    const deposit = await prisma.securityDeposit.upsert({
      where: { propertyId: id },
      update: {
        amountCLP: data.amountCLP,
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
        receivedBy: data.receivedBy,
        status: data.status ?? 'HELD',
        returnedAt: data.returnedAt ? new Date(data.returnedAt) : null,
        returnedAmountCLP: data.returnedAmountCLP ?? null,
        deductionsCLP: data.deductionsCLP ?? null,
        deductionNotes: data.deductionNotes ?? null,
      },
      create: {
        propertyId: id,
        amountCLP: data.amountCLP,
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
        receivedBy: data.receivedBy,
        status: data.status ?? 'HELD',
        returnedAt: data.returnedAt ? new Date(data.returnedAt) : null,
        returnedAmountCLP: data.returnedAmountCLP ?? null,
        deductionsCLP: data.deductionsCLP ?? null,
        deductionNotes: data.deductionNotes ?? null,
      },
    })

    return NextResponse.json({ deposit })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    console.error('Error saving security deposit:', error)
    return NextResponse.json(
      { error: 'Error al guardar garantía' },
      { status: 500 }
    )
  }
}

export const PATCH = PUT
