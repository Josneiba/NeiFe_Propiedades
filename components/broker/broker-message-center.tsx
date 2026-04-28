'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Send } from 'lucide-react'

type PropertyOption = {
  id: string
  label: string
  tenantName: string | null
  tenantEmail: string | null
}

type MessageRecord = {
  id: string
  subject: string
  message: string
  type: 'GENERAL' | 'PAYMENT_REMINDER' | 'MAINTENANCE_VISIT' | 'CONTRACT_NOTICE'
  sendEmail: boolean
  emailStatus: 'NOT_REQUESTED' | 'SENT' | 'FAILED'
  emailProviderId?: string | null
  emailError?: string | null
  createdAt: string
  property: { name: string | null; address: string; commune: string }
  tenant: { name: string | null; email: string }
}

type Props = {
  properties: PropertyOption[]
  initialMessages: MessageRecord[]
}

const typeLabels: Record<MessageRecord['type'], string> = {
  GENERAL: 'Aviso general',
  PAYMENT_REMINDER: 'Recordatorio de pago',
  MAINTENANCE_VISIT: 'Visita técnica',
  CONTRACT_NOTICE: 'Aviso de contrato',
}

export function BrokerMessageCenter({ properties, initialMessages }: Props) {
  const { toast } = useToast()
  const [messages, setMessages] = useState(initialMessages)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    propertyId: properties[0]?.id ?? '',
    subject: '',
    message: '',
    type: 'GENERAL' as MessageRecord['type'],
    sendEmail: true,
  })

  const selectedProperty = properties.find((property) => property.id === form.propertyId) ?? null

  if (properties.length === 0) {
    return (
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-8 text-center">
          <p className="text-lg font-medium text-[#FAF6F2]">No tienes arrendatarios activos para avisar todavía.</p>
          <p className="mt-2 text-sm text-[#9C8578]">
            En cuanto una propiedad administrada tenga arrendatario asignado, aquí podrás enviar avisos con notificación y correo.
          </p>
        </CardContent>
      </Card>
    )
  }

  const sendMessage = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/broker/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'No se pudo enviar',
          description: data.error || 'Error al enviar el aviso',
          variant: 'destructive',
        })
        return
      }

      setMessages((current) => [data.message, ...current])
      setForm((current) => ({
        ...current,
        subject: '',
        message: '',
      }))

      const emailStatus = data.delivery?.emailStatus as MessageRecord['emailStatus'] | undefined
      toast({
        title: 'Aviso enviado',
        description: !form.sendEmail
          ? 'El arrendatario recibió notificación en la plataforma.'
          : emailStatus === 'SENT'
            ? 'La notificación quedó creada y Resend aceptó el correo.'
            : 'La notificación quedó creada, pero el correo no salió. Revisa la configuración de Resend.',
        variant: form.sendEmail && emailStatus === 'FAILED' ? 'destructive' : undefined,
      })
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el aviso',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#5E8B8C]" />
            Aviso al arrendatario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#D5C3B6]">Propiedad / arrendatario</Label>
            <select
              value={form.propertyId}
              onChange={(e) => setForm((current) => ({ ...current, propertyId: e.target.value }))}
              className="w-full rounded-md border border-[#D5C3B6]/10 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.label}
                </option>
              ))}
            </select>
            {selectedProperty?.tenantEmail ? (
              <p className="text-xs text-[#9C8578]">
                Destinatario: {selectedProperty.tenantName || selectedProperty.tenantEmail}
              </p>
            ) : null}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#D5C3B6]">Tipo</Label>
              <select
                value={form.type}
                onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as MessageRecord['type'] }))}
                className="w-full rounded-md border border-[#D5C3B6]/10 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className="mt-8 flex items-center gap-2 text-sm text-[#D5C3B6]">
              <input
                type="checkbox"
                checked={form.sendEmail}
                onChange={(e) => setForm((current) => ({ ...current, sendEmail: e.target.checked }))}
              />
              Enviar también por email
            </label>
          </div>

          <div className="space-y-2">
            <Label className="text-[#D5C3B6]">Asunto</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))}
              className="bg-[#1C1917] border-[#D5C3B6]/10 text-[#FAF6F2]"
              placeholder="Tu pago del mes está pendiente"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#D5C3B6]">Mensaje</Label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
              rows={6}
              className="w-full rounded-md border border-[#D5C3B6]/10 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
              placeholder="Hola, te recuerdo que el arriendo vence el día 5..."
            />
          </div>

          <Button
            type="button"
            onClick={sendMessage}
            disabled={sending || !form.propertyId || !form.subject || !form.message}
            className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
          >
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar aviso
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">Historial reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-[#9C8578]">Todavía no has enviado avisos.</p>
          ) : (
            messages.slice(0, 10).map((message) => (
              <div key={message.id} className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#FAF6F2]">{message.subject}</p>
                    <p className="text-xs text-[#9C8578]">
                      {message.tenant.name || message.tenant.email} · {message.property.name || message.property.address}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#5E8B8C]/15 px-2.5 py-1 text-xs text-[#5E8B8C]">
                    {typeLabels[message.type]}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#D5C3B6] whitespace-pre-wrap">{message.message}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-[#9C8578]">
                  <span>{new Date(message.createdAt).toLocaleString('es-CL')}</span>
                  <span>
                    {message.sendEmail
                      ? message.emailStatus === 'SENT'
                        ? 'Notificación + email enviado'
                        : 'Notificación + email fallido'
                      : 'Solo notificación'}
                  </span>
                </div>
                {message.sendEmail && message.emailStatus === 'FAILED' && message.emailError ? (
                  <p className="mt-2 text-xs text-[#C27F79]">{message.emailError}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
