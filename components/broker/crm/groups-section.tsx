'use client'

import Link from 'next/link'
import { GripVertical, Plus } from 'lucide-react'

const GROUPS = [
  { title: 'Planificación Diaria', href: '/broker/crm/mi-dia' },
  { title: 'Arrendatarios que se Mudaron', href: '/broker/crm/contactos?type=ARRENDATARIO&status=INACTIVE' },
  { title: 'Propiedades Compartidas', href: '/broker/propiedades' },
  { title: 'Propietarios Potenciales', href: '/broker/crm/contactos?type=LEAD' },
  { title: 'Clientes que Regresan', href: '/broker/crm/contactos?status=CONVERTED' },
]

export function GroupsSection() {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#FAF6F2]">Grupos</p>
        <Link href="/broker/crm/contactos" className="flex items-center gap-1.5 rounded-full border border-[#2D3C3C] bg-[#1a2a2a] px-2.5 py-1.5 text-[11px] font-medium text-[#D5C3B6] transition hover:border-[#5E8B8C]/40 hover:text-[#FAF6F2]">
          <Plus className="h-3.5 w-3.5" />
          Añadir
        </Link>
      </div>

      <div className="space-y-2">
        {GROUPS.map(({ title, href }) => (
          <Link
            key={title}
            href={href}
            className="flex items-center gap-2 rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] px-3 py-2.5 text-sm font-medium text-[#D5C3B6] transition hover:border-[#5E8B8C]/40 hover:text-[#FAF6F2]"
          >
            <GripVertical className="h-4 w-4 text-[#9C8578]" />
            <span>{title}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
