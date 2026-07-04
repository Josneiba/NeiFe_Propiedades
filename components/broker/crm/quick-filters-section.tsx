'use client'

import Link from 'next/link'
import { ArrowRightLeft, FileCheck2, Home, Users } from 'lucide-react'

const FILTERS = [
  { title: 'Referidos Recientes', href: '/broker/crm/contactos?source=REFERIDO', Icon: Users },
  { title: 'Mandatos Reasignados', href: '/broker/mandatos', Icon: ArrowRightLeft },
  { title: 'Progreso del Contrato', href: '/broker/crm/workspace', Icon: FileCheck2 },
  { title: 'Nuevos Arrendatarios', href: '/broker/crm/contactos?type=ARRENDATARIO', Icon: Home },
]

export function QuickFiltersSection() {
  return (
    <section className="space-y-2.5">
      <p className="text-sm font-semibold text-[#FAF6F2]">Filtros rápidos</p>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ title, href, Icon }) => (
          <Link
            key={title}
            href={href}
            className="flex items-center gap-2 rounded-full border border-[#2D3C3C] bg-[#1a2a2a] px-3 py-2 text-sm text-[#D5C3B6] transition hover:border-[#5E8B8C]/40 hover:text-[#FAF6F2]"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="text-xs">{title}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
