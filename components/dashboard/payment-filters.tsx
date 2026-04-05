'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PaymentFiltersProps {
  properties: Array<{ id: string; address: string }>
  onFiltersChange?: (filters: FilterState) => void
}

export interface FilterState {
  propertyId?: string
  status?: string
  month?: string
  year?: string
  search?: string
}

export function PaymentFilters({ properties, onFiltersChange }: PaymentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterState>({
    propertyId: searchParams.get('property') || searchParams.get('propertyId') || '',
    status: searchParams.get('status') || '',
    month: searchParams.get('month') || '',
    year: searchParams.get('year') || '',
    search: searchParams.get('search') || '',
  })

  const hasActiveFilters = Object.values(filters).some(v => v)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
    onFiltersChange?.(newFilters)
  }

  const updateURL = (newFilters: FilterState) => {
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (!value) return
      if (key === 'propertyId') params.set('property', value)
      else params.set(key, value)
    })
    router.push(`/dashboard/pagos?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({ propertyId: '', status: '', month: '', year: '', search: '' })
    router.push('/dashboard/pagos')
    onFiltersChange?.({})
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)
  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  return (
    <div className="space-y-4 p-4 md:p-6 rounded-lg bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-[#B8965A]" />
        <h3 className="font-semibold text-[#FAF6F2]">Filtrar pagos</h3>
        {hasActiveFilters && (
          <span className="text-xs bg-[#5E8B8C]/30 text-[#5E8B8C] px-2 py-1 rounded ml-auto">
            {Object.values(filters).filter(v => v).length} activo{Object.values(filters).filter(v => v).length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <Input
          placeholder="Buscar arrendatario..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder-[#9C8578]/50"
        />

        {/* Property */}
        <Select value={filters.propertyId || ''} onValueChange={(v) => handleFilterChange('propertyId', v)}>
          <SelectTrigger className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]">
            <SelectValue placeholder="Propiedad" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <SelectItem value="">Todas las propiedades</SelectItem>
            {properties.map((prop) => (
              <SelectItem key={prop.id} value={prop.id}>
                {prop.address.substring(0, 30)}...
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={filters.status || ''} onValueChange={(v) => handleFilterChange('status', v)}>
          <SelectTrigger className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>

        {/* Month */}
        <Select value={filters.month || ''} onValueChange={(v) => handleFilterChange('month', v)}>
          <SelectTrigger className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <SelectItem value="">Todos los meses</SelectItem>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year */}
        <Select value={filters.year || ''} onValueChange={(v) => handleFilterChange('year', v)}>
          <SelectTrigger className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <SelectItem value="">Todos los años</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
            className="text-[#9C8578] border-[#D5C3B6]/20 hover:bg-[#D5C3B6]/5"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
