'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'

const RESOURCES = [
  { title: 'Notas de Cartera', href: '/broker/cartera' },
  { title: 'Propiedades', href: '/broker/propiedades' },
  { title: 'Enviar Comunicado', href: '/broker/avisos' },
  { title: 'Analytics', href: '/broker/crm/analytics' },
  { title: 'Manual del Corredor', href: '/legal' },
  { title: 'Mantenciones', href: '/broker/mantenciones' },
]

export function ResourcesSection() {
  const [open, setOpen] = useState(true)

  return (
    <section className="space-y-2.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] px-3 py-2.5"
      >
        <p className="text-sm font-semibold text-[#FAF6F2]">Recursos</p>
        {open ? <ChevronUp className="h-4 w-4 text-[#9C8578]" /> : <ChevronDown className="h-4 w-4 text-[#9C8578]" />}
      </button>

      {open && (
        <div className="grid gap-3 sm:grid-cols-2">
          {RESOURCES.map(({ title, href }) => (
            <Link
              key={title}
              href={href}
              className="rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] px-3 py-2.5 text-sm font-medium text-[#D5C3B6] transition hover:border-[#5E8B8C]/40 hover:text-[#FAF6F2]"
            >
              {title}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
