'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Trash2, Copy, Plus, Building2, Users, Phone, Mail } from 'lucide-react'
import { DealCardData } from './kanban-card'
import { STAGE_COLUMNS } from '@/lib/crm-stage-utils'
import { ActivityLogModal } from './activity-log-modal'
import { LinkContactModal } from './link-contact-modal'
import { AttachmentsSection } from './attachments-section'
import { StageChecklist } from './stage-checklist'
import { AdminRequirements } from './admin-requirements'
import { RecommendationsPanel } from './recommendations-panel'
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
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-full p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="progress" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">
                  Progreso
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">
                  Línea de tiempo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
                  <div className="space-y-4">
                    <section className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1B2A2A] p-5">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#9C8578] mb-3">
                        <Building2 className="h-4 w-4 text-[#5E8B8C]" />
                        <span>Propiedad</span>
                      </div>
                      {deal.property ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-[#B8965A]">{deal.property.code}</p>
                              <p className="text-base font-semibold text-[#FAF6F2] truncate">{deal.property.address}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-[#D5C3B6]/20 text-[#9C8578]">
                              {deal.property.type}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#9C8578] italic">Sin propiedad vinculada</p>
                      )}
                    </section>

                    <section className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1B2A2A] p-5">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#9C8578] mb-3">
                        <Users className="h-4 w-4 text-[#5E8B8C]" />
                        <span>Contactos</span>
                      </div>
                      <div className="space-y-3">
                        {deal.contacts.length === 0 ? (
                          <p className="text-xs text-[#9C8578] italic">Sin contactos vinculados</p>
                        ) : (
                          deal.contacts.map((dc) => (
                            <div key={dc.contact.id} className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs text-[#B8965A]">{dc.contact.code}</p>
                                  <p className="text-sm font-semibold text-[#FAF6F2] truncate">{dc.contact.name}</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] border-[#D5C3B6]/20 text-[#9C8578]">
                                  {dc.role === 'PROPIETARIO' ? 'Propietario' : dc.role === 'ARRENDATARIO' ? 'Arrendatario' : dc.role}
                                </Badge>
                              </div>
                              {(dc.contact as any)?.phone || (dc.contact as any)?.email ? (
                                <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#9C8578]">
                                  {(dc.contact as any).phone && <span>📱 { (dc.contact as any).phone }</span>}
                                  {(dc.contact as any).email && <span>✉️ { (dc.contact as any).email }</span>}
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>

                  <aside className="space-y-4">
                    <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1B2A2A] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Datos rápidos</p>
                          <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{deal.code}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-[#D5C3B6]/20 text-[#9C8578]">
                          {STAGE_COLUMNS.find((s) => s.stage === deal.stage)?.label || deal.stage}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-3 text-sm text-[#D5C3B6]">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Fecha objetivo</p>
                          <p className="mt-1 text-[#FAF6F2]">{dueDate || 'No definida'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Actividades registradas</p>
                          <p className="mt-1 text-[#FAF6F2]">{activities.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1B2A2A] p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578] mb-3">Recomendaciones</p>
                      <RecommendationsPanel contactId={deal.contacts[0]?.contact.id ?? undefined} maxItems={3} />
                    </div>
                  </aside>
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <section className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1B2A2A] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Progreso</p>
                      <h3 className="mt-2 text-lg font-semibold text-[#FAF6F2]">Estado de la oportunidad</h3>
                    </div>
                    <Button size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={loadActivities}>
                      Actualizar
                    </Button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#212E2E] p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Etapa actual</p>
                      <p className="mt-4 text-4xl font-semibold text-[#FAF6F2]">{STAGE_COLUMNS.find((s) => s.stage === deal.stage)?.label || deal.stage}</p>
                      <p className="mt-2 text-sm text-[#9C8578]">Avance del ciclo de venta</p>
                    </div>
                    <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#212E2E] p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Interacciones</p>
                      <p className="mt-4 text-4xl font-semibold text-[#FAF6F2]">{activities.length}</p>
                      <p className="mt-2 text-sm text-[#9C8578]">Registros totales</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1B2A2A] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#9C8578]">
                    <Building2 className="h-4 w-4 text-[#5E8B8C]" />
                    <span>Actualizaciones rápidas</span>
                  </div>
                  <Select value={localStage} onValueChange={(v) => handleStageChange(v as CrmDealStage)} disabled={movingStage}>
                    <SelectTrigger className="w-full h-10 bg-[#2D3C3C] border-[#D5C3B6]/15 text-[#FAF6F2] text-xs">
                      <SelectValue placeholder="Cambiar etapa" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/10">
                      {STAGE_COLUMNS.filter((s) => s.stage !== 'ADMINISTRAR').map((s) => (
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
                  {['FIRMA_CONTRATO', 'ENTREGA_LLAVES'].includes(deal.stage) && <AdminRequirements deal={deal} />}
                  <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Fecha objetivo</p>
                        <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{dueDate || 'No definida'}</p>
                      </div>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={handleDueDateChange}
                        disabled={savingDate}
                        className="h-10 bg-[#2D3C3C] border border-[#D5C3B6]/15 rounded px-3 text-xs text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]/50 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </section>

                <StageChecklist dealId={deal.id} onCanAdvanceChange={setCanAdvance} />
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Registro</p>
                    <h3 className="text-lg font-semibold text-[#FAF6F2]">Línea de tiempo de actividades</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setShowActivityModal(true)}>
                      Registrar actividad
                    </Button>
                    <Button size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={loadActivities}>
                      Actualizar actividades
                    </Button>
                  </div>
                </div>

                {loadingActivities ? (
                  <p className="text-xs text-[#9C8578] animate-pulse">Cargando...</p>
                ) : activities.length === 0 ? (
                  <p className="text-xs text-[#9C8578] italic">Sin actividades registradas</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((a) => (
                      <div key={a.id} className="rounded-3xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">{a.type}</p>
                            <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{a.title}</p>
                          </div>
                          <p className="text-xs text-[#9C8578]">{new Date(a.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</p>
                        </div>
                        {a.description && <p className="mt-3 text-xs text-[#D5C3B6]">{a.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1B2A2A] p-4">
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
                      className="flex-1 bg-[#2D3C3C]/60 border border-[#D5C3B6]/15 rounded-lg px-3 py-2 text-xs text-[#FAF6F2] placeholder:text-[#9C8578]/60 focus:outline-none focus:border-[#5E8B8C]/50 resize-none h-20"
                      disabled={savingNote}
                    />
                    <Button
                      size="sm"
                      onClick={saveQuickNote}
                      disabled={!quickNote.trim() || savingNote}
                      className="flex-shrink-0 h-12 bg-[#5E8B8C]/20 text-[#5E8B8C] hover:bg-[#5E8B8C]/30 disabled:opacity-50 px-4"
                    >
                      {savingNote ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>

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
                      const from = STAGE_COLUMNS.find((s) => s.stage === h.fromStage)
                      const to = STAGE_COLUMNS.find((s) => s.stage === h.toStage)
                      return (
                        <div key={h.id} className="flex items-center justify-between gap-2 p-3 bg-[#2D3C3C]/40 rounded-3xl text-[10px]">
                          <div>
                            <div className="text-[#9C8578]">
                              {new Date(h.changedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[#D5C3B6]">
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
              </TabsContent>
            </Tabs>

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
