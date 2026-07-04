'use client'

import Link from 'next/link'
import { Bookmark, Building2, Layers3, Users } from 'lucide-react'

const GROUPS = [
  { title: 'Propietarios', description: 'Prioridad y seguimiento', href: '/broker/crm/contactos?type=PROPIETARIO', Icon: Users },
  { title: 'Arrendatarios', description: 'Cobertura y renovación', href: '/broker/crm/contactos?type=ARRENDATARIO', Icon: Building2 },
  { title: 'Inversionistas', description: 'Portafolio y oportunidades', href: '/broker/crm/contactos?type=INVERSIONISTA', Icon: Layers3 },
  { title: 'Oportunidades', description: 'Pipeline activo', href: '/broker/crm/workspace', Icon: Bookmark },
]

export function GroupsSection() {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#FAF6F2]">Grupos</p>
        <span className="text-[11px] text-[#9C8578]">Colecciones útiles</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {GROUPS.map(({ title, description, href, Icon }) => (
          <Link
            key={title}
            href={href}
            className="rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] p-3.5 transition hover:border-[#5E8B8C]/40 hover:bg-[#1b2f2d]"
          >
            <div className="flex items-center gap-2 text-[#B8965A]">
              <Icon className="h-4 w-4" />
              <p className="text-sm font-semibold text-[#FAF6F2]">{title}</p>
            </div>
            <p className="mt-1 text-xs text-[#9C8578]">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
