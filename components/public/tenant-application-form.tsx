'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Paperclip, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { formatRut, normalizeRut, validateRut } from '@/lib/validate-rut'

export function TenantApplicationForm({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    monthlyIncome: '',
    currentEmployer: '',
    message: '',
  })

  const isRutValid = useMemo(() => {
    if (!form.rut) return true
    return validateRut(normalizeRut(form.rut))
  }, [form.rut])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const data = new FormData()
      data.append('file', file)
      const res = await fetch('/api/public/upload', {
        method: 'POST',
        body: data,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo subir el documento')

      setDocuments((current) => [...current, json.url])
      toast.success('Documento cargado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el documento')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!isRutValid) {
      toast.error('Ingresa un RUT válido')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ...form,
          rut: normalizeRut(form.rut),
          monthlyIncome: Number(form.monthlyIncome),
          documents,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'No se pudo enviar la postulación')
      }

      toast.success('Postulación enviada correctamente')
      setForm({
        name: '',
        email: '',
        phone: '',
        rut: '',
        monthlyIncome: '',
        currentEmployer: '',
        message: '',
      })
      setDocuments([])
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la postulación')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#D5C3B6]/12 bg-[#2D3C3C] p-6">
      <h2 className="text-xl font-serif font-semibold text-[#FAF6F2]">
        Completa tu postulación
      </h2>
      <p className="mt-2 text-sm text-[#9C8578]">
        Comparte tus datos y documentación para que el propietario o corredor evalúe tu perfil.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Nombre completo">
          <Input
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
            className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
          />
        </Field>
        <Field label="Teléfono">
          <Input
            value={form.phone}
            onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
            className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
          />
        </Field>
        <Field label="RUT">
          <Input
            value={form.rut}
            onChange={(e) =>
              setForm((current) => ({ ...current, rut: formatRut(e.target.value) }))
            }
            className={`bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2] ${
              !isRutValid ? 'border-red-500' : ''
            }`}
          />
        </Field>
        <Field label="Ingreso mensual líquido">
          <Input
            type="number"
            min="0"
            value={form.monthlyIncome}
            onChange={(e) =>
              setForm((current) => ({ ...current, monthlyIncome: e.target.value }))
            }
            className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
          />
        </Field>
        <Field label="Empleador actual">
          <Input
            value={form.currentEmployer}
            onChange={(e) =>
              setForm((current) => ({ ...current, currentEmployer: e.target.value }))
            }
            className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Mensaje">
          <Textarea
            rows={4}
            value={form.message}
            onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
            className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Label className="text-[#D5C3B6]">Documentos</Label>
        <div className="mt-2 rounded-xl border border-dashed border-[#D5C3B6]/20 bg-[#1C1917] p-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#5E8B8C]/30 px-4 py-2 text-sm text-[#5E8B8C] hover:bg-[#5E8B8C]/10">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Subiendo...' : 'Subir documento'}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }}
            />
          </label>
          <p className="mt-2 text-xs text-[#9C8578]">
            Liquidaciones, contrato de trabajo o respaldos de renta. Máximo 6 archivos.
          </p>
          {documents.length > 0 ? (
            <div className="mt-3 space-y-2">
              {documents.map((document, index) => (
                <a
                  key={document}
                  href={document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#D5C3B6] hover:text-[#FAF6F2]"
                >
                  <Paperclip className="h-4 w-4 text-[#5E8B8C]" />
                  Documento {index + 1}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={
          submitting ||
          uploading ||
          !form.name ||
          !form.email ||
          !form.phone ||
          !form.rut ||
          !form.monthlyIncome ||
          !isRutValid
        }
        className="mt-6 w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
      >
        {submitting ? 'Enviando postulación...' : 'Enviar postulación'}
      </Button>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[#D5C3B6]">{label}</Label>
      {children}
    </div>
  )
}
