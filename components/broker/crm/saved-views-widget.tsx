'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FolderOpen } from 'lucide-react'

interface SavedViewSummary {
  id: string
  name: string
  entity: string
  resultCount?: number
}

export function SavedViewsWidget() {
  const [views, setViews] = useState<SavedViewSummary[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/saved-views?entity=CONTACTS')
        if (res.ok) {
          const data = await res.json()
          setViews(Array.isArray(data) ? data.slice(0, 4) : [])
        }
      } catch {
        // ignore
      }
    }
    void load()
  }, [])

  return (
    <section className="space-y-2.5 rounded-2xl border border-[#2D3C3C] bg-[#1a2a2a] p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#FAF6F2]">Vistas guardadas</p>
        <Link href="/broker/crm/vistas" className="text-xs text-[#C27F79] hover:underline">Ver todas</Link>
      </div>
      <div className="space-y-2">
        {views.map((view) => (
          <Link key={view.id} href={`/broker/crm/vistas`} className="flex items-center justify-between rounded-xl border border-[#2D3C3C] bg-[#162121] px-3 py-2 text-sm text-[#D5C3B6]">
            <span className="flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 text-[#5E8B8C]" />
              {view.name}
            </span>
            <span className="rounded-full bg-[#5E8B8C]/15 px-2 py-0.5 text-[11px] text-[#5E8B8C]">{view.resultCount ?? 0}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
