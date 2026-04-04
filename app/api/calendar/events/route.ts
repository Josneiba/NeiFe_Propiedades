import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-session"

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, type, date, reminder, notifyTenant, propertyId } = body

    // Basic validation
    if (!title || !type || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // // TODO: Persist event to database
    // // For now, we'll just acknowledge the request
    // const event = await prisma.calendarEvent.create({
    //   data: {
    //     title,
    //     description,
    //     type,
    //     date: new Date(date),
    //     reminder,
    //     notifyTenant,
    //     propertyId,
    //     createdBy: session.user.id,
    //   },
    // })

    // If notifyTenant is true, send notifications to tenants
    if (notifyTenant && propertyId) {
      try {
        // TODO: Send notifications to tenant of this property
        // const property = await prisma.property.findUnique({
        //   where: { id: propertyId },
        //   include: { tenant: true },
        // })

        // if (property?.tenant) {
        //   // Send notification via email/push
        //   await sendNotification({
        //     userId: property.tenant.id,
        //     title: `Nuevo evento: ${title}`,
        //     description,
        //     type: "EVENT_REMINDER",
        //   })
        // }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Event created and notifications sent",
        data: {
          title,
          description,
          type,
          date,
          reminder,
          notifyTenant,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating calendar event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
