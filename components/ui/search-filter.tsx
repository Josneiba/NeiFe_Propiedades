'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

interface SearchFilterProps {
  placeholder?: string
  paramName?: string
}

export function SearchFilter({
  placeholder = 'Buscar...',
  paramName = 'q',
}: SearchFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get(paramName) || '')

  const handleChange = (newValue: string) => {
    setValue(newValue)

    const params = new URLSearchParams(searchParams.toString())
    if (newValue) {
      params.set(paramName, newValue)
    } else {
      params.delete(paramName)
    }

    startTransition(() => {
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    })
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8578]" />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-[#2A2520] border border-[#D5C3B6]/15 text-[#FAF6F2] placeholder:text-[#9C8578]/60 focus:outline-none focus:border-[#5E8B8C] text-sm transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => handleChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8578] hover:text-[#D5C3B6]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {isPending && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin rounded-full border border-[#5E8B8C] border-t-transparent" />
      )}
    </div>
  )
}
