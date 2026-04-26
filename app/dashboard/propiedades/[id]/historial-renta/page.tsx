"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, Loader2, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface RentAdjustment {
  id: string
  previousCLP: number
  newCLP: number
  previousUF: number | null
  newUF: number | null
  reason: string
  ipcRate: number | null
  effectiveDate: string
  notes: string | null
  createdAt: string
}

interface PropertyData {
  id: string
  name?: string
  address: string
  monthlyRentCLP: number | null
  monthlyRentUF: number | null
}

export default function HistorialRentaPage() {
  const params = useParams()
  const propertyId = params.id as string
  const { toast } = useToast()

  const [adjustments, setAdjustments] = useState<RentAdjustment[]>([])
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    newCLP: "",
    newUF: "",
    reason: "",
    ipcRate: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    notes: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [adjustmentsRes, propertyRes] = await Promise.all([
          fetch(`/api/properties/${propertyId}/rent-adjustments`),
          fetch(`/api/properties/${propertyId}`),
        ])

        if (!adjustmentsRes.ok || !propertyRes.ok) {
          throw new Error("Failed to load data")
        }

        const adjustmentsData = await adjustmentsRes.json()
        const propertyData = await propertyRes.json()

        setAdjustments(Array.isArray(adjustmentsData.adjustments) ? adjustmentsData.adjustments : [])
        setProperty(propertyData.property ?? propertyData)
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar el historial de renta",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [propertyId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.newCLP || !formData.reason.trim() || !formData.effectiveDate) {
      toast({
        title: "Error",
        description: "Completa los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch(`/api/properties/${propertyId}/rent-adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCLP: Number(formData.newCLP),
          ...(formData.newUF ? { newUF: Number(formData.newUF) } : {}),
          reason: formData.reason,
          ...(formData.ipcRate ? { ipcRate: Number(formData.ipcRate) } : {}),
          effectiveDate: new Date(formData.effectiveDate).toISOString(),
          ...(formData.notes ? { notes: formData.notes } : {}),
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "No se pudo registrar el ajuste")
      }

      setAdjustments((prev) => [result.adjustment, ...prev])
      setProperty((prev) =>
        prev
          ? {
              ...prev,
              monthlyRentCLP: Number(formData.newCLP),
              monthlyRentUF: formData.newUF ? Number(formData.newUF) : prev.monthlyRentUF,
            }
          : prev
      )
      setFormData({
        newCLP: "",
        newUF: "",
        reason: "",
        ipcRate: "",
        effectiveDate: new Date().toISOString().slice(0, 10),
        notes: "",
      })
      setDialogOpen(false)
      toast({
        title: "Ajuste registrado",
        description: "La renta fue actualizada correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar el ajuste",
        variant: "destructive",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={`/dashboard/propiedades/${propertyId}?tab=historial-renta`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" />
            Volver a la propiedad
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Historial de renta</h1>
          <p className="text-muted-foreground">
            {property?.name || property?.address}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Registrar ajuste
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Registrar ajuste de renta</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Guarda cambios por IPC, acuerdo directo o correcciones administrativas.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newCLP">Nuevo monto CLP</Label>
                <Input
                  id="newCLP"
                  type="number"
                  min="1"
                  value={formData.newCLP}
                  onChange={(e) => setFormData((prev) => ({ ...prev, newCLP: e.target.value }))}
                  className="bg-background border-input text-foreground"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newUF">Nuevo monto UF (opcional)</Label>
                  <Input
                    id="newUF"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={formData.newUF}
                    onChange={(e) => setFormData((prev) => ({ ...prev, newUF: e.target.value }))}
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipcRate">Tasa IPC (opcional)</Label>
                  <Input
                    id="ipcRate"
                    type="number"
                    min="0"
                    max="50"
                    step="0.01"
                    value={formData.ipcRate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ipcRate: e.target.value }))}
                    className="bg-background border-input text-foreground"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="IPC, Acuerdo, Correccion..."
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Fecha efectiva</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                    className="bg-background border-input text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="bg-background border-input text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Guardar ajuste
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Renta actual</p>
            <p className="text-2xl font-bold text-foreground">
              ${property?.monthlyRentCLP?.toLocaleString("es-CL") || "0"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Ajustes registrados</p>
            <p className="text-2xl font-bold text-foreground">{adjustments.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Ultimo motivo</p>
            <p className="text-lg font-semibold text-foreground">
              {adjustments[0]?.reason || "Sin ajustes"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#5E8B8C]" />
            Linea de tiempo de renta
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Trazabilidad completa de cada cambio de arriendo aplicado a la propiedad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aun no hay ajustes registrados para esta propiedad.
            </div>
          ) : (
            <div className="space-y-4">
              {adjustments.map((adjustment) => (
                <div key={adjustment.id} className="rounded-xl border border-border p-4 bg-background/40">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(adjustment.effectiveDate).toLocaleDateString("es-CL")}
                      </div>
                      <p className="text-lg font-semibold text-foreground">{adjustment.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        ${adjustment.previousCLP.toLocaleString("es-CL")} {"->"} ${adjustment.newCLP.toLocaleString("es-CL")}
                      </p>
                      {adjustment.ipcRate !== null && (
                        <p className="text-sm text-[#5E8B8C]">IPC aplicado: {adjustment.ipcRate}%</p>
                      )}
                      {adjustment.notes && (
                        <p className="text-sm text-muted-foreground">{adjustment.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Diferencia</p>
                      <p className="text-xl font-bold text-[#5E8B8C]">
                        ${(adjustment.newCLP - adjustment.previousCLP).toLocaleString("es-CL")}
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
