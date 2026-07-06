'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface FabAction {
  key: string
  label: string
  icon: LucideIcon
  onClick: () => void
  colorClass?: string
}

interface FabSpeedDialProps {
  actions: FabAction[]
}

export function FabSpeedDial({ actions }: FabSpeedDialProps) {
  const [open, setOpen] = useState(false)

  if (actions.length === 0) return null

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-3">
            {actions.map(({ key, label, icon: Icon, onClick, colorClass }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="rounded-lg bg-[#0F1717] px-3 py-1.5 text-sm font-medium text-[#FAF6F2] shadow-lg">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onClick()
                  }}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition hover:brightness-110 ${colorClass ?? 'bg-[#C27F79]'}`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C27F79] text-white shadow-xl transition hover:bg-[#C27F79]/85"
          aria-label={open ? 'Cerrar menú de acciones' : 'Abrir menú de acciones'}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  )
}
