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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  TrendingUp,
  Plus,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  Percent,
} from "lucide-react"

interface IpcAdjustment {
  id: string
  scheduledDate: string
  ipcRate: number
  previousRentCLP: number
  newRentCLP: number
  status: "PENDING" | "APPLIED" | "SKIPPED"
  appliedAt: string | null
  notes: string | null
  createdAt: string
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPLIED: "Aplicado",
  SKIPPED: "Omitido"
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPLIED: "bg-green-100 text-green-800",
  SKIPPED: "bg-gray-100 text-gray-800"
}

export default function ReajustesPage() {
  const params = useParams()
  const propertyId = params.id as string
  const { toast } = useToast()

  const [adjustments, setAdjustments] = useState<IpcAdjustment[]>([])
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    ipcRate: ""
  })

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [adjustmentsRes, propertyRes] = await Promise.all([
          fetch(`/api/properties/${propertyId}/ipc-adjustments`),
          fetch(`/api/properties/${propertyId}`)
        ])

        if (!adjustmentsRes.ok || !propertyRes.ok) throw new Error("Failed to load data")
        
        const adjustmentsData = await adjustmentsRes.json()
        const propertyData = await propertyRes.json()
        
        setAdjustments(Array.isArray(adjustmentsData.adjustments) ? adjustmentsData.adjustments : [])
        setProperty(propertyData.property ?? propertyData)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [propertyId, toast])

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.ipcRate) {
      toast({
        title: "Error",
        description: "Por favor ingresa el porcentaje de IPC",
        variant: "destructive"
      })
      return
    }

    const ipcRate = parseFloat(formData.ipcRate)
    if (ipcRate < 0 || ipcRate > 50) {
      toast({
        title: "Error",
        description: "El IPC debe estar entre 0% y 50%",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch(`/api/properties/${propertyId}/ipc-adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipcRate: ipcRate
        })
      })

      if (!res.ok) throw new Error("Failed to apply IPC adjustment")
      
      const newAdjustment = await res.json()
      const created = newAdjustment.adjustment ?? newAdjustment
      setAdjustments([created, ...adjustments])
      
      // Refresh property to get updated rent
      const propertyRes = await fetch(`/api/properties/${propertyId}`)
      if (propertyRes.ok) {
        const updatedProperty = await propertyRes.json()
        setProperty(updatedProperty.property ?? updatedProperty)
      }
      
      toast({
        title: "Éxito",
        description: "Reajuste IPC aplicado correctamente"
      })

      setFormData({ ipcRate: "" })
      setDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aplicar el reajuste",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  const currentRent = property?.monthlyRentCLP || 0
  const nextAdjustment = adjustments?.find?.((a) => a.status === "PENDING")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reajuste por IPC</h1>
          <p className="text-muted-foreground">Gestiona los reajustes de arriendo por IPC</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Aplicar reajuste
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Aplicar reajuste por IPC</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Ingresa el porcentaje de IPC para calcular el nuevo arriendo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ipcRate" className="text-foreground">Porcentaje IPC (%)</Label>
                <Input
                  id="ipcRate"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  placeholder="Ej: 2.5"
                  value={formData.ipcRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, ipcRate: e.target.value }))}
                  className="bg-background border-input text-foreground"
                />
              </div>

              {formData.ipcRate && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Cálculo estimado:</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-foreground">Arriendo actual: <span className="font-semibold">${currentRent?.toLocaleString("es-CL")}</span></p>
                    <p className="text-foreground">
                      Nuevo arriendo: <span className="font-semibold text-[#5E8B8C]">
                        ${Math.round(currentRent * (1 + parseFloat(formData.ipcRate) / 100)).toLocaleString("es-CL")}
                      </span>
                    </p>
                    <p className="text-foreground">
                      Diferencia: <span className="font-semibold text-green-600">
                        +${(Math.round(currentRent * (1 + parseFloat(formData.ipcRate) / 100)) - currentRent).toLocaleString("es-CL")}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar y aplicar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current rent info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Información actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Arriendo actual</p>
              <p className="text-2xl font-bold text-foreground">
                ${currentRent.toLocaleString("es-CL")}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Último IPC aplicado</p>
              <p className="text-2xl font-bold text-foreground">
                {property?.lastIpcRate ? `${property.lastIpcRate}%` : "No aplicado"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Próximo reajuste estimado</p>
              <p className="text-lg font-semibold text-foreground">
                {property?.nextIpcDate ? new Date(property.nextIpcDate).toLocaleDateString("es-CL") : "No programado"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending adjustment info */}
      {nextAdjustment && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Reajuste pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-yellow-700">Fecha programada</p>
                <p className="font-semibold text-yellow-900">
                  {new Date(nextAdjustment.scheduledDate).toLocaleDateString("es-CL")}
                </p>
              </div>
              <div>
                <p className="text-sm text-yellow-700">IPC</p>
                <p className="font-semibold text-yellow-900">{nextAdjustment.ipcRate}%</p>
              </div>
              <div>
                <p className="text-sm text-yellow-700">Arriendo anterior</p>
                <p className="font-semibold text-yellow-900">
                  ${nextAdjustment.previousRentCLP.toLocaleString("es-CL")}
                </p>
              </div>
              <div>
                <p className="text-sm text-yellow-700">Nuevo arriendo</p>
                <p className="font-semibold text-yellow-900">
                  ${nextAdjustment.newRentCLP.toLocaleString("es-CL")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#5E8B8C]" />
            Historial de reajustes
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {adjustments.length === 0 ? "No hay reajustes registrados" : `${adjustments.length} reajuste(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay reajustes registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adjustments.map((adj) => (
                <div key={adj.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">
                          Reajuste {adj.ipcRate}%
                        </h4>
                        <Badge className={statusColors[adj.status]}>
                          {statusLabels[adj.status]}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {adj.appliedAt ? new Date(adj.appliedAt).toLocaleDateString("es-CL") : new Date(adj.scheduledDate).toLocaleDateString("es-CL")}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              ${adj.previousRentCLP.toLocaleString("es-CL")} → ${adj.newRentCLP.toLocaleString("es-CL")}
                            </span>
                          </div>
                        </div>
                        {adj.notes && (
                          <div className="text-muted-foreground italic">
                            Notas: {adj.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#5E8B8C]">
                        +${(adj.newRentCLP - adj.previousRentCLP).toLocaleString("es-CL")}
                      </p>
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
