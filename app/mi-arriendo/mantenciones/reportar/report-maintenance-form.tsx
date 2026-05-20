"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, Upload, Wrench } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/ui/page-header"
import { cn } from "@/lib/utils"

const categoryOptions = [
  {
    value: "PLUMBING",
    label: "Plomería",
    hint: "Filtraciones, llaves, WC, cañerías o baja presión.",
    landlordHint: "Normalmente corresponde al arrendador.",
  },
  {
    value: "ELECTRICAL",
    label: "Electricidad",
    hint: "Enchufes, interruptores, tablero o cortes internos.",
    landlordHint: "Normalmente corresponde al arrendador.",
  },
  {
    value: "STRUCTURAL",
    label: "Estructura",
    hint: "Muros, techumbre, humedad, puertas o ventanas.",
    landlordHint: "Normalmente corresponde al arrendador.",
  },
  {
    value: "APPLIANCES",
    label: "Electrodomésticos",
    hint: "Artefactos incluidos en el arriendo.",
    landlordHint: "Se revisa según inventario y causa.",
  },
  {
    value: "CLEANING",
    label: "Limpieza",
    hint: "Canaletas, retiro especial o sanitización puntual.",
    landlordHint: "Se revisa caso a caso.",
  },
  {
    value: "OTHER",
    label: "Otro",
    hint: "Si no encaja en las categorías anteriores.",
    landlordHint: "Describe el problema con el mayor detalle posible.",
  },
] as const

type CategoryValue = (typeof categoryOptions)[number]["value"]

interface ReportMaintenanceFormProps {
  property: {
    id: string
    address: string
    commune: string | null
    managedByUser: {
      name: string | null
    } | null
    landlord: {
      name: string | null
    }
  }
}

export function ReportMaintenanceForm({ property }: ReportMaintenanceFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<CategoryValue>("PLUMBING")
  const [description, setDescription] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const selectedCategory =
    categoryOptions.find((option) => option.value === category) ?? categoryOptions[0]

  const helperContact = property.managedByUser?.name || property.landlord.name || "tu arrendador"

  const handleFiles = (incoming: FileList | File[]) => {
    const nextFiles = Array.from(incoming)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    const validFiles = nextFiles.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" no es una imagen JPG, PNG o WEBP`)
        return false
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" supera el máximo de 10MB`)
        return false
      }

      return true
    })

    setPhotos((prev) => [...prev, ...validFiles].slice(0, 5))
  }

  const uploadPhotos = async () => {
    if (photos.length === 0) return []

    setUploading(true)

    try {
      return await Promise.all(
        photos.map(async (photo) => {
          const formData = new FormData()
          formData.append("file", photo)
          formData.append("folder", "maintenance")

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("No se pudo subir una de las imágenes")
          }

          const data = await response.json()
          return data.url as string
        })
      )
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (description.trim().length < 10) {
      toast.error("Describe la falla con al menos 10 caracteres")
      return
    }

    setSubmitting(true)

    try {
      const photoUrls = await uploadPhotos()

      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: property.id,
          category,
          description: description.trim(),
          photos: photoUrls,
        }),
      })

      if (!response.ok) {
        throw new Error("No se pudo registrar la mantención")
      }

      toast.success("Solicitud enviada correctamente")
      router.push("/mi-arriendo/mantenciones")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("No pudimos registrar la solicitud. Intenta nuevamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportar mantención"
        description="Describe la falla y adjunta imágenes para que el equipo pueda revisarla más rápido."
        action={
          <Button
            variant="outline"
            className="border-[#D5C3B6]/20 bg-transparent text-[#D5C3B6] hover:bg-[#D5C3B6]/10 hover:text-[#FAF6F2]"
            asChild
          >
            <Link href="/mi-arriendo/mantenciones">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/60 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">Propiedad</p>
                  <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{property.address}</p>
                  {property.commune ? (
                    <p className="mt-1 text-xs text-[#9C8578]">{property.commune}</p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/60 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#B8965A]">Canal de gestión</p>
                  <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{helperContact}</p>
                  <p className="mt-1 text-xs text-[#9C8578]">
                    Recibirá el reporte y podrá coordinar la revisión.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-[#D5C3B6]">
                  Tipo de problema
                </Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {categoryOptions.map((option) => {
                    const active = option.value === category
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCategory(option.value)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-[#5E8B8C] bg-[#5E8B8C]/10"
                            : "border-[#D5C3B6]/10 bg-[#1C1917]/50 hover:border-[#D5C3B6]/20"
                        )}
                      >
                        <p className="text-sm font-semibold text-[#FAF6F2]">{option.label}</p>
                        <p className="mt-1 text-xs text-[#9C8578]">{option.hint}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[#D5C3B6]">
                  Qué está pasando
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ejemplo: hay filtración bajo el lavaplatos desde ayer, el mueble se está mojando y empeora al abrir la llave."
                  className="min-h-[140px]"
                  required
                />
                <p className="text-xs text-[#9C8578]">
                  Incluye desde cuándo ocurre, qué tan urgente es y si afecta seguridad, agua o electricidad.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div>
                    <Label htmlFor="photos" className="text-[#D5C3B6]">
                      Fotos de apoyo
                    </Label>
                    <p className="mt-1 text-xs text-[#9C8578]">
                      Puedes subir hasta 5 imágenes para mostrar mejor el problema.
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  id="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = event.target.files
                    if (files) handleFiles(files)
                    event.currentTarget.value = ""
                  }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragOver(false)
                    if (event.dataTransfer.files.length > 0) {
                      handleFiles(event.dataTransfer.files)
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
                    dragOver
                      ? "border-[#5E8B8C] bg-[#5E8B8C]/10"
                      : "border-[#D5C3B6]/20 bg-[#1C1917]/40 hover:border-[#75524C]/40"
                  )}
                >
                  <Upload className="mx-auto h-8 w-8 text-[#9C8578]" />
                  <p className="mt-3 text-sm text-[#D5C3B6]">Arrastra imágenes aquí o haz clic para seleccionarlas</p>
                  <p className="mt-1 text-xs text-[#9C8578]">JPG, PNG o WEBP. Máximo 10MB por imagen.</p>
                </div>

                {photos.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {photos.map((photo, index) => (
                      <div
                        key={`${photo.name}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/60 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#FAF6F2]">{photo.name}</p>
                          <p className="text-xs text-[#9C8578]">
                            {(photo.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, current) => current !== index))}
                          className="text-xs font-medium text-[#C27F79] transition-colors hover:text-[#FAF6F2]"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#D5C3B6]/10 pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#D5C3B6]/20 bg-transparent text-[#D5C3B6] hover:bg-[#D5C3B6]/10 hover:text-[#FAF6F2]"
                  asChild
                >
                  <Link href="/mi-arriendo/mantenciones">Cancelar</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || uploading}
                  className="bg-[#75524C] text-[#FAF6F2] hover:bg-[#75524C]/90"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                  {uploading ? "Subiendo imágenes..." : submitting ? "Enviando solicitud..." : "Enviar solicitud"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A]">Orientación rápida</p>
              <p className="mt-3 text-sm font-semibold text-[#FAF6F2]">{selectedCategory.label}</p>
              <p className="mt-2 text-sm text-[#9C8578]">{selectedCategory.landlordHint}</p>
            </CardContent>
          </Card>

          <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#5E8B8C]" />
                <p className="text-sm text-[#9C8578]">
                  Mientras más específico sea el texto, más rápido se puede evaluar la solicitud.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#5E8B8C]" />
                <p className="text-sm text-[#9C8578]">
                  Si hay riesgo eléctrico, filtración activa o inseguridad, indícalo claramente en la descripción.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#5E8B8C]" />
                <p className="text-sm text-[#9C8578]">
                  El historial quedará visible en tu módulo de mantenciones una vez enviado.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
