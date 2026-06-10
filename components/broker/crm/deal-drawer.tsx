'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Phone, Mail, Copy, Plus, Building2, Users, Activity } from 'lucide-react'
import { DealCardData } from './kanban-card'
import { STAGE_COLUMNS } from '@/lib/crm-stage-utils'
import { ActivityLogModal } from './activity-log-modal'
import { LinkContactModal } from './link-contact-modal'
import { toast } from 'sonner'

interface DealDrawerProps {
  deal: DealCardData
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function DealDrawer({ deal, open, onClose, onUpdate }: DealDrawerProps) {
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showLinkContact, setShowLinkContact] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  const stageConfig = STAGE_COLUMNS.find((s) => s.stage === deal.stage)!
  const currentStageIndex = STAGE_COLUMNS.findIndex((s) => s.stage === deal.stage)

  async function loadActivities() {
    setLoadingActivities(true)
    try {
      const res = await fetch(`/api/crm/activities?dealId=${deal.id}`)
      if (res.ok) setActivities(await res.json())
    } finally {
      setLoadingActivities(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    toast.success('Código copiado')
  }

  async function unlinkContact(contactId: string) {
    const res = await fetch(`/api/crm/deals/${deal.id}/contacts/${contactId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Contacto desvinculado')
      onUpdate()
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:w-[420px] bg-[#1C2828] border-l border-[#D5C3B6]/10 overflow-y-auto"
          onOpenAutoFocus={() => loadActivities()}
        >
          <SheetHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <button
                  className="font-mono text-xs text-[#B8965A] hover:text-[#D5C3B6] flex items-center gap-1 mb-1"
                  onClick={() => copyCode(deal.code)}
                >
                  {deal.code} <Copy className="h-3 w-3" />
                </button>
                <SheetTitle className="text-[#FAF6F2] text-base leading-snug">
                  {deal.title}
                </SheetTitle>
              </div>
              <Badge
                className="text-[10px] ml-2 flex-shrink-0"
                style={{ backgroundColor: stageConfig.color + '33', color: stageConfig.color }}
              >
                {stageConfig.label}
              </Badge>
            </div>
          </SheetHeader>

          {/* Tracker de etapas */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            {STAGE_COLUMNS.map((s, i) => (
              <div
                key={s.stage}
                className="flex-shrink-0 w-5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: i <= currentStageIndex ? s.color : '#D5C3B6' + '22',
                }}
                title={s.label}
              />
            ))}
          </div>

          <Separator className="bg-[#D5C3B6]/10 mb-4" />

          {/* PROPIEDAD */}
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-3.5 w-3.5 text-[#5E8B8C]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9C8578]">Propiedad</span>
            </div>
            {deal.property ? (
              <div className="bg-[#2D3C3C]/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    className="font-mono text-[10px] text-[#B8965A] hover:text-[#D5C3B6]"
                    onClick={() => copyCode(deal.property!.code)}
                  >
                    {deal.property.code}
                  </button>
                  <Badge variant="outline" className="text-[9px] border-[#D5C3B6]/20 text-[#9C8578]">
                    {deal.property.type}
                  </Badge>
                </div>
                <p className="text-xs text-[#D5C3B6]">{deal.property.address}</p>
              </div>
            ) : (
              <p className="text-xs text-[#9C8578] italic">Sin propiedad vinculada</p>
            )}
          </section>

          <Separator className="bg-[#D5C3B6]/10 mb-4" />

          {/* CONTACTOS */}
          <section className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-[#5E8B8C]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#9C8578]">Contactos</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] text-[#5E8B8C] hover:text-[#5E8B8C]/80 px-2"
                onClick={() => setShowLinkContact(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Vincular
              </Button>
            </div>
            <div className="space-y-2">
              {deal.contacts.length === 0 && (
                <p className="text-xs text-[#9C8578] italic">Sin contactos vinculados</p>
              )}
              {deal.contacts.map((dc) => (
                <div key={dc.contact.id} className="bg-[#2D3C3C]/60 rounded-lg p-2.5 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <button
                        className="font-mono text-[9px] text-[#B8965A] hover:text-[#D5C3B6]"
                        onClick={() => copyCode(dc.contact.code)}
                      >
                        {dc.contact.code}
                      </button>
                      <Badge variant="outline" className="text-[9px] border-[#D5C3B6]/20 text-[#9C8578] py-0">
                        {dc.role === 'PROPIETARIO' ? 'Propietario' : dc.role === 'ARRENDATARIO' ? 'Arrendatario' : dc.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#D5C3B6] truncate">{dc.contact.name}</p>
                  </div>
                  <button
                    onClick={() => unlinkContact(dc.contact.id)}
                    className="text-[9px] text-[#9C8578] hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-[#D5C3B6]/10 mb-4" />

          {/* ACTIVIDADES */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[#5E8B8C]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#9C8578]">Actividades</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] text-[#5E8B8C] px-2"
                onClick={() => setShowActivityModal(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Registrar
              </Button>
            </div>
            {loadingActivities ? (
              <p className="text-xs text-[#9C8578] animate-pulse">Cargando...</p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-[#9C8578] italic">Sin actividades registradas</p>
            ) : (
              <div className="space-y-1.5">
                {activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex gap-2 text-xs">
                    <span className="text-[#B8965A] flex-shrink-0">
                      {a.type === 'LLAMADA' ? '📞' : a.type === 'VISITA' ? '🏠' : a.type === 'EMAIL' ? '✉️' : '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[#D5C3B6]">{a.title}</span>
                      <span className="text-[#9C8578] ml-1.5 text-[10px]">
                        {new Date(a.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </SheetContent>
      </Sheet>

      {/* Sub-modales */}
      {showActivityModal && (
        <ActivityLogModal
          dealId={deal.id}
          open={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          onCreated={() => { loadActivities(); onUpdate() }}
        />
      )}
      {showLinkContact && (
        <LinkContactModal
          dealId={deal.id}
          open={showLinkContact}
          onClose={() => setShowLinkContact(false)}
          onLinked={onUpdate}
        />
      )}
    </>
  )
}
