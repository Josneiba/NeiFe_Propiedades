'use client'

import Link from 'next/link'
import { Filter, PhoneCall, Sparkles } from 'lucide-react'

const FILTERS = [
  { title: 'Portal', description: 'Contactos captados por portal', href: '/broker/crm/contactos?source=PORTAL' },
  { title: 'Referidos', description: 'Prospectos recomendados', href: '/broker/crm/contactos?source=REFERIDO' },
  { title: 'Llamadas directas', description: 'Seguimiento de llamadas', href: '/broker/crm/contactos?source=LLAMADA_DIRECTA' },
  { title: 'Propietarios', description: 'Gestión de propietarios', href: '/broker/crm/contactos?type=PROPIETARIO' },
]

export function QuickFiltersSection() {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#FAF6F2]">Filtros rápidos</p>
        <span className="text-[11px] text-[#9C8578]">Acceso por origen</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ title, description, href }) => (
          <Link
            key={title}
            href={href}
            className="flex items-center gap-2 rounded-full border border-[#2D3C3C] bg-[#1a2a2a] px-3 py-2 text-sm text-[#D5C3B6] transition hover:border-[#5E8B8C]/40 hover:text-[#FAF6F2]"
          >
            {title === 'Portal' ? <Sparkles className="h-3.5 w-3.5" /> : title === 'Llamadas directas' ? <PhoneCall className="h-3.5 w-3.5" /> : <Filter className="h-3.5 w-3.5" />}
            <span className="text-xs">{title}</span>
            <span className="text-[10px] text-[#9C8578]">{description}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
