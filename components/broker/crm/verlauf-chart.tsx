'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VerlaufRow {
  week: number
  year: number
  contacts: number
  visits: number
}

export function VerlaufChart() {
  const [data, setData] = useState<VerlaufRow[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/goals/verlauf')
        if (!res.ok) throw new Error()
        const result = await res.json()
        setData(result.data ?? [])
      } catch (error) {
        console.error(error)
        toast.error('No se pudo cargar la evolución semanal')
      }
    }

    load()
  }, [])

  return (
    <Card className="bg-[#1a2a2a] border-[#2D3C3C]">
      <CardHeader>
        <CardTitle>Evolución semanal</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {data.length === 0 ? (
          <p className="text-sm text-[#D5C3B6]">Sin datos para la evolución.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#2D3C3C" strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fill: '#D5C3B6' }} />
              <YAxis tick={{ fill: '#D5C3B6' }} />
              <Tooltip wrapperStyle={{ backgroundColor: '#1a2424', border: '1px solid #2D3C3C' }} />
              <Bar dataKey="contacts" fill="#5E8B8C" name="Contactos" />
              <Bar dataKey="visits" fill="#C27F79" name="Visitas" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
