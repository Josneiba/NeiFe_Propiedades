'use client'

import Link from 'next/link'
import { ChevronRight, Plus, Users2 } from 'lucide-react'

const GROUPS = [
  { title: 'Planificación Diaria', href: '/broker/crm/mi-dia' },
  { title: 'Arrendatarios que se Mudaron', href: '/broker/crm/contactos?type=ARRENDATARIO&status=INACTIVE' },
  { title: 'Propiedades Compartidas', href: '/broker/propiedades' },
  { title: 'Propietarios Potenciales', href: '/broker/crm/contactos?type=LEAD' },
  { title: 'Clientes que Regresan', href: '/broker/crm/contactos?status=CONVERTED' },
]

export function GroupsSection() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b border-[#2D3C3C] pb-2">
        <h2 className="text-base font-semibold text-[#FAF6F2]">Grupos</h2>
        <Link
          href="/broker/crm/contactos"
          className="flex items-center gap-1 text-[11px] font-medium text-[#C27F79] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir
        </Link>
      </div>

      <div className="divide-y divide-[#2D3C3C]/60">
        {GROUPS.map(({ title, href }) => (
          <Link
            key={title}
            href={href}
            className="flex items-center gap-3 py-3 first:pt-0 transition hover:opacity-80"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#243535] text-[#7FB8B9]">
              <Users2 className="h-4 w-4" />
            </div>
            <span className="flex-1 text-sm font-medium text-[#D5C3B6]">{title}</span>
            <ChevronRight className="h-4 w-4 text-[#9C8578]" />
          </Link>
        ))}
      </div>
    </section>
  )
}
