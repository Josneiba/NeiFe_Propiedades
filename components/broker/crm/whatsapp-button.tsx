'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/template-engine'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  phone: string
  message?: string
  size?: 'sm' | 'default'
  className?: string
  onAction?: () => void | Promise<void>
}

export function WhatsAppButton({
  phone,
  message = '',
  size = 'sm',
  className,
  onAction,
}: WhatsAppButtonProps) {
  async function handleClick() {
    const url = buildWhatsAppUrl(phone, message)
    const win = window.open(url, '_blank', 'noopener,noreferrer')

    try {
      await onAction?.()
    } catch (error) {
      console.error('Error registrando acción de WhatsApp:', error)
    }

    if (win) {
      win.focus()
    }
  }

  return (
    <Button
      size={size}
      onClick={handleClick}
      className={cn('bg-[#25D366] hover:bg-[#1ebe57] text-white gap-1.5', className)}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      WhatsApp
    </Button>
  )
}
