"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { UserPlus, Loader2, Send } from "lucide-react"

interface BrokerRequestButtonProps {
  landlordId: string
  propertyId?: string
  propertyName?: string
  propertyAddress?: string
  hasActivePermission?: boolean
  hasPendingRequest?: boolean
}

export function BrokerRequestButton({
  landlordId,
  propertyId,
  propertyName,
  propertyAddress,
  hasActivePermission = false,
  hasPendingRequest = false
}: BrokerRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)

    try {
      // Usar el sistema dual que siempre funciona
      const response = await fetch("/api/broker-permissions/dual-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          landlordId,
          propertyId,
          message: message.trim() || `Solicitud de acceso para administrar propiedades`
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al enviar solicitud")
      }

      const data = await response.json()
      
      toast.success("Solicitud enviada exitosamente", {
        description: propertyId 
          ? "El propietario recibirá notificaciones en ambos sistemas para aprobar tu acceso."
          : "El propietario recibirá una notificación para aprobar tu acceso."
      })
      
      setIsOpen(false)
      setMessage("")
      
      // Recargar la página para mostrar el estado actualizado
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Error sending request:", error)
      toast.error(error instanceof Error ? error.message : "Error al enviar solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasActivePermission) {
    return (
      <Badge variant="secondary" className="gap-2">
        <UserPlus className="h-3 w-3" />
        Acceso aprobado
      </Badge>
    )
  }

  if (hasPendingRequest) {
    return (
      <Badge variant="outline" className="gap-2 text-orange-600 border-orange-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        Solicitud pendiente
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Solicitar acceso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitar Acceso</DialogTitle>
          <DialogDescription>
            {propertyId 
              ? "Solicita acceso para administrar esta propiedad específica."
              : "Solicita acceso para administrar las propiedades de este propietario."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {propertyId && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Propiedad
                </Label>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p className="font-medium text-foreground">{propertyName}</p>
                  <p>{propertyAddress}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                Mensaje para el propietario
              </Label>
              <Textarea
                id="message"
                placeholder="Escribe un mensaje explicando por qué deseas administrar estas propiedades..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                El propietario revisará tu solicitud y podrá aprobarla o rechazarla.
                Se enviarán notificaciones a través de múltiples sistemas para asegurar entrega.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
