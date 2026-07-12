'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ContactFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  activeFilterCount: number
  onOpenFilters: () => void
  onReset: () => void
}

export function ContactFilters({ search, onSearchChange, activeFilterCount, onOpenFilters, onReset }: ContactFiltersProps) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex items-center gap-1.5 text-sm text-[#D5C3B6] hover:text-[#FAF6F2]"
        >
          {activeFilterCount > 0 ? `${activeFilterCount} filtro${activeFilterCount === 1 ? '' : 's'} activo${activeFilterCount === 1 ? '' : 's'}` : 'Todos los contactos'}
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
            onClick={onOpenFilters}
            aria-label="Filtros"
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
              activeFilterCount > 0 ? 'bg-[#2D3C3C] text-[#FAF6F2]' : 'text-[#9C8578] hover:bg-[#152022]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C27F79] text-[9px] font-bold text-[#1C2828]">
                {activeFilterCount}
              </span>
            )}
          </button>
          {(activeFilterCount > 0 || search) && (
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
    </div>
  )
}
