'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Download, Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Props = {
  propertyId: string
  initialPdfUrl?: string | null
}

export function ContractPdfActions({ propertyId, initialPdfUrl }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl ?? null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'contracts')
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      const upJson = await up.json()
      if (!up.ok) {
        toast({
          title: 'Error al subir',
          description: upJson.error || 'No se pudo subir el archivo',
          variant: 'destructive',
        })
        return
      }
      const cRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, pdfUrl: upJson.url }),
      })
      const cJson = await cRes.json()
      if (!cRes.ok) {
        toast({
          title: 'Error',
          description: cJson.error || 'No se pudo registrar el contrato',
          variant: 'destructive',
        })
        return
      }
      setPdfUrl(upJson.url)
      toast({ title: 'Listo', description: 'Contrato PDF guardado para esta propiedad' })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void upload(f)
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="text-foreground border-border"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        Subir PDF
      </Button>
      {pdfUrl ? (
        <>
          <Button
            type="button"
            variant="outline"
            className="text-foreground border-border"
            onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver contrato
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-foreground border-border"
            asChild
          >
            <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </a>
          </Button>
        </>
      ) : null}
    </div>
  )
}
