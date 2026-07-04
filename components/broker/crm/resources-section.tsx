'use client'

import Link from 'next/link'
import { CalendarDays, FileText, Home, ShieldCheck } from 'lucide-react'

const RESOURCES = [
  { title: 'Plantillas', description: 'Mensajes y seguimientos', href: '/broker/crm/plantillas', Icon: FileText },
  { title: 'Calendario', description: 'Visitas y reuniones', href: '/broker/crm/calendario', Icon: CalendarDays },
  { title: 'Propiedades', description: 'Inventario y estado', href: '/broker/propiedades', Icon: Home },
  { title: 'Mandatos', description: 'Documentación vigente', href: '/broker/mandatos', Icon: ShieldCheck },
]

export function ResourcesSection() {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#FAF6F2]">Recursos</p>
        <span className="text-[11px] text-[#9C8578]">Accesos rápidos</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {RESOURCES.map(({ title, description, href, Icon }) => (
          <Link
            key={title}
            href={href}
            className="rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] p-3.5 transition hover:border-[#5E8B8C]/40 hover:bg-[#1b2f2d]"
          >
            <div className="flex items-center gap-2 text-[#5E8B8C]">
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
