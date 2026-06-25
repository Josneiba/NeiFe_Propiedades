'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, Trash2, Copy, Plus, Building2, Users, Phone, Mail } from 'lucide-react'
import { DealCardData } from './kanban-card'
import { STAGE_COLUMNS } from '@/lib/crm-stage-utils'
import { ActivityLogModal } from './activity-log-modal'
import { LinkContactModal } from './link-contact-modal'
import { AttachmentsSection } from './attachments-section'
import { StageChecklist } from './stage-checklist'
import { AdminRequirements } from './admin-requirements'
import { toast } from 'sonner'
import { CrmDealStage } from '@prisma/client'
import { safeFetch } from '@/lib/safe-fetch'

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
  const [movingStage, setMovingStage] = useState(false)
  const [localStage, setLocalStage] = useState<CrmDealStage>(deal.stage)
  const [quickNote, setQuickNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [dueDate, setDueDate] = useState(deal.dueDate ? new Date(deal.dueDate).toISOString().split('T')[0] : '')
  const [savingDate, setSavingDate] = useState(false)
  const [deletingDeal, setDeletingDeal] = useState(false)
  const [canAdvance, setCanAdvance] = useState(false)

  const stageConfig = STAGE_COLUMNS.find((s) => s.stage === deal.stage)!
  const currentStageIndex = STAGE_COLUMNS.findIndex((s) => s.stage === deal.stage)

  async function loadActivities() {
    setLoadingActivities(true)
    try {
      const { data, error } = await safeFetch<any[]>(`/api/crm/activities?dealId=${deal.id}`)
      if (error) {
        console.error('Error loading activities:', error)
        return
      }
      if (data) setActivities(data)
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

  async function handleStageChange(newStage: CrmDealStage) {
    if (newStage === 'ADMINISTRAR') {
      toast.error('Para pasar a Administrar, usa el Workspace y confirma el proceso completo')
      return
    }
    setMovingStage(true)
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStage }),
      })
      if (!res.ok) throw new Error()
      setLocalStage(newStage)
      toast.success(`Movido a ${STAGE_COLUMNS.find(s => s.stage === newStage)?.label}`)
      onUpdate()
    } catch {
      toast.error('No se pudo cambiar la etapa')
    } finally {
      setMovingStage(false)
    }
  }

  async function saveQuickNote() {
    if (!quickNote.trim()) return
    setSavingNote(true)
    try {
      await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTA',
          title: quickNote.trim(),
          dealId: deal.id,
          isDone: true,
          completedAt: new Date(),
        }),
      })
      setQuickNote('')
      toast.success('Nota guardada')
      loadActivities()
      onUpdate()
    } catch {
      toast.error('Error al guardar nota')
    } finally {
      setSavingNote(false)
    }
  }

  async function loadHistory() {
    if (history.length > 0) {
      setShowHistory(!showHistory)
      return
    }
    try {
      const { data, error } = await safeFetch<any[]>(`/api/crm/deals/${deal.id}/history`)
      if (error) {
        toast.error('Error al cargar historial')
        return
      }
      if (data) {
        setHistory(data)
        setShowHistory(true)
      }
    } catch {
      toast.error('Error al cargar historial')
    }
  }

  async function deleteDeal() {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta operación? Esta acción no se puede deshacer.')) {
      return
    }
    setDeletingDeal(true)
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Operación eliminada')
      onClose()
      onUpdate()
    } catch {
      toast.error('Error al eliminar operación')
    } finally {
      setDeletingDeal(false)
    }
  }

  async function loadAttachments() {
    try {
      const { data, error } = await safeFetch<any[]>(`/api/crm/deals/${deal.id}/attachments`)
      if (!error && data) {
        setAttachments(data)
      }
    } catch {
      // Silenciar error si el endpoint no existe aún
    }
  }

  async function handleDueDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    setDueDate(newDate)
    if (!newDate) {
      setSavingDate(true)
      try {
        await fetch(`/api/crm/deals/${deal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dueDate: null }),
        })
        toast.success('Fecha despejada')
        onUpdate()
      } catch {
        toast.error('Error al actualizar fecha')
      } finally {
        setSavingDate(false)
      }
      return
    }
    setSavingDate(true)
    try {
      await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDate }),
      })
      toast.success('Fecha objetivo actualizada')
      onUpdate()
    } catch {
      toast.error('Error al actualizar fecha')
      setDueDate(deal.dueDate ? new Date(deal.dueDate).toISOString().split('T')[0] : '')
    } finally {
      setSavingDate(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl bg-[#1C2828] border-l border-[#D5C3B6]/10 overflow-y-auto animate-slide-in-right"
          onOpenAutoFocus={() => {
            loadActivities()
            loadAttachments()
          }}
        >
          <SheetHeader className="pb-4 px-6 pt-6 sticky top-0 bg-[#1C2828]/95 z-10 border-b border-[#D5C3B6]/10">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <button
                    className="font-mono text-xs text-[#B8965A] hover:text-[#D5C3B6] flex items-center gap-1 mb-1"
                    onClick={() => copyCode(deal.code)}
                  >
                    {deal.code} <Copy className="h-3 w-3" />
                  </button>
                  <SheetTitle className="text-[#FAF6F2] text-base leading-snug break-words">
                    {deal.title}
                  </SheetTitle>
                </div>
                <Badge
                  className="text-[10px] flex-shrink-0"
                  style={{ backgroundColor: stageConfig.color + '33', color: stageConfig.color }}
                >
                  {stageConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-[#D5C3B6]/10">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={deleteDeal}
                  disabled={deletingDeal}
                  className="h-8 px-3 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                  title="Eliminar operación"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="px-6 space-y-4">
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

          {/* Selector de etapa rápido */}
          <div className="mb-4">
            <Select value={localStage} onValueChange={(v) => handleStageChange(v as CrmDealStage)} disabled={movingStage}>
              <SelectTrigger className="w-full h-8 bg-[#2D3C3C] border-[#D5C3B6]/15 text-[#FAF6F2] text-xs">
                <SelectValue placeholder="Cambiar etapa" />
              </SelectTrigger>
              <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/10">
                {STAGE_COLUMNS.filter(s => s.stage !== 'ADMINISTRAR').map((s) => (
                  <SelectItem key={s.stage} value={s.stage} className="text-xs">
                    • {s.label}
                  </SelectItem>
                ))}
                <Separator className="bg-[#D5C3B6]/10 my-1" />
                <SelectItem value="ADMINISTRAR" className="text-xs text-yellow-500" disabled>
                  Administrar (requiere confirmación)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {['FIRMA_CONTRATO', 'ENTREGA_LLAVES'].includes(deal.stage) && <AdminRequirements deal={deal} />}

          <Separator className="bg-[#D5C3B6]/10 mb-4" />

          {/* Fecha objetivo */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9C8578] block mb-2">
              Fecha objetivo
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={handleDueDateChange}
              disabled={savingDate}
              className="w-full h-9 bg-[#2D3C3C] border border-[#D5C3B6]/15 rounded px-3 text-xs text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]/50 disabled:opacity-50"
            />
          </div>

          <Separator className="bg-[#D5C3B6]/10 mb-4" />

          {/* Playbook Checklist */}
          <div className="mb-4">
            <StageChecklist dealId={deal.id} onCanAdvanceChange={setCanAdvance} />
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
                <div key={dc.contact.id} className="bg-[#2D3C3C]/60 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-start justify-between">
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
                  {((dc.contact as any)?.phone || (dc.contact as any)?.email) && (
                    <div className="flex gap-1.5 pt-1.5 border-t border-[#D5C3B6]/10">
                      {(dc.contact as any)?.phone && (
                        <>
                          <a
                            href={`https://wa.me/${((dc.contact as any).phone as string).replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(dc.contact.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#1C2828] rounded text-[9px] text-[#5E8B8C] hover:bg-[#5E8B8C]/10 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <Phone className="h-3 w-3" />
                            WhatsApp
                          </a>
                          <a
                            href={`tel:${(dc.contact as any).phone}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#1C2828] rounded text-[9px] text-[#B8965A] hover:bg-[#B8965A]/10 transition-colors"
                            title="Llamar"
                          >
                            <Phone className="h-3 w-3" />
                            Llamar
                          </a>
                        </>
                      )}
                      {(dc.contact as any)?.email && (
                        <a
                          href={`mailto:${(dc.contact as any).email}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#1C2828] rounded text-[9px] text-[#5E8B8C] hover:bg-[#5E8B8C]/10 transition-colors"
                          title="Enviar email"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                      )}
                    </div>
                  )}
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
              <div className="space-y-1.5 mb-3">
                {activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex gap-2 text-xs">
                    <span className="text-[#B8965A] flex-shrink-0">
                      {a.type === 'LLAMADA' ? 'L' : a.type === 'VISITA' ? 'V' : a.type === 'EMAIL' ? 'E' : 'N'}
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

            {/* Nota rápida — visible directamente */}
            <div className="flex gap-2">
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    saveQuickNote()
                  }
                }}
                placeholder="Nota rápida (Enter para guardar)..."
                className="flex-1 bg-[#2D3C3C]/60 border border-[#D5C3B6]/15 rounded-lg px-3 py-2 text-xs text-[#FAF6F2] placeholder:text-[#9C8578]/60 focus:outline-none focus:border-[#5E8B8C]/50 resize-none h-16"
                disabled={savingNote}
              />
              <Button
                size="sm"
                onClick={saveQuickNote}
                disabled={!quickNote.trim() || savingNote}
                className="flex-shrink-0 h-16 bg-[#5E8B8C]/20 text-[#5E8B8C] hover:bg-[#5E8B8C]/30 disabled:opacity-50 px-2"
              >
                {savingNote ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </section>

          <Separator className="bg-[#D5C3B6]/10 my-4" />

          {/* Historial de etapas */}
          <section>
            <button
              onClick={loadHistory}
              className="flex items-center justify-between w-full mb-2 text-xs font-semibold uppercase tracking-wide text-[#9C8578] hover:text-[#D5C3B6] transition-colors"
            >
              <span>Historial de etapas</span>
              {showHistory ? '▲' : '▼'}
            </button>
            {showHistory && history.length > 0 && (
              <div className="space-y-2">
                {history.map((h) => {
                  const from = STAGE_COLUMNS.find(s => s.stage === h.fromStage)
                  const to = STAGE_COLUMNS.find(s => s.stage === h.toStage)
                  return (
                    <div key={h.id} className="flex items-center justify-between gap-2 p-2 bg-[#2D3C3C]/40 rounded-lg text-[10px]">
                      <div className="flex-1">
                        <div className="text-[#9C8578]">
                          {new Date(h.changedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[#D5C3B6]">
                          {from && <span>● {from.label}</span>}
                          <span className="text-[#9C8578]">→</span>
                          {to && <span>● {to.label}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <Separator className="bg-[#D5C3B6]/10 my-4" />

          <AttachmentsSection dealId={deal.id} attachments={attachments} onUpdate={onUpdate} />
          </div>
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
