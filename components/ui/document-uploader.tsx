'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Upload, X, Eye, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentUploaderProps {
  label: string
  description?: string
  currentUrl?: string | null
  onUpload: (url: string) => void | Promise<void>
  folder?: string
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  showPreview?: boolean
}

export function DocumentUploader({
  label,
  description,
  currentUrl,
  onUpload,
  folder = 'documents',
  accept = 'application/pdf,image/jpeg,image/png,image/webp',
  maxSizeMB = 10,
  disabled = false,
  showPreview = true,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState(currentUrl ?? null)
  const isPdf = url?.includes('.pdf') || url?.includes('/raw/')
  
  // Usar proxy para PDFs para asegurar Content-Type correcto
  const viewUrl: string | null = isPdf && url ? `/api/pdf/${encodeURIComponent(url)}` : url

  const handleFile = async (file: File) => {
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error(`El archivo no puede superar ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al subir el archivo')
        return
      }

      setUrl(data.url)
      await onUpload(data.url)
      toast.success(`${label} subido correctamente`)
    } catch {
      toast.error('Error de conexión al subir el archivo')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#D5C3B6]">{label}</p>
          {description && <p className="text-xs text-[#9C8578]">{description}</p>}
        </div>
        {url && (
          <button
            onClick={() => { setUrl(null) }}
            className="text-[#9C8578] hover:text-[#C27F79] transition-colors"
            title="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {url ? (
        // Vista cuando hay archivo subido
        <div className="flex items-center gap-3 rounded-lg border border-[#5E8B8C]/30 bg-[#5E8B8C]/5 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5E8B8C]/15">
            <FileText className="h-5 w-5 text-[#5E8B8C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#FAF6F2] truncate">
              {isPdf ? 'Documento PDF subido' : 'Imagen subida'}
            </p>
            <p className="text-xs text-[#9C8578]">Listo para usar</p>
          </div>
          <div className="flex gap-1">
            {showPreview && viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 transition-colors"
                title="Ver documento"
              >
                <Eye className="h-4 w-4" />
              </a>
            )}
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 transition-colors"
              title="Descargar"
            >
              <Download className="h-4 w-4" />
            </a>
            {!disabled && (
              <button
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 transition-colors"
                title="Reemplazar"
              >
                <Upload className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        // Zona de drop cuando no hay archivo
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-[#D5C3B6]/20 bg-[#1C1917]/50 p-6 text-center transition-colors hover:border-[#5E8B8C]/50 hover:bg-[#5E8B8C]/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
              <p className="text-sm text-[#9C8578]">Subiendo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-[#9C8578]" />
              <p className="text-sm font-medium text-[#D5C3B6]">
                Haz click para subir {label.toLowerCase()}
              </p>
              <p className="text-xs text-[#9C8578]">
                PDF, JPG, PNG o WebP · Máx. {maxSizeMB}MB
              </p>
            </div>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
