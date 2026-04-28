'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Download, Upload, Loader2, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Props = {
  propertyId: string
  initialPdfUrl?: string | null
  initialStatus?: string | null
  tenantName?: string | null
  actorRole: 'LANDLORD' | 'OWNER' | 'BROKER'
}

export function ContractPdfActions({
  propertyId,
  initialPdfUrl,
  initialStatus,
  tenantName,
  actorRole,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl ?? null)
  const [status, setStatus] = useState(initialStatus ?? 'DRAFT')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)

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
      setStatus(cJson.contract?.status ?? 'DRAFT')
      toast({ title: 'Listo', description: 'Borrador de contrato guardado para esta propiedad' })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const sendForSignature = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/contracts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, action: 'send' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'No se pudo enviar',
          description: data.error || 'No se pudo notificar al arrendatario',
          variant: 'destructive',
        })
        return
      }
      setStatus(data.contract?.status ?? 'PENDING_SIGNATURES')
      toast({
        title: 'Contrato enviado',
        description: tenantName
          ? `Notificamos a ${tenantName} para revisar y firmar el contrato.`
          : 'El contrato fue marcado como enviado a firma.',
      })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const canSend = Boolean(pdfUrl) && Boolean(tenantName) && status !== 'ACTIVE'
  const alreadySent = status === 'PENDING_SIGNATURES'
  const isFinal = status === 'ACTIVE'
  const uploadLabel = isFinal
    ? 'Reemplazar copia final'
    : pdfUrl
      ? 'Reemplazar borrador PDF'
      : 'Subir borrador PDF'

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
        {uploadLabel}
      </Button>
      <Button
        type="button"
        className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
        disabled={!canSend || sending || uploading || alreadySent}
        onClick={sendForSignature}
      >
        {sending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        {alreadySent ? 'Enviado a firma' : `Enviar a ${tenantName ?? 'arrendatario'}`}
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
      {!tenantName ? (
        <p className="basis-full text-xs text-muted-foreground">
          Asigna un arrendatario a la propiedad para habilitar el envio dentro de la plataforma.
        </p>
      ) : pdfUrl ? (
        <p className="basis-full text-xs text-[#5E8B8C]">
          El borrador ya quedó guardado. Puedes reemplazarlo o enviarlo a firma cuando quieras.
        </p>
      ) : null}
      {actorRole === 'BROKER' ? (
        <p className="basis-full text-xs text-muted-foreground">
          Como corredor, puedes preparar y enviar el contrato sin sacarlo de NeiFe.
        </p>
      ) : null}
    </div>
  )
}
