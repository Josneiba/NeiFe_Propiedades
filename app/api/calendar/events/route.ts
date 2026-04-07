import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createEventSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  type: z.enum(["INSPECTION", "PAYMENT_DUE", "CONTRACT_RENEWAL", "IPC_ADJUSTMENT", "MAINTENANCE", "TENANT_REMINDER", "OTHER"]),
  date: z.string().transform(val => new Date(val)),
  reminder: z.number().optional(), // Días antes para recordatorio
  notifyTenant: z.boolean().default(false),
  propertyId: z.string().min(1, "Property ID es requerido"),
})

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createEventSchema.parse(body)

    // Verificar que la propiedad existe y pertenece al usuario
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        landlordId: session.user.id,
      },
      include: { tenant: true },
    })

    if (!property) {
      return NextResponse.json(
        { error: "Propiedad no encontrada o sin permisos" },
        { status: 404 }
      )
    }

    // Crear el evento
    const event = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        date: data.date,
        reminder: data.reminder,
        notifyTenant: data.notifyTenant,
        propertyId: data.propertyId,
        createdBy: session.user.id,
      },
    })

    // Si notifyTenant es true, crear notificación para el arrendatario
    if (data.notifyTenant && property.tenant) {
      await prisma.notification.create({
        data: {
          userId: property.tenant.id,
          type: "SYSTEM",
          title: `Nuevo evento: ${data.title}`,
          message: data.description || `Se ha programado un nuevo evento para tu propiedad`,
          link: `/mi-arriendo`,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Evento creado exitosamente",
        data: event,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
      return NextResponse.json(
        { error: messages },
        { status: 400 }
      )
    }
    console.error("Error creating calendar event:", error)
    return NextResponse.json(
      { error: "Error al crear el evento de calendario" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    let whereClause: any = {
      property: {
        landlordId: session.user.id,
      },
    }

    if (propertyId) {
      whereClause.propertyId = propertyId
    }

    // Filtrar por mes y año si se proporcionan
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "asc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    )
  }
}
