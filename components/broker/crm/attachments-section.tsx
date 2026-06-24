'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, Download, File, Upload, FileText, Image as ImageIcon, Music, Video } from 'lucide-react'
import { toast } from 'sonner'

interface Attachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType?: string | null
  createdAt: Date
}

interface AttachmentsSectionProps {
  dealId: string
  attachments: Attachment[]
  onUpdate: () => void
}

export function AttachmentsSection({ dealId, attachments, onUpdate }: AttachmentsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function getFileIcon(mimeType?: string | null) {
    if (!mimeType) return <File className="h-3.5 w-3.5" />
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-3.5 w-3.5" />
    if (mimeType.startsWith('audio/')) return <Music className="h-3.5 w-3.5" />
    if (mimeType.startsWith('video/')) return <Video className="h-3.5 w-3.5" />
    if (mimeType.includes('pdf')) return <FileText className="h-3.5 w-3.5" />
    return <File className="h-3.5 w-3.5" />
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  async function handleUploadFile() {
    if (!selectedFile) {
      toast.error('Selecciona un archivo')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch(`/api/crm/deals/${dealId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al agregar attachment')
      }

      toast.success('Archivo adjunto agregado')
      setSelectedFile(null)
      setShowForm(false)
      onUpdate()
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar archivo')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveAttachment(attachmentId: string) {
    setRemoving(attachmentId)
    try {
      const res = await fetch(`/api/crm/deals/${dealId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Error al eliminar')

      toast.success('Archivo eliminado')
      onUpdate()
    } catch {
      toast.error('Error al eliminar archivo')
    } finally {
      setRemoving(null)
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <section>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center justify-between w-full mb-2 text-xs font-semibold uppercase tracking-wide text-[#9C8578] hover:text-[#D5C3B6] transition-colors"
      >
        <span>Adjuntos ({attachments.length})</span>
        {showForm ? '▲' : '▼'}
      </button>

      {showForm && (
        <>
          <div className="mb-3 p-4 bg-[#2D3C3C]/40 rounded-lg space-y-3">
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragActive
                  ? 'border-[#5E8B8C]/50 bg-[#5E8B8C]/5'
                  : 'border-[#D5C3B6]/20 bg-[#1C2828]/40'
              }`}
            >
              <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragActive ? 'text-[#5E8B8C]' : 'text-[#9C8578]'}`} />
              <p className="text-xs text-[#FAF6F2] font-medium mb-1">Arrastra archivos aquí</p>
              <p className="text-[10px] text-[#9C8578] mb-3">o</p>
              <label>
                <input
                  type="file"
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept="*"
                />
                <span className="text-xs text-[#5E8B8C] hover:text-[#5E8B8C]/80 cursor-pointer underline">
                  haz clic para seleccionar
                </span>
              </label>
            </div>

            {selectedFile && (
              <div className="p-3 bg-[#1C2828]/60 rounded-lg border border-[#5E8B8C]/20">
                <div className="flex items-center gap-2 mb-2">
                  <File className="h-4 w-4 text-[#5E8B8C]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#FAF6F2] truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-[#9C8578]">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedFile(null)}
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 text-[#9C8578] hover:text-red-400 hover:bg-red-400/10"
                >
                  Cambiar archivo
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUploadFile}
                disabled={loading || !selectedFile}
                className="flex-1 h-8 bg-[#5E8B8C]/20 text-[#5E8B8C] hover:bg-[#5E8B8C]/30 disabled:opacity-50 text-xs"
              >
                {loading ? 'Subiendo...' : 'Subir archivo'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setSelectedFile(null)
                }}
                className="flex-1 h-8 bg-[#2D3C3C] border border-[#D5C3B6]/15 text-[#9C8578] hover:bg-[#2D3C3C]/80 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
          <Separator className="bg-[#D5C3B6]/10 mb-3" />
        </>
      )}

      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 p-3 bg-[#2D3C3C]/40 rounded-lg group hover:bg-[#2D3C3C]/60 transition-colors"
            >
              <div className="flex-shrink-0 text-[#5E8B8C]">
                {getFileIcon(a.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#5E8B8C] hover:text-[#D5C3B6] transition-colors block truncate"
                  title={a.fileName}
                >
                  {a.fileName}
                </a>
                <div className="text-[10px] text-[#9C8578] mt-1 flex items-center gap-2">
                  <span>{formatFileSize(a.fileSize)}</span>
                  <span>•</span>
                  <span>{new Date(a.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={a.fileUrl}
                  download
                  className="p-1 text-[#9C8578] hover:text-[#D5C3B6] hover:bg-[#1C2828]/50 rounded transition-colors"
                  title="Descargar"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleRemoveAttachment(a.id)}
                  disabled={removing === a.id}
                  className="p-1 text-[#9C8578] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#9C8578] italic">Sin adjuntos</p>
      )}
    </section>
  )
}
