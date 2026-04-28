import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { assertPropertyAccess } from '@/lib/permissions'
import { generateApplicationSlug } from '@/lib/application-slug'

export async function POST(
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
        tenantId: true,
        applicationOpen: true,
        applicationSlug: true,
      },
    })

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    if (property.tenantId) {
      return NextResponse.json(
        { error: 'Solo puedes abrir postulaciones en propiedades sin arrendatario' },
        { status: 400 }
      )
    }

    const nextOpen = !property.applicationOpen
    let slug = property.applicationSlug

    if (nextOpen && !slug) {
      let unique = false
      while (!unique) {
        const candidate = generateApplicationSlug(property.address)
        const existing = await prisma.property.findUnique({
          where: { applicationSlug: candidate },
          select: { id: true },
        })
        if (!existing) {
          slug = candidate
          unique = true
        }
      }
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        applicationOpen: nextOpen,
        applicationSlug: slug,
      },
      select: {
        id: true,
        applicationOpen: true,
        applicationSlug: true,
      },
    })

    return NextResponse.json({ property: updated })
  } catch (error) {
    console.error('Error toggling application portal:', error)
    return NextResponse.json(
      { error: 'Error al actualizar portal de postulación' },
      { status: 500 }
    )
  }
}
