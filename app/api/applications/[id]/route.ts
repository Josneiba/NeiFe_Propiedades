import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)

    const application = await prisma.tenantApplication.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            landlordId: true,
            managedBy: true,
            mandates: {
              where: { status: 'ACTIVE' },
              select: { brokerId: true },
            },
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 })
    }

    const canManage =
      application.property.landlordId === session.user.id ||
      application.property.managedBy === session.user.id ||
      application.property.mandates.some((mandate) => mandate.brokerId === session.user.id)

    if (!canManage) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const updated = await prisma.tenantApplication.update({
      where: { id },
      data: { status: data.status },
    })

    return NextResponse.json({ application: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la postulación' },
      { status: 500 }
    )
  }
}
