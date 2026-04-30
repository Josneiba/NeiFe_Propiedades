'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DocumentUploader } from '@/components/ui/document-uploader'

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
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl ?? null)
  const [status, setStatus] = useState(initialStatus ?? 'DRAFT')
  const [sending, setSending] = useState(false)

  const handleUpload = async (url: string) => {
    try {
      const cRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, pdfUrl: url }),
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
      setPdfUrl(url)
      setStatus(cJson.contract?.status ?? 'DRAFT')
      toast({ title: 'Listo', description: 'Borrador de contrato guardado para esta propiedad' })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
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

  return (
    <div className="space-y-4">
      <DocumentUploader
        label="Contrato PDF"
        description="Sube el contrato firmado en formato PDF"
        currentUrl={pdfUrl}
        folder="contracts"
        accept="application/pdf"
        onUpload={handleUpload}
      />
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
          disabled={!canSend || sending || alreadySent}
          onClick={sendForSignature}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {alreadySent ? 'Enviado a firma' : `Enviar a ${tenantName ?? 'arrendatario'}`}
        </Button>
      </div>
      {!tenantName ? (
        <p className="text-xs text-muted-foreground">
          Asigna un arrendatario a la propiedad para habilitar el envio dentro de la plataforma.
        </p>
      ) : pdfUrl ? (
        <p className="text-xs text-[#5E8B8C]">
          El borrador ya quedó guardado. Puedes reemplazarlo o enviarlo a firma cuando quieras.
        </p>
      ) : null}
      {actorRole === 'BROKER' ? (
        <p className="text-xs text-muted-foreground">
          Como corredor, puedes preparar y enviar el contrato sin sacarlo de NeiFe.
        </p>
      ) : null}
    </div>
  )
}
