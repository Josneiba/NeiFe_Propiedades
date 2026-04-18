'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#1C1917] flex flex-col items-center justify-center text-center p-8">
      <div className="max-w-lg w-full space-y-8">
        {/* 404 Icon */}
        <div className="w-32 h-32 rounded-full bg-[#5E8B8C]/10 flex items-center justify-center mb-8">
          <Search className="h-16 w-16 text-[#5E8B8C]" />
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-serif font-bold text-[#FAF6F2] mb-4">404</h1>
          <p className="text-[#9C8578] text-xl mb-8">Página no encontrada</p>
          <p className="text-[#D5C3B6] mb-8 max-w-md">
            La página que buscas no existe o fue movida. Verifica la URL o regresa al inicio.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.back()}
            variant="outline" 
            className="border-[#D5C3B6] text-[#FAF6F2] hover:bg-[#D5C3B6]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver atrás
          </Button>
          <Button 
            onClick={() => router.push('/')}
            className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir al inicio
          </Button>
        </div>

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] h-12">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
          
          <Link href="/dashboard" className="block">
            <Button variant="outline" className="w-full border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 h-12">
              Ir al dashboard
            </Button>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="pt-6 border-t border-[#D5C3B6]/10">
          <p className="text-sm text-[#9C8578]">
            Si crees que esto es un error, por favor contacta a soporte.
          </p>
        </div>
      </div>
    </div>
  )
}
