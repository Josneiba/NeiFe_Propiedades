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
    // Log error for debugging
    console.error('Global error:', error)

    // Don't redirect immediately, give user time to see the error
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [error, router, reset])

  return (
    <div className="min-h-screen bg-[#1C1917] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <div className="text-2xl font-bold text-red-600">!</div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-serif font-bold text-[#FAF6F2] mb-4">Algo salió mal</h1>
        <p className="text-[#9C8578] text-xl mb-8">
          {error.message || "Ocurrió un error al cargar la página"}
        </p>

        {/* Action Button */}
        <div className="space-y-4">
          <button
            onClick={() => {
              reset()
              router.push('/')
            }}
            className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6] px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Recargar la página
          </button>
        </div>

        {/* Additional Help */}
        <div className="text-sm text-[#9C8578]">
          Si el problema persiste, recarga la página o contacta soporte.
        </div>
      </div>
    </div>
  )
}
