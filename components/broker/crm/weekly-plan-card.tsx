'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, ClipboardList } from 'lucide-react'

interface WeeklyPlanCardProps {
  initialPlanText?: string | null
  initialWorkDays?: Record<string, string>
  initialDailyCommitments?: Record<string, string>
  onSave: (payload: {
    planText: string | null
    workDays: Record<string, string>
    dailyCommitments: Record<string, string>
  }) => Promise<void>
}

const workDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export function WeeklyPlanCard({ initialPlanText, initialWorkDays, initialDailyCommitments, onSave }: WeeklyPlanCardProps) {
  const [planText, setPlanText] = useState(initialPlanText ?? '')
  const [workDaysState, setWorkDaysState] = useState<Record<string, string>>(initialWorkDays ?? {})
  const [dailyCommitmentsState, setDailyCommitmentsState] = useState<Record<string, string>>(initialDailyCommitments ?? {})
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({ planText, workDays: workDaysState, dailyCommitments: dailyCommitmentsState })
    setSaving(false)
  }

  return (
    <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-3xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#D5C3B6]/70 uppercase tracking-[0.18em]">Plan semanal</p>
          <p className="text-lg font-semibold text-[#FAF6F2]">Qué voy a hacer esta semana</p>
        </div>
        <div className="rounded-full bg-[#253336] p-2">
          <CalendarDays className="w-5 h-5 text-[#5E8B8C]" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-[#FAF6F2] mb-2">Resumen semanal</p>
          <Textarea
            value={planText}
            onChange={(e) => setPlanText(e.target.value)}
            placeholder="Escribe tu enfoque, prioridades y resultados esperados"
            className="min-h-[120px] bg-[#132023] border-[#2D3C3C] text-[#FAF6F2]"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-[#FAF6F2]">Días clave</p>
            {workDays.map((day) => (
              <div key={day}>
                <label className="text-xs text-[#D5C3B6]/70">{day}</label>
                <input
                  value={workDaysState[day] ?? ''}
                  onChange={(e) => setWorkDaysState((prev) => ({ ...prev, [day]: e.target.value }))}
                  placeholder="Meta principal"
                  className="w-full rounded-xl border border-[#2D3C3C] bg-[#132023] px-3 py-2 text-sm text-[#FAF6F2]"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-[#FAF6F2]">Compromisos diarios</p>
            {workDays.map((day) => (
              <div key={day}>
                <label className="text-xs text-[#D5C3B6]/70">{day}</label>
                <input
                  value={dailyCommitmentsState[day] ?? ''}
                  onChange={(e) => setDailyCommitmentsState((prev) => ({ ...prev, [day]: e.target.value }))}
                  placeholder="Compromiso"
                  className="w-full rounded-xl border border-[#2D3C3C] bg-[#132023] px-3 py-2 text-sm text-[#FAF6F2]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
        >
          {saving ? 'Guardando...' : 'Actualizar plan'}
        </Button>
      </div>
    </div>
  )
}
