import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const postSchema = z.object({
  propertyId: z.string().min(1),
  pdfUrl: z.string().url(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const propertyId = req.nextUrl.searchParams.get('propertyId')

  const contracts = await prisma.contract.findMany({
    where: {
      property: { landlordId: session.user.id, isActive: true },
      ...(propertyId ? { propertyId } : {}),
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          commune: true,
          tenant: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ contracts })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'LANDLORD' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = postSchema.parse(await req.json())

    const property = await prisma.property.findFirst({
      where: { id: body.propertyId, landlordId: session.user.id, isActive: true },
      select: {
        id: true,
        contractStart: true,
        contractEnd: true,
        monthlyRentUF: true,
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const contract = await prisma.contract.create({
      data: {
        propertyId: body.propertyId,
        pdfUrl: body.pdfUrl,
        status: 'PENDING_SIGNATURES',
        startDate: property.contractStart,
        endDate: property.contractEnd,
        rentUF: property.monthlyRentUF ?? undefined,
      },
    })

    return NextResponse.json({ contract }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }
    console.error('[contracts POST]', e)
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 })
  }
}
