/**
 * API endpoint para obtener recomendaciones personalizadas del corredor
 */

import { auth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/crm-recommendations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const contactId = url.searchParams.get('contactId') || undefined;

  try {
    const recommendations = await getRecommendations(session.user.id, contactId);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Error al generar recomendaciones" },
      { status: 500 }
    );
  }
}
