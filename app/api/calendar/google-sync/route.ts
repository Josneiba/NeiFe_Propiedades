/**
 * API endpoint para sincronizar con Google Calendar
 * GET - obtener eventos próximos
 * POST - crear evento en Google Calendar desde operación CRM
 */

import { auth } from "@/lib/auth-session";
import { NextResponse, NextRequest } from "next/server";
import {
  createCalendarEvent,
  listUpcomingEvents,
} from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

// GET — traer eventos de Google Calendar del corredor
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  // Verificar si el usuario tiene access token de Google
  const accessToken = (session as any).accessToken;
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "No tienes Google Calendar conectado. Por favor, inicia sesión con tu cuenta de Google.",
      },
      { status: 401 }
    );
  }

  try {
    const events = await listUpcomingEvents(accessToken, 20);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error getting Google Calendar events:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos de Google Calendar" },
      { status: 500 }
    );
  }
}

// POST — crear evento en Google Calendar desde una operación CRM
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const accessToken = (session as any).accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google Calendar no está conectado" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { title, description, startDate, endDate, location, dealId } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { error: "Campos requeridos: title, startDate" },
        { status: 400 }
      );
    }

    const googleEvent = await createCalendarEvent(accessToken, {
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      location,
    });

    // Guardar referencia en la BD local si es una operación CRM
    if (dealId && googleEvent.id) {
      try {
        await prisma.crmActivity.create({
          data: {
            dealId,
            brokerId: session.user.id,
            type: "NOTA",
            title: `📅 Google Calendar: ${title}`,
            description: `Evento Google Calendar creado: ${title}\nID: ${googleEvent.id}\nURL: ${googleEvent.htmlLink}`,
            isDone: true,
            completedAt: new Date(),
          },
        });
      } catch (dbError) {
        console.error("Error saving activity reference:", dbError);
        // No fallar si no se puede guardar la referencia
      }
    }

    return NextResponse.json({
      googleEventId: googleEvent.id,
      htmlLink: googleEvent.htmlLink,
      title: googleEvent.summary,
    });
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Error al crear evento";
    return NextResponse.json(
      { error: `Error al crear evento en Google Calendar: ${errorMsg}` },
      { status: 500 }
    );
  }
}
