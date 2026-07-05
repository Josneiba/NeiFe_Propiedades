 'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('CRM error:', error)
    const timer = setTimeout(() => {
      router.push('/broker/crm')
    }, 5000)
    return () => clearTimeout(timer)
  }, [error, router, reset])

  return (
    <div className="min-h-screen bg-[#1C1917] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <div className="text-2xl font-bold text-red-600">!</div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-[#FAF6F2] mb-4">Error en CRM</h1>
        <p className="text-[#9C8578] text-xl mb-8">{error.message || 'Ocurrió un error en la sección CRM'}</p>

        <div className="space-y-4">
          <button
            onClick={() => {
              reset()
              router.push('/broker/crm')
            }}
            className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6] px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Volver al CRM
          </button>
          <button
            onClick={() => reset()}
            className="w-full bg-transparent border border-[#2D3C3C] text-[#D5C3B6] px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>

        <div className="text-sm text-[#9C8578]">Si el problema persiste, contacta a soporte.</div>
      </div>
    </div>
  )
}
