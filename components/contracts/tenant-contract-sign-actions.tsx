'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileSignature,
  Loader2,
  Upload,
} from 'lucide-react'

type Props = {
  propertyId: string
  pdfUrl: string | null
  status: string | null
}

export function TenantContractSignActions({ propertyId, pdfUrl, status }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const uploadSignedCopy = async (file: File) => {
    setUploading(true)
    setSelectedFileName(file.name)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'contracts')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      })
      const uploadJson = await uploadRes.json()

      if (!uploadRes.ok) {
        toast({
          title: 'No se pudo subir',
          description: uploadJson.error || 'No se pudo cargar el PDF firmado',
          variant: 'destructive',
        })
        return
      }

      const signRes = await fetch('/api/contracts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          action: 'tenant-sign',
          pdfUrl: uploadJson.url,
        }),
      })
      const signJson = await signRes.json()

      if (!signRes.ok) {
        toast({
          title: 'No se pudo guardar',
          description: signJson.error || 'No se pudo registrar tu copia firmada',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Contrato firmado',
        description: 'Tu copia firmada ya quedo como version final del contrato.',
      })
      router.refresh()
    } catch {
      toast({
        title: 'Error',
        description: 'Error de conexión al subir la copia firmada',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const signingState = useMemo(() => {
    if (status === 'ACTIVE' || status === 'EXPIRING_SOON') {
      return {
        tone: 'success',
        title: 'Contrato consolidado',
        description: 'La copia firmada ya quedó registrada como versión final del contrato.',
      }
    }

    if (status === 'PENDING_SIGNATURES') {
      return {
        tone: 'warning',
        title: 'Firma pendiente',
        description: 'Descarga el PDF, fírmalo y súbelo aquí para dejarlo activo en la plataforma.',
      }
    }

    return {
      tone: 'neutral',
      title: 'Esperando envío',
      description: 'Cuando el arrendador envíe el contrato para firma, podrás completar el proceso desde aquí.',
    }
  }, [status])

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void uploadSignedCopy(file)
        }}
      />

      <div
        className={`rounded-xl border p-4 ${
          signingState.tone === 'success'
            ? 'border-[#5E8B8C]/30 bg-[#5E8B8C]/10'
            : signingState.tone === 'warning'
              ? 'border-[#F2C94C]/20 bg-[#F2C94C]/10'
              : 'border-[#D5C3B6]/15 bg-[#1C1917]/40'
        }`}
      >
        <div className="flex items-start gap-3">
          {signingState.tone === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#5E8B8C]" />
          ) : signingState.tone === 'warning' ? (
            <FileSignature className="mt-0.5 h-5 w-5 text-[#F2C94C]" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 text-[#9C8578]" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#FAF6F2]">{signingState.title}</p>
            <p className="text-xs text-[#9C8578]">{signingState.description}</p>
            {selectedFileName ? (
              <p className="text-xs text-[#D5C3B6]">Último archivo seleccionado: {selectedFileName}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {pdfUrl ? (
          <>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Eye className="h-4 w-4" />
              Ver contrato
            </a>
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </a>
          </>
        ) : null}

        {status === 'PENDING_SIGNATURES' ? (
          <Button
            type="button"
            className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Subir copia firmada
          </Button>
        ) : null}
      </div>

      {status === 'PENDING_SIGNATURES' ? (
        <div className="space-y-1 rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917]/40 p-3 text-xs text-muted-foreground">
          <p>1. Descarga y revisa el PDF enviado por el arrendador.</p>
          <p>2. Firma el documento fuera de la plataforma.</p>
          <p>3. Sube aquí la copia final en PDF para activarlo.</p>
        </div>
      ) : null}
    </div>
  )
}
