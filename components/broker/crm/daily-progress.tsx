'use client'

import { Target } from 'lucide-react'

interface DailyProgressProps {
  completed: number
  goal?: number
}

export function DailyProgress({ completed, goal = 10 }: DailyProgressProps) {
  const pct = Math.min(Math.round((completed / goal) * 100), 100)
  const color = pct >= 100 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#5E8B8C'

  return (
    <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#5E8B8C]" />
          <span className="text-sm font-medium text-[#FAF6F2]">Contactos hoy</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {completed} / {goal}
        </span>
      </div>
      <div className="h-2 bg-[#2D3C3C] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {pct >= 100 && <p className="text-xs text-emerald-400 mt-1">¡Meta del día alcanzada! 🎉</p>}
    </div>
  )
}
