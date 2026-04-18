'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function EmailTester() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const testResendConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-resend')
      const data = await response.json()

      if (data.status === 'SUCCESS') {
        toast.success('✅ Resend está configurado correctamente', {
          description: `Email ID: ${data.emailId}`,
        })
      } else {
        toast.error('❌ Error en la configuración de Resend', {
          description: data.error || 'Error desconocido',
        })
      }
    } catch (error) {
      toast.error('❌ Error', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border p-6 bg-card space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">🧪 Prueba de Resend</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Verifica que la configuración de Resend está funcionando
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={testResendConfig}
          disabled={loading}
          className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90"
        >
          {loading ? 'Probando...' : '📧 Probar Resend'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Este botón envía un email de prueba a delivered@resend.dev y verifica toda la configuración.
        </p>
      </div>
    </div>
  )
}
