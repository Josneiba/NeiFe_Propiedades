'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, Download, Plus, File } from 'lucide-react'
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
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleAddAttachment(e: React.FormEvent) {
    e.preventDefault()
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.error('Nombre y URL requeridos')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/crm/deals/${dealId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileName.trim(),
          fileUrl: fileUrl.trim(),
          fileSize,
          mimeType: 'application/octet-stream',
        }),
      })

      if (!res.ok) throw new Error('Error al agregar attachment')

      toast.success('Archivo adjunto agregado')
      setFileName('')
      setFileUrl('')
      setFileSize(0)
      setShowForm(false)
      onUpdate()
    } catch {
      toast.error('Error al agregar archivo')
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
        <span>📎 Adjuntos ({attachments.length})</span>
        {showForm ? '▲' : '▼'}
      </button>

      {showForm && (
        <>
          <form onSubmit={handleAddAttachment} className="mb-3 p-3 bg-[#2D3C3C]/40 rounded-lg space-y-2">
            <input
              type="text"
              placeholder="Nombre del archivo"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full h-8 bg-[#2D3C3C] border border-[#D5C3B6]/15 rounded px-2 text-xs text-[#FAF6F2] placeholder:text-[#9C8578]/60 focus:outline-none focus:border-[#5E8B8C]/50"
            />
            <input
              type="url"
              placeholder="URL del archivo"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full h-8 bg-[#2D3C3C] border border-[#D5C3B6]/15 rounded px-2 text-xs text-[#FAF6F2] placeholder:text-[#9C8578]/60 focus:outline-none focus:border-[#5E8B8C]/50"
            />
            <input
              type="number"
              placeholder="Tamaño (bytes)"
              value={fileSize || ''}
              onChange={(e) => setFileSize(parseInt(e.target.value) || 0)}
              className="w-full h-8 bg-[#2D3C3C] border border-[#D5C3B6]/15 rounded px-2 text-xs text-[#FAF6F2] placeholder:text-[#9C8578]/60 focus:outline-none focus:border-[#5E8B8C]/50"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-8 bg-[#5E8B8C]/20 text-[#5E8B8C] hover:bg-[#5E8B8C]/30 disabled:opacity-50 text-xs"
              >
                {loading ? '...' : 'Agregar'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 h-8 bg-[#2D3C3C] border border-[#D5C3B6]/15 text-[#9C8578] hover:bg-[#2D3C3C]/80 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </form>
          <Separator className="bg-[#D5C3B6]/10 mb-3" />
        </>
      )}

      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-2 p-2 bg-[#2D3C3C]/40 rounded-lg group hover:bg-[#2D3C3C]/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#5E8B8C] hover:text-[#D5C3B6] transition-colors"
                >
                  <File className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{a.fileName}</span>
                </a>
                <div className="text-[10px] text-[#9C8578] mt-0.5">
                  {formatFileSize(a.fileSize)} • {new Date(a.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={a.fileUrl}
                  download
                  className="p-1 text-[#9C8578] hover:text-[#D5C3B6]"
                  title="Descargar"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleRemoveAttachment(a.id)}
                  disabled={removing === a.id}
                  className="p-1 text-[#9C8578] hover:text-red-400 disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#9C8578] py-2">Sin archivos adjuntos</p>
      )}
    </section>
  )
}
