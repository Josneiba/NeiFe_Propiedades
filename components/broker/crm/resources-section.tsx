'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Building2,
  MessageSquareText,
  BarChart3,
  FileStack,
  CalendarDays,
} from 'lucide-react'

const RESOURCES = [
  { title: 'Notas de Propiedades', href: '/broker/cartera', icon: BookOpen, color: 'text-[#7FB8B9]' },
  { title: 'Propiedades', href: '/broker/propiedades', icon: Building2, color: 'text-[#E8A5A0]' },
  { title: 'Enviar Mensaje', href: '/broker/avisos', icon: MessageSquareText, color: 'text-[#E8A559]' },
  { title: 'Analíticas', href: '/broker/crm/analytics', icon: BarChart3, color: 'text-[#8FBF8A]' },
  { title: 'Centro de Documentos', href: '/broker/crm/plantillas', icon: FileStack, color: 'text-[#7FB8B9]' },
  { title: 'Calendario de Inspecciones y Mantenciones', href: '/broker/crm/calendario', icon: CalendarDays, color: 'text-[#E8A5A0]' },
]

export function ResourcesSection() {
  const [open, setOpen] = useState(true)

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b border-[#2D3C3C] pb-2"
      >
        <h2 className="text-base font-semibold text-[#FAF6F2]">Recursos</h2>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[#9C8578]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#9C8578]" />
        )}
      </button>

      {open && (
        <div className="grid grid-cols-4 gap-x-3 gap-y-6">
          {RESOURCES.map(({ title, href, icon: Icon, color }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2D3C3C]/80 transition group-hover:border-[#5E8B8C]/60">
                <Icon className={`h-6 w-6 ${color}`} strokeWidth={1.75} />
              </div>
              <p className="line-clamp-2 text-[11px] font-medium leading-tight text-[#FAF6F2]">
                {title}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
