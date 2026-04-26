import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/cloudinary'
import { logUnauthorizedAccess } from '@/lib/activity'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const photoTypeSchema = z.enum(['CHECKIN', 'CHECKOUT', 'CURRENT', 'MAINTENANCE'])
const photoMetadataSchema = z.object({
  type: photoTypeSchema.default('CURRENT'),
  room: z.string().trim().min(1).max(80).default('General'),
  caption: z.string().trim().max(200).default(''),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id: propertyId } = await params
  const typeParam = req.nextUrl.searchParams.get('type')

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { landlordId: session.user.id },
        { tenantId: session.user.id },
        { mandates: { some: { brokerId: session.user.id, status: 'ACTIVE' } } },
      ],
    },
    select: { id: true },
  })

  if (!property) {
    logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const parsedType = typeParam ? photoTypeSchema.safeParse(typeParam) : null
  if (parsedType && !parsedType.success) {
    return NextResponse.json({ error: 'Tipo de foto inválido' }, { status: 400 })
  }

  const photos = await prisma.propertyPhoto.findMany({
    where: {
      propertyId,
      ...(parsedType?.success ? { type: parsedType.data } : {}),
    },
    orderBy: [{ type: 'asc' }, { order: 'asc' }, { takenAt: 'desc' }],
  })

  return NextResponse.json({ photos })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id: propertyId } = await params

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { landlordId: session.user.id },
        { mandates: { some: { brokerId: session.user.id, status: 'ACTIVE' } } },
      ],
    },
    select: { id: true },
  })

  if (!property) {
    logUnauthorizedAccess(session.user.id, session.user.role, req.nextUrl.pathname)
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
  }

  const parsedMetadata = photoMetadataSchema.safeParse({
    type: formData.get('type') || undefined,
    room: formData.get('room') || undefined,
    caption: formData.get('caption') || undefined,
  })

  if (!parsedMetadata.success) {
    return NextResponse.json(
      { error: parsedMetadata.error.errors[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Solo se permiten imágenes JPG, PNG o WebP' },
      { status: 400 }
    )
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'La imagen no puede superar 5MB' },
      { status: 400 }
    )
  }

  try {
    const buffer = await file.arrayBuffer()
    const filename = `${propertyId}-${parsedMetadata.data.type}-${Date.now()}`
    const url = await uploadFile(Buffer.from(buffer), 'properties', filename)

    const lastPhoto = await prisma.propertyPhoto.findFirst({
      where: { propertyId, type: parsedMetadata.data.type },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const photo = await prisma.propertyPhoto.create({
      data: {
        propertyId,
        url,
        type: parsedMetadata.data.type,
        room: parsedMetadata.data.room,
        caption: parsedMetadata.data.caption || null,
        order: (lastPhoto?.order ?? -1) + 1,
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    console.error('Error uploading property photo:', error)
    return NextResponse.json(
      { error: 'Error al subir la foto' },
      { status: 500 }
    )
  }
}
