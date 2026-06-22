/**
 * Helper para integración con Google Calendar API v3
 * Requiere que el usuario haya autenticado con OAuth 2.0 y tengas aceso al access_token
 */

import { google } from "googleapis";

/**
 * Crear cliente de Google Calendar autenticado
 */
export function getGoogleCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

/**
 * Crear un evento en Google Calendar del usuario
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
  }
) {
  const calendar = getGoogleCalendarClient(accessToken);
  const end =
    event.endDate ||
    new Date(event.startDate.getTime() + 60 * 60 * 1000); // 1 hora por defecto

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: "America/Santiago",
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "America/Santiago",
      },
    },
  });
  return res.data;
}

/**
 * Listar eventos próximos de Google Calendar
 */
export async function listUpcomingEvents(
  accessToken: string,
  maxResults = 10
) {
  const calendar = getGoogleCalendarClient(accessToken);
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items || [];
}

/**
 * Actualizar un evento en Google Calendar
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
  }
) {
  const calendar = getGoogleCalendarClient(accessToken);

  const res = await calendar.events.get({
    calendarId: "primary",
    eventId,
  });

  const event = res.data;
  if (!event) throw new Error("Event not found");

  const updateData: any = {};
  if (updates.title) updateData.summary = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.location) updateData.location = updates.location;
  if (updates.startDate) {
    updateData.start = {
      dateTime: updates.startDate.toISOString(),
      timeZone: "America/Santiago",
    };
  }
  if (updates.endDate) {
    updateData.end = {
      dateTime: updates.endDate.toISOString(),
      timeZone: "America/Santiago",
    };
  }

  const updateRes = await calendar.events.update({
    calendarId: "primary",
    eventId,
    requestBody: { ...event, ...updateData },
  });

  return updateRes.data;
}

/**
 * Eliminar un evento de Google Calendar
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
) {
  const calendar = getGoogleCalendarClient(accessToken);
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
  return true;
}
