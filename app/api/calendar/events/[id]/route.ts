import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateEventSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  type: z.enum(["INSPECTION", "PAYMENT_DUE", "CONTRACT_RENEWAL", "IPC_ADJUSTMENT", "MAINTENANCE", "TENANT_REMINDER", "OTHER"]),
  date: z.string().transform(val => new Date(val)),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const data = updateEventSchema.parse(body)

    // Verificar que el evento existe y pertenece al usuario
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: id,
        createdBy: session.user.id,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado o sin permisos" },
        { status: 404 }
      )
    }

    // Actualizar el evento
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        date: data.date,
      },
      include: {
        property: {
          select: { address: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Evento actualizado exitosamente",
        data: updatedEvent,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
      return NextResponse.json(
        { error: messages },
        { status: 400 }
      )
    }
    console.error("Error updating calendar event:", error)
    return NextResponse.json(
      { error: "Error al actualizar el evento de calendario" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params

    // Verificar que el evento existe y pertenece al usuario
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: id,
        createdBy: session.user.id,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado o sin permisos" },
        { status: 404 }
      )
    }

    // Eliminar el evento
    await prisma.calendarEvent.delete({
      where: { id },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Evento eliminado exitosamente",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return NextResponse.json(
      { error: "Error al eliminar el evento de calendario" },
      { status: 500 }
    )
  }
}
