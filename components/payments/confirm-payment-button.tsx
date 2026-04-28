'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Check, Loader2 } from 'lucide-react'

type ConfirmPaymentButtonProps = {
  paymentId: string
  className?: string
  label?: string
}

export function ConfirmPaymentButton({
  paymentId,
  className,
  label,
}: ConfirmPaymentButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paidAt: new Date().toISOString(),
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo confirmar el pago')
      }

      toast({
        title: 'Pago confirmado',
        description: 'El arrendatario ya fue notificado.',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo confirmar el pago',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      className={className ?? 'bg-green-600 hover:bg-green-700 text-white'}
      onClick={handleConfirm}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Check className="h-4 w-4" />
          {label ? <span className="ml-2">{label}</span> : null}
        </>
      )}
    </Button>
  )
}
