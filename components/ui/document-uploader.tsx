'use client'

import { useRef, useState } from 'react'
import { FileText, Upload, X, Eye, Loader2, Download, Image as ImageIcon } from 'lucide-react'
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
}

function getFileType(url: string): 'pdf' | 'image' | 'unknown' {
  const lower = url.toLowerCase()
  if (lower.includes('/raw/') || lower.endsWith('.pdf')) return 'pdf'
  if (lower.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/)) return 'image'
  return 'unknown'
}

function getViewerUrl(url: string): string {
  const type = getFileType(url)
  if (type === 'pdf') {
    // Google Docs Viewer — abre PDFs en cualquier dispositivo sin descargar
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  }
  // Imágenes: abrir directamente
  return url
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
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState(currentUrl ?? null)

  const fileType = url ? getFileType(url) : null
  const viewerUrl = url ? getViewerUrl(url) : null

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
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
      {/* Título y botón quitar */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[#D5C3B6]">{label}</p>
          {description && (
            <p className="text-xs text-[#9C8578] mt-0.5">{description}</p>
          )}
        </div>
        {url && !disabled && (
          <button
            onClick={() => setUrl(null)}
            className="shrink-0 text-[#9C8578] hover:text-[#C27F79] transition-colors mt-0.5"
            title="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {url ? (
        /* Estado: archivo cargado */
        <div className="rounded-xl border border-[#5E8B8C]/25 bg-[#5E8B8C]/5 p-4">
          <div className="flex items-center gap-3">
            {/* Ícono del tipo de archivo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5E8B8C]/15">
              {fileType === 'image' ? (
                <ImageIcon className="h-5 w-5 text-[#5E8B8C]" />
              ) : (
                <FileText className="h-5 w-5 text-[#5E8B8C]" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#FAF6F2]">
                {fileType === 'pdf' ? 'Documento PDF' : fileType === 'image' ? 'Imagen' : 'Archivo'} subido
              </p>
              <p className="text-xs text-[#9C8578]">Haz click en el ojo para verlo</p>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1.5">
              {/* Ver: abre en nueva pestaña con Google Docs Viewer para PDF */}
              <a
                href={viewerUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 transition-colors"
                title={fileType === 'pdf' ? 'Ver PDF en visor' : 'Ver imagen'}
              >
                <Eye className="h-4 w-4" />
              </a>

              {/* Descargar: URL directa de Cloudinary */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 transition-colors"
                title="Descargar"
              >
                <Download className="h-4 w-4" />
              </a>

              {/* Reemplazar */}
              {!disabled && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 transition-colors"
                  title="Reemplazar archivo"
                >
                  <Upload className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Preview inline para imágenes */}
          {fileType === 'image' && (
            <div className="mt-3 overflow-hidden rounded-lg border border-[#D5C3B6]/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={label}
                className="w-full max-h-48 object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
      ) : (
        /* Estado: sin archivo — zona de clic */
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-[#D5C3B6]/15 bg-transparent p-6 text-center transition-all hover:border-[#5E8B8C]/40 hover:bg-[#5E8B8C]/5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-[#5E8B8C]" />
              <p className="text-sm text-[#9C8578]">Subiendo archivo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D5C3B6]/10">
                <Upload className="h-5 w-5 text-[#9C8578]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#D5C3B6]">
                  Subir {label.toLowerCase()}
                </p>
                <p className="text-xs text-[#9C8578] mt-0.5">
                  PDF, JPG o PNG · Máx. {maxSizeMB}MB
                </p>
              </div>
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
