'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ContactFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  type: string
  onTypeChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  priority: string
  onPriorityChange: (value: string) => void
  onReset: () => void
}

export function ContactFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  onReset,
}: ContactFiltersProps) {
  const hasActiveFilters =
    search !== '' || type !== 'all' || status !== 'all' || priority !== 'all'

  return (
    <div className="space-y-4 p-4 bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#9C8578]" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]"
          />
        </div>

        {/* Type Filter */}
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]">
            <SelectValue placeholder="Tipo de contacto" />
          </SelectTrigger>
          <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/10">
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="PROPIETARIO">Propietario</SelectItem>
            <SelectItem value="ARRENDATARIO">Arrendatario</SelectItem>
            <SelectItem value="INVERSIONISTA">Inversionista</SelectItem>
            <SelectItem value="LEAD">Lead</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/10">
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="ACTIVE">Activo</SelectItem>
            <SelectItem value="CONVERTED">Convertido</SelectItem>
            <SelectItem value="LOST">Perdido</SelectItem>
            <SelectItem value="INACTIVE">Inactivo</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/10">
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="MEDIUM">Media</SelectItem>
            <SelectItem value="LOW">Baja</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full border-[#D5C3B6]/20 text-[#9C8578] hover:text-[#D5C3B6]"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
