'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, Copy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  payment: {
    id: string
    month: string
    year: number
    amountCLP: number
    water: number
    electricity: number
    gas?: number
  } | null
  bankDetails: {
    bank: string
    accountType: string
    accountNumber: string
    documentLabel: string
    documentNumber: string
    ownerName: string
    email: string
  }
}

type Step = 'details' | 'upload' | 'success'

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  payment,
  bankDetails
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>('details')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!payment) return null

  const total = payment.amountCLP + payment.water + payment.electricity + (payment.gas ?? 0)
  const formattedTotal = total.toLocaleString('es-CL')

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  }

  const handleFile = (f: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(f.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG, WEBP o PDF')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10MB')
      return
    }
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)

    try {
      // 1. Subir comprobante a Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'boletas')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Error al subir comprobante')
      const { url } = await uploadRes.json()

      // 2. Actualizar estado del pago a PROCESSING con URL del comprobante
      const paymentRes = await fetch(`/api/payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PROCESSING',
          method: 'transfer',
          receipt: url,
          notes: 'Comprobante de transferencia subido por arrendatario',
        }),
      })

      if (!paymentRes.ok) throw new Error('Error al registrar el pago')

      setStep('success')
      onSuccess?.()
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error. Intenta nuevamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setStep('details')
    setFile(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[calc(100%-32px)] mx-auto max-h-[90vh] overflow-y-auto bg-[#FAF6F2] border-[#D5C3B6]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#1C1917]">
            {step === 'details' && 'Datos para transferencia'}
            {step === 'upload' && 'Subir comprobante'}
            {step === 'success' && 'Pago en revisión'}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — Desglose y datos bancarios */}
        {step === 'details' && (
          <div className="space-y-4">
            {/* Desglose del pago */}
            <div className="bg-white rounded-lg p-4 space-y-2 border border-[#D5C3B6]/20">
              <p className="text-xs uppercase tracking-widest text-[#9C8578] mb-3">
                Detalle del pago — {payment.month}
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-[#9C8578]">Arriendo</span>
                <span className="font-mono text-[#1C1917]">
                  ${payment.amountCLP.toLocaleString('es-CL')}
                </span>
              </div>
              {payment.water > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#9C8578]">Agua</span>
                  <span className="font-mono text-[#1C1917]">
                    ${payment.water.toLocaleString('es-CL')}
                  </span>
                </div>
              )}
              {payment.electricity > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#9C8578]">Luz</span>
                  <span className="font-mono text-[#1C1917]">
                    ${payment.electricity.toLocaleString('es-CL')}
                  </span>
                </div>
              )}
              {(payment.gas ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#9C8578]">Gas</span>
                  <span className="font-mono text-[#1C1917]">
                    ${(payment.gas ?? 0).toLocaleString('es-CL')}
                  </span>
                </div>
              )}
              <div className="border-t border-[#D5C3B6] pt-2 flex justify-between">
                <span className="font-medium text-[#1C1917]">Total a transferir</span>
                <span className="font-mono font-bold text-[#5E8B8C] text-lg">
                  ${formattedTotal}
                </span>
              </div>
            </div>

            {/* Datos bancarios */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-[#9C8578]">
                Datos de transferencia
              </p>
              {[
                { label: 'Banco', value: bankDetails.bank },
                { label: 'Tipo de cuenta', value: bankDetails.accountType },
                { label: 'N° de cuenta', value: bankDetails.accountNumber },
                { label: bankDetails.documentLabel, value: bankDetails.documentNumber },
                { label: 'Nombre', value: bankDetails.ownerName },
                { label: 'Email', value: bankDetails.email },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between bg-white border border-[#D5C3B6]/20 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="text-xs text-[#9C8578]">{label}</p>
                    <p className="text-sm font-medium text-[#1C1917] font-mono">{value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(value, label)}
                    className="p-1.5 hover:bg-[#D5C3B6]/20 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#9C8578]" />
                  </button>
                </div>
              ))}
            </div>

            {/* Instrucciones */}
            <div className="bg-[#5E8B8C]/10 border border-[#5E8B8C]/20 rounded-lg p-3">
              <p className="text-xs text-[#5E8B8C] leading-relaxed">
                Transfiere exactamente <strong>${formattedTotal}</strong> e incluye
                tu documento de identificacion en el mensaje/glosa de la transferencia.
              </p>
            </div>

            <Button
              onClick={() => setStep('upload')}
              className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
            >
              Ya realicé la transferencia →
            </Button>
          </div>
        )}

        {/* STEP 2 — Subir comprobante */}
        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-[#9C8578]">
              Sube el comprobante de la transferencia para que tu arrendador
              pueda verificarla y confirmar tu pago.
            </p>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${dragOver
                  ? 'border-[#5E8B8C] bg-[#5E8B8C]/5'
                  : file
                    ? 'border-[#5E8B8C] bg-[#5E8B8C]/5'
                    : 'border-[#D5C3B6] hover:border-[#75524C]/50'
                }
              `}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              {file ? (
                <div>
                  <CheckCircle2 className="w-8 h-8 text-[#5E8B8C] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1C1917]">{file.name}</p>
                  <p className="text-xs text-[#9C8578] mt-1">
                    {(file.size / 1024).toFixed(0)} KB — clic para cambiar
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-[#9C8578] mx-auto mb-2" />
                  <p className="text-sm text-[#9C8578]">
                    Arrastra tu comprobante aquí o haz clic
                  </p>
                  <p className="text-xs text-[#9C8578]/60 mt-1">
                    JPG, PNG, WEBP o PDF — máximo 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Aviso */}
            <div className="flex gap-2 bg-[#F2C94C]/10 border border-[#F2C94C]/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-[#F2C94C] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#9C8578]">
                Tu pago quedará en estado "En revisión" hasta que tu arrendador
                confirme la transferencia. Recibirás una notificación cuando sea confirmado.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="flex-1 border-[#D5C3B6] text-[#1C1917] hover:bg-[#D5C3B6]/10"
                disabled={uploading}
              >
                ← Volver
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!file || uploading}
                className="flex-1 bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
              >
                {uploading ? 'Enviando...' : 'Enviar comprobante'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Éxito */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-[#5E8B8C]/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#5E8B8C]" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-[#1C1917] mb-2">
                Comprobante enviado
              </h3>
              <p className="text-sm text-[#9C8578]">
                Tu arrendador revisará la transferencia y confirmará tu pago.
                Recibirás una notificación cuando sea aprobado.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
            >
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
