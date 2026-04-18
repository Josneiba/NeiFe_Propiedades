'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, ChevronDown } from 'lucide-react'

interface OnboardingCardProps {
  onClose: () => Promise<void>
}

export function OnboardingCard({ onClose }: OnboardingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="bg-white border-l-4 border-[#B8965A] mb-8">
      <CardContent className="p-6">
        {/* Header with X button */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              ¡Bienvenido a NeiFe!
            </h1>
            <p className="text-gray-600">
              Sigue estos pasos para comenzar:
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile collapsible toggle */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between text-gray-700 hover:bg-gray-50"
          >
            <span>Pasos para comenzar</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Checklist content - always visible on desktop, collapsible on mobile */}
        <div className={`${isExpanded ? 'block' : 'hidden'} md:block mt-4`}>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-[#B8965A]/5 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-[#B8965A] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">1</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">Agrega tu primera propiedad</p>
                <p className="text-gray-600 text-sm">→ botón "Agregar propiedad"</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-[#B8965A]/5 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-[#B8965A] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">Invita a tu arrendatario con su email</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-[#B8965A]/5 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-[#B8965A] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">3</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">Registra el primer pago del mes</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
