'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
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
  source: string
  onSourceChange: (value: string) => void
  priority: string
  onPriorityChange: (value: string) => void
  onReset: () => void
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'CONVERTED', label: 'Convertidos' },
  { value: 'LOST', label: 'Perdidos' },
  { value: 'INACTIVE', label: 'Inactivos' },
]

// Barra de filtros estilo PME: solo iconos (buscar / filtrar / limpiar) en vez
// de los 5 selects grandes siempre visibles. La lógica de filtrado no cambia,
// solo cómo se revela: el chip de estado replica el "Status ▾" de PME debajo
// del título, y el resto de filtros (tipo, fuente) quedan detrás del ícono de
// filtro para no ocupar espacio permanente.
export function ContactFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  source,
  onSourceChange,
  priority: _priority,
  onPriorityChange: _onPriorityChange,
  onReset,
}: ContactFiltersProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = search !== '' || type !== 'all' || status !== 'all' || source !== 'all'
  const statusLabel = STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Todos los estados'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className="flex items-center gap-1.5 text-sm text-[#D5C3B6] hover:text-[#FAF6F2]"
        >
          {statusLabel}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSearch((value) => !value)}
            aria-label="Buscar"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              showSearch ? 'bg-[#2D3C3C] text-[#FAF6F2]' : 'text-[#9C8578] hover:bg-[#152022]'
            }`}
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-label="Filtros"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              showFilters ? 'bg-[#2D3C3C] text-[#FAF6F2]' : 'text-[#9C8578] hover:bg-[#152022]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              aria-label="Limpiar filtros"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#9C8578] hover:bg-[#152022]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C8578]" />
          <Input
            autoFocus
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="border-[#2D3C3C] bg-[#152022] pl-9 text-[#FAF6F2]"
          />
        </div>
      )}

      {showFilters && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#2D3C3C] bg-[#152022] p-3 sm:grid-cols-3">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="border-[#2D3C3C] bg-[#1C2828] text-[#FAF6F2]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger className="border-[#2D3C3C] bg-[#1C2828] text-[#FAF6F2]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="PROPIETARIO">Propietario</SelectItem>
              <SelectItem value="ARRENDATARIO">Arrendatario</SelectItem>
              <SelectItem value="INVERSIONISTA">Inversionista</SelectItem>
              <SelectItem value="LEAD">Lead</SelectItem>
            </SelectContent>
          </Select>

          <Select value={source} onValueChange={onSourceChange}>
            <SelectTrigger className="border-[#2D3C3C] bg-[#1C2828] text-[#FAF6F2]">
              <SelectValue placeholder="Fuente" />
            </SelectTrigger>
            <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
              <SelectItem value="all">Todas las fuentes</SelectItem>
              <SelectItem value="PORTAL">Portal</SelectItem>
              <SelectItem value="REFERIDO">Referido</SelectItem>
              <SelectItem value="RRSS">RRSS</SelectItem>
              <SelectItem value="LLAMADA_DIRECTA">Llamada directa</SelectItem>
              <SelectItem value="LETRERO">Letrero</SelectItem>
              <SelectItem value="OTRO">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
