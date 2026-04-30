'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BrokerErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#C27F79]/10">
        <AlertTriangle className="h-8 w-8 text-[#C27F79]/60" />
      </div>
      <h3 className="mb-2 font-medium text-[#FAF6F2]">No pudimos cargar esta sección</h3>
      <p className="mb-6 max-w-md text-sm text-[#9C8578]">
        {error.message || 'Ocurrió un problema inesperado. Vuelve a intentarlo en unos segundos.'}
      </p>
      <Button onClick={reset} className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90">
        Reintentar
      </Button>
    </div>
  )
}
