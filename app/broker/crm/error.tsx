 'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [autoRedirect, setAutoRedirect] = useState(true)

  useEffect(() => {
    console.error('CRM error:', error)
    if (autoRedirect) {
      const timer = setTimeout(() => {
        router.push('/broker/crm/mi-dia')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, router, autoRedirect])

  const isEnvError = error.message?.includes('Variables de entorno')

  return (
    <div className="min-h-screen bg-[#1C2828] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#FAF6F2]">
            {isEnvError ? 'Configuración incompleta' : 'Error en CRM'}
          </h1>
          <p className="text-[#9C8578] text-sm leading-relaxed">
            {isEnvError
              ? 'Las variables de entorno no están correctamente configuradas. Si estás en producción (neifehome.com), configura las variables en Vercel.'
              : error.message || 'Ocurrió un error inesperado'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              reset()
              router.push('/broker/crm/mi-dia')
            }}
            className="w-full bg-[#C27F79] hover:bg-[#C27F79]/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Ir a Mi Día
          </button>
          <button
            onClick={() => {
              setAutoRedirect(false)
              reset()
            }}
            className="w-full bg-transparent border border-[#2D3C3C] text-[#D5C3B6] px-6 py-3 rounded-lg font-medium transition-colors hover:bg-[#2D3C3C]/30"
          >
            Reintentar aquí
          </button>
        </div>

        {autoRedirect && (
          <p className="text-xs text-[#9C8578]">
            Redireccionando a Mi Día en 3 segundos...
          </p>
        )}
      </div>
    </div>
  )
}

