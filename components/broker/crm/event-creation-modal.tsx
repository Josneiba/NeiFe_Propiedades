"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  code: string;
}

interface Deal {
  id: string;
  title: string;
  code: string;
}

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: {
    title: string;
    type: string;
    description?: string;
    scheduledAt: Date;
    dealId?: string;
    contactId?: string;
  }) => Promise<void>;
  initialDate?: Date;
  contacts?: Contact[];
  deals?: Deal[];
}

export function EventCreationModal({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  contacts = [],
  deals = [],
}: EventCreationModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string>(
    initialDate ? initialDate.toISOString().split("T")[0] : "",
  );
  const [time, setTime] = useState<string>("");
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!title) newErrors.title = "El título es obligatorio";
    if (!date) newErrors.date = "La fecha es obligatoria";
    if (!time) newErrors.time = "La hora es obligatoria";
    if (!eventType) newErrors.eventType = "El tipo es obligatorio";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor, completa todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const scheduledAt = new Date(date);
      const [hours, minutes] = time.split(":");
      scheduledAt.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      await onSubmit({
        title,
        type: eventType,
        description: description || undefined,
        scheduledAt,
        dealId: selectedDealId || undefined,
        contactId: selectedContactId || undefined,
      });
      toast.success("Evento creado con éxito");
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Error al crear el evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Evento</DialogTitle>
          <DialogDescription>
            Introduce los detalles del evento.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-title" className="text-right">
              Título
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-date" className="text-right">
              Fecha
            </Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-time" className="text-right">
              Hora
            </Label>
            <Input
              id="event-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-type" className="text-right">
              Tipo
            </Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Reunión</SelectItem>
                <SelectItem value="call">Llamada</SelectItem>
                <SelectItem value="task">Tarea</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-description" className="text-right">
              Descripción
            </Label>
            <Input
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Opcional"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-contact" className="text-right">
              Contacto Asociado
            </Label>
            <Select
              value={selectedContactId}
              onValueChange={setSelectedContactId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un contacto" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} ({contact.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-deal" className="text-right">
              Negocio Asociado
            </Label>
            <Select value={selectedDealId} onValueChange={setSelectedDealId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un negocio" />
              </SelectTrigger>
              <SelectContent>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.title} ({deal.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleFormSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
