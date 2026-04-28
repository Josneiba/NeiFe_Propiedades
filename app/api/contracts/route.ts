import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  canManageContracts,
  getManagedPropertiesWhere,
  notifyContractSigned,
  notifyTenantContractSent,
} from '@/lib/contracts'

const postSchema = z.object({
  propertyId: z.string().min(1),
  pdfUrl: z.string().url(),
})

const patchSchema = z.object({
  propertyId: z.string().min(1),
  action: z.enum(['send', 'tenant-sign']),
  pdfUrl: z.string().url().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!canManageContracts(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const propertyId = req.nextUrl.searchParams.get('propertyId')

  const contracts = await prisma.contract.findMany({
    where: {
      property: getManagedPropertiesWhere(session.user.id, session.user.role),
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

  if (!canManageContracts(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = postSchema.parse(await req.json())

    const property = await prisma.property.findFirst({
      where: {
        id: body.propertyId,
        ...getManagedPropertiesWhere(session.user.id, session.user.role),
      },
      select: {
        id: true,
        contractStart: true,
        contractEnd: true,
        monthlyRentUF: true,
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const latestContract = property.contracts[0] ?? null

    const contract =
      latestContract && latestContract.status !== 'ACTIVE' && latestContract.status !== 'EXPIRED'
        ? await prisma.contract.update({
            where: { id: latestContract.id },
            data: {
              pdfUrl: body.pdfUrl,
              status: 'DRAFT',
              landlordSign: null,
              tenantSign: null,
              signedAt: null,
              startDate: property.contractStart,
              endDate: property.contractEnd,
              rentUF: property.monthlyRentUF ?? undefined,
            },
          })
        : await prisma.contract.create({
            data: {
              propertyId: body.propertyId,
              pdfUrl: body.pdfUrl,
              status: 'DRAFT',
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

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = patchSchema.parse(await req.json())

    if (body.action === 'tenant-sign') {
      if (session.user.role !== 'TENANT') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      if (!body.pdfUrl) {
        return NextResponse.json({ error: 'Debes subir la copia firmada' }, { status: 400 })
      }

      const property = await prisma.property.findFirst({
        where: {
          id: body.propertyId,
          tenantId: session.user.id,
          isActive: true,
        },
        select: {
          id: true,
          address: true,
          landlordId: true,
          managedBy: true,
          contracts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true, landlordSign: true },
          },
        },
      })

      if (!property) {
        return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
      }

      const latestContract = property.contracts[0]
      if (!latestContract || latestContract.status !== 'PENDING_SIGNATURES') {
        return NextResponse.json({ error: 'No hay un contrato pendiente de firma' }, { status: 400 })
      }

      const contract = await prisma.contract.update({
        where: { id: latestContract.id },
        data: {
          pdfUrl: body.pdfUrl,
          tenantSign: session.user.name || session.user.email,
          signedAt: new Date(),
          status: 'ACTIVE',
        },
      })

      await prisma.contract.updateMany({
        where: {
          propertyId: property.id,
          id: { not: latestContract.id },
          status: 'ACTIVE',
        },
        data: {
          status: 'EXPIRED',
        },
      })

      await notifyContractSigned({
        landlordId: property.landlordId,
        brokerId: property.managedBy,
        propertyAddress: property.address,
        propertyId: property.id,
        tenantName: session.user.name || session.user.email || 'El arrendatario',
      })

      return NextResponse.json({ contract })
    }

    if (!canManageContracts(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const property = await prisma.property.findFirst({
      where: {
        id: body.propertyId,
        ...getManagedPropertiesWhere(session.user.id, session.user.role),
      },
      select: {
        id: true,
        address: true,
        tenant: {
          select: { id: true, name: true, email: true },
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, pdfUrl: true, status: true },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    if (!property.tenant?.id) {
      return NextResponse.json(
        { error: 'Debes asignar un arrendatario antes de enviar el contrato' },
        { status: 400 }
      )
    }

    const latestContract = property.contracts[0]
    if (!latestContract?.pdfUrl) {
      return NextResponse.json({ error: 'Primero sube el borrador del contrato' }, { status: 400 })
    }
    if (latestContract.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Este contrato ya esta consolidado como copia final firmada' },
        { status: 400 }
      )
    }

    const contract = await prisma.contract.update({
      where: { id: latestContract.id },
      data: {
        status: 'PENDING_SIGNATURES',
        landlordSign: session.user.name || session.user.email,
        tenantSign: null,
        signedAt: null,
      },
    })

    await notifyTenantContractSent({
      tenantId: property.tenant.id,
      propertyAddress: property.address,
      propertyId: property.id,
      senderName: session.user.name || session.user.email || 'NeiFe',
    })

    return NextResponse.json({ contract })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }
    console.error('[contracts PATCH]', e)
    return NextResponse.json({ error: 'Error al actualizar el flujo del contrato' }, { status: 500 })
  }
}
