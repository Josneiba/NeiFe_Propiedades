import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { assertPropertyAccess } from '@/lib/permissions'

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

    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        address: true,
        isPublished: true,
        applicationOpen: true,
        applicationSlug: true,
        tenantId: true,
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const applications = await prisma.tenantApplication.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ property, applications })
  } catch (error) {
    console.error('Error fetching property applications:', error)
    return NextResponse.json(
      { error: 'Error al obtener postulaciones' },
      { status: 500 }
    )
  }
}
