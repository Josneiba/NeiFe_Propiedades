"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface GoogleCalendarButtonProps {
  dealId: string;
  dealTitle: string;
  dueDate?: string;
  propertyAddress?: string;
}

export function GoogleCalendarButton({
  dealId,
  dealTitle,
  dueDate,
  propertyAddress,
}: GoogleCalendarButtonProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  async function handleCreateEvent() {
    setLoading(true);
    try {
      // Preparar fecha — si no hay due date, usar mañana a las 10:00
      let startDate = new Date();
      if (dueDate) {
        startDate = new Date(dueDate);
      } else {
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(10, 0, 0, 0);
      }

      const res = await fetch("/api/calendar/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          title: `NeiFe: ${dealTitle}`,
          description: `Operación CRM\nPropiedad: ${propertyAddress || "Sin dirección"}`,
          startDate: startDate.toISOString(),
          location: propertyAddress || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al crear evento en Google Calendar");
        return;
      }

      toast.success("✅ Evento creado en Google Calendar");
      if (data.htmlLink) {
        window.open(data.htmlLink, "_blank");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al sincronizar con Google Calendar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCreateEvent}
      disabled={loading || !session}
      className="border-[#5E8B8C]/30 text-[#5E8B8C] hover:text-[#FAF6F2] hover:bg-[#5E8B8C]/10 h-9 px-2 gap-1.5"
      title={!session ? "Conecta con Google para usar esta función" : "Crear evento en Google Calendar"}
    >
      <Calendar className="h-3.5 w-3.5" />
      <span className="text-[10px]">{loading ? "..." : "Calendario"}</span>
    </Button>
  );
}
