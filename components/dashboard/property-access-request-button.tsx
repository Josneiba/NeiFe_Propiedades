"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { UserPlus, Loader2, Send } from "lucide-react"

interface PropertyAccessRequestButtonProps {
  propertyId: string
  propertyName: string
  propertyAddress: string
  landlordId: string
  hasActiveMandate?: boolean
  hasPendingRequest?: boolean
}

export function PropertyAccessRequestButton({
  propertyId,
  propertyName,
  propertyAddress,
  landlordId,
  hasActiveMandate = false,
  hasPendingRequest = false
}: PropertyAccessRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      toast.error("Por favor incluye un mensaje para el propietario")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/property-access-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          message: message.trim()
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al enviar solicitud")
      }

      toast.success("Solicitud enviada exitosamente")
      setIsOpen(false)
      setMessage("")
      
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error("Error sending access request:", error)
      toast.error(error instanceof Error ? error.message : "Error al enviar solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasActiveMandate) {
    return (
      <Badge variant="secondary" className="gap-2">
        <UserPlus className="h-3 w-3" />
        Ya tienes acceso
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
          <DialogTitle>Solicitar acceso a propiedad</DialogTitle>
          <DialogDescription>
            Envía una solicitud al propietario para administrar esta propiedad.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="property-info" className="text-sm font-medium">
                Propiedad
              </Label>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p className="font-medium text-foreground">{propertyName}</p>
                <p>{propertyAddress}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                Mensaje para el propietario
              </Label>
              <Textarea
                id="message"
                placeholder="Escribe un mensaje explicando por qué deseas administrar esta propiedad..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                El propietario revisará tu solicitud y podrá aprobarla o rechazarla.
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
              disabled={isSubmitting || !message.trim()}
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
