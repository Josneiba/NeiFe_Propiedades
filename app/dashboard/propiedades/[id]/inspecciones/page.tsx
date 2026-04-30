"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { DocumentUploader } from "@/components/ui/document-uploader"

interface Inspection {
  id: string
  scheduledAt: string
  type: "ROUTINE" | "CHECKIN" | "CHECKOUT" | "MAINTENANCE" | "IPC_REVIEW"
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
  notes: string | null
  completedAt: string | null
  reportUrl: string | null
  createdAt: string
}

const inspectionTypeLabels: Record<string, string> = {
  ROUTINE: "Inspección Rutin",
  CHECKIN: "Revisión Inicial",
  CHECKOUT: "Revisión Final",
  MAINTENANCE: "Mantención",
  IPC_REVIEW: "Revisión IPC"
}

const inspectionStatusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reagendada"
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RESCHEDULED: "bg-orange-100 text-orange-800"
}

export default function InspeccionesPage() {
  const params = useParams()
  const propertyId = params.id as string
  const { toast } = useToast()

  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    scheduledAt: "",
    scheduledTime: "",
    type: "ROUTINE" as const,
    notes: ""
  })

  // Load inspections
  useEffect(() => {
    const loadInspections = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/inspections`)
        if (!res.ok) throw new Error("Failed to load inspections")
        const data = await res.json()
        setInspections(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las inspecciones",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadInspections()
  }, [propertyId, toast])

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.scheduledAt || !formData.scheduledTime) {
      toast({
        title: "Error",
        description: "Por favor completa la fecha y hora",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      const scheduledAt = new Date(`${formData.scheduledAt}T${formData.scheduledTime}`)

      const res = await fetch(`/api/properties/${propertyId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
          type: formData.type,
          notes: formData.notes || null
        })
      })

      if (!res.ok) throw new Error("Failed to create inspection")
      
      const newInspection = await res.json()
      setInspections([newInspection, ...inspections])
      
      toast({
        title: "Éxito",
        description: "Inspección programada correctamente"
      })

      setFormData({ scheduledAt: "", scheduledTime: "", type: "ROUTINE", notes: "" })
      setDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo programar la inspección",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete inspection
  const handleDeleteInspection = async (inspectionId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta inspección?")) return

    try {
      const res = await fetch(`/api/properties/${propertyId}/inspections/${inspectionId}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete inspection")
      
      setInspections(inspections.filter(i => i.id !== inspectionId))
      
      toast({
        title: "Éxito",
        description: "Inspección eliminada correctamente"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la inspección",
        variant: "destructive"
      })
    }
  }

  // Handle status update
  const handleStatusUpdate = async (inspectionId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) throw new Error("Failed to update status")

      const updated = await res.json()
      setInspections(inspections.map(i => i.id === inspectionId ? updated : i))

      toast({
        title: "Éxito",
        description: `Estado actualizado a ${inspectionStatusLabels[newStatus as keyof typeof inspectionStatusLabels]}`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    }
  }

  // Handle report upload
  const handleReportUpload = async (inspectionId: string, reportUrl: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/inspections/${inspectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportUrl })
      })

      if (!res.ok) throw new Error("Failed to update report")

      const updated = await res.json()
      setInspections(inspections.map(i => i.id === inspectionId ? updated : i))

      toast({
        title: "Éxito",
        description: "Acta de inspección subida correctamente"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el acta",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  const nextScheduled = inspections.find(i => i.status === "SCHEDULED" || i.status === "CONFIRMED")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inspecciones</h1>
          <p className="text-muted-foreground">Gestiona las inspecciones de la propiedad</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Programar inspección
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Programar nueva inspección</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Selecciona la fecha, hora y tipo de inspección
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-foreground">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="bg-background border-input text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-foreground">Tipo de inspección</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="ROUTINE">Inspección Rutinaria</SelectItem>
                    <SelectItem value="CHECKIN">Revisión Inicial</SelectItem>
                    <SelectItem value="CHECKOUT">Revisión Final</SelectItem>
                    <SelectItem value="MAINTENANCE">Mantención</SelectItem>
                    <SelectItem value="IPC_REVIEW">Revisión IPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">Notas (opcional)</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground placeholder:text-muted-foreground"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Programar inspección
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Next scheduled inspection */}
      {nextScheduled && (
        <Card className="bg-[#5E8B8C]/10 border-[#5E8B8C]/20">
          <CardHeader>
            <CardTitle className="text-[#5E8B8C] flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próxima inspección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha y hora</p>
                <p className="text-lg font-semibold text-foreground">
                  {new Date(nextScheduled.scheduledAt).toLocaleDateString("es-CL")} {new Date(nextScheduled.scheduledAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="text-lg font-semibold text-foreground">
                  {inspectionTypeLabels[nextScheduled.type]}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className={statusColors[nextScheduled.status]}>
                  {inspectionStatusLabels[nextScheduled.status]}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspections list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#5E8B8C]" />
            Historial de inspecciones
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {inspections.length === 0 ? "No hay inspecciones programadas" : `${inspections.length} inspección(es)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay inspecciones registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inspections.map((inspection) => (
                <div key={inspection.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">
                          {inspectionTypeLabels[inspection.type]}
                        </h4>
                        <Badge className={statusColors[inspection.status]}>
                          {inspectionStatusLabels[inspection.status]}
                        </Badge>
                      </div>
                      <div className="grid MD:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <p className="text-foreground">
                            {new Date(inspection.scheduledAt).toLocaleDateString("es-CL")} {new Date(inspection.scheduledAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {inspection.completedAt && (
                          <div>
                            <p className="text-foreground">Completada: {new Date(inspection.completedAt).toLocaleDateString("es-CL")}</p>
                          </div>
                        )}
                        {inspection.notes && (
                          <p className="col-span-2 text-foreground italic">Notas: {inspection.notes}</p>
                        )}
                      </div>
                      <div className="mt-3">
                        <DocumentUploader
                          label="Acta de inspección"
                          description="Sube el acta de inspección en formato PDF"
                          currentUrl={inspection.reportUrl}
                          folder="inspections"
                          accept="application/pdf"
                          onUpload={(url) => handleReportUpload(inspection.id, url)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(inspection.status === "SCHEDULED" || inspection.status === "CONFIRMED") && (
                        <Select onValueChange={(value) => handleStatusUpdate(inspection.id, value)} value="">
                          <SelectTrigger className="w-[140px] bg-background border-input text-foreground text-sm">
                            <SelectValue placeholder="Cambiar estado" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {inspection.status === "SCHEDULED" && (
                              <SelectItem value="CONFIRMED">Confirmar</SelectItem>
                            )}
                            {(inspection.status === "SCHEDULED" || inspection.status === "CONFIRMED") && (
                              <SelectItem value="COMPLETED">Marcar completada</SelectItem>
                            )}
                            <SelectItem value="CANCELLED">Cancelar</SelectItem>
                            <SelectItem value="RESCHEDULED">Reagendar</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteInspection(inspection.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
