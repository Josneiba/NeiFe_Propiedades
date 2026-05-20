import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { assertPropertyAccess } from '@/lib/permissions'

const roomSchema = z.object({
  room: z.string().trim().min(1).max(80),
  condition: z.enum(['EXCELENTE', 'BUENA', 'REGULAR', 'MALA']),
  notes: z.string().optional().default(''),
  photos: z.array(z.string().url()).default([]),
})

const createChecklistSchema = z.object({
  type: z.enum(['CHECKIN', 'CHECKOUT']),
  rooms: z.array(roomSchema).min(1),
  overallCondition: z.string().optional(),
  tenantSignature: z.string().optional(),
  landlordSignature: z.string().optional(),
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

    const checklists = await prisma.propertyChecklist.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ checklists })
  } catch (error) {
    console.error('Error fetching checklists:', error)
    return NextResponse.json(
      { error: 'Error al obtener checklists' },
      { status: 500 }
    )
  }
}

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

    const body = await req.json()
    const data = createChecklistSchema.parse(body)

    const normalizedRooms = data.rooms
      .map((room) => ({
        ...room,
        room: room.room.trim(),
        notes: room.notes?.trim() ?? '',
      }))
      .filter(
        (room, index, array) =>
          array.findIndex((item) => item.room.toLowerCase() === room.room.toLowerCase()) === index
      )

    const checklist = await prisma.propertyChecklist.create({
      data: {
        propertyId: id,
        type: data.type,
        completedBy: session.user.id,
        rooms: normalizedRooms,
        overallCondition: data.overallCondition?.trim() || null,
        tenantSignature: data.tenantSignature,
        landlordSignature: data.landlordSignature,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ checklist }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    console.error('Error creating checklist:', error)
    return NextResponse.json(
      { error: 'Error al guardar checklist' },
      { status: 500 }
    )
  }
}
