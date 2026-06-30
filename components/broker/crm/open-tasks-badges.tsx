'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface OpenCounts {
  openDeals: number
  openTasks: number
  openContacts: number
}

export function OpenTasksBadges() {
  const [counts, setCounts] = useState<OpenCounts | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/open-counts')
        if (!res.ok) throw new Error()
        setCounts(await res.json())
      } catch (error) {
        console.error(error)
        toast.error('No se pudieron cargar los contadores abiertos')
      }
    }

    load()
  }, [])

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {['openDeals', 'openTasks', 'openContacts'].map((key) => {
        const label = key === 'openDeals' ? 'Deals abiertos' : key === 'openTasks' ? 'Tareas abiertas' : 'Contactos activos'
        const value = counts ? counts[key as keyof OpenCounts] : 0
        return (
          <Card key={key} className="bg-[#1a2a2a] border-[#2D3C3C]">
            <CardHeader>
              <CardTitle className="text-sm text-[#D5C3B6]">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-[#FAF6F2]">{value}</div>
              <Badge variant="outline" className="mt-2 text-xs text-[#9C8578] border-[#2D3C3C]">Actualizado</Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
