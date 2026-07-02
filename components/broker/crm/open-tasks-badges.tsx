'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Kanban, Target, Calendar, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Counts {
  openDeals?: number
  urgentCount?: number
  openTasks?: number
  openContacts?: number
}

const ITEMS = [
  { key: 'openDeals', label: 'Pipeline', href: '/broker/crm/workspace', Icon: Kanban },
  { key: 'urgentCount', label: 'Urgente', href: '/broker/crm/mi-dia', Icon: Target },
  { key: 'openTasks', label: 'Tareas', href: '/broker/crm/mi-dia', Icon: Calendar },
  { key: 'openContacts', label: 'Contactos', href: '/broker/crm/contactos', Icon: Users },
]

export function OpenTasksBadges() {
  const [counts, setCounts] = useState<Counts>({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/open-counts')
        if (res.ok) {
          setCounts(await res.json())
        }
      } catch (error) {
        console.error(error)
      }
    }
    load()
  }, [])

  return (
    <div className="grid grid-cols-4 gap-3">
      {ITEMS.map(({ key, label, href, Icon }) => {
        const count = counts[key as keyof Counts] ?? 0
        const hot = count > 0

        return (
          <Link
            key={key}
            href={href}
            className="relative flex flex-col items-center gap-1.5 rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] py-3 px-1 hover:border-[#5E8B8C]/40 transition-colors"
          >
            {hot && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#C27F79] text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                {count > 99 ? '99+' : count}
              </span>
            )}
            <Icon className={cn('w-5 h-5', hot ? 'text-[#C27F79]' : 'text-[#5E8B8C]')} />
            <span className="text-[10px] text-[#9C8578] text-center leading-tight">{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
