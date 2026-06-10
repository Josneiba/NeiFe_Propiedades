'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, X, UserPlus, Mail, Phone, Building2, Calendar, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type LeadType = 'TENANT' | 'BUYER' | 'INVESTOR' | 'LANDLORD'

type SearchLead = {
  id: string
  publicId: string
  name: string
  email: string | null
  phone: string | null
  type: LeadType
  status: string
  priority: string
  nextFollowUpAt: string | null
  budgetMaxCLP: number | null
  desiredCommune: string | null
}

type Mode = 'search' | 'create'

type AttachLeadModalProps = {
  opportunityId: string
  propertyName?: string | null
  open: boolean
  onClose: () => void
  onAttached: () => void
}

function typeLabel(t: LeadType): string {
  switch (t) {
    case 'TENANT': return 'Arrendatario'
    case 'BUYER': return 'Comprador'
    case 'INVESTOR': return 'Inversor'
    case 'LANDLORD': return 'Propietario'
    default: return t
  }
}

function typeColor(t: LeadType): string {
  switch (t) {
    case 'TENANT': return 'bg-[#5E8B8C]/15 text-[#9CE2E3] border-[#5E8B8C]/30'
    case 'BUYER': return 'bg-[#B8965A]/15 text-[#D4A857] border-[#B8965A]/30'
    case 'INVESTOR': return 'bg-[#75524C]/15 text-[#D5C3B6] border-[#75524C]/30'
    default: return 'bg-[#9C8578]/15 text-[#D5C3B6] border-[#9C8578]/30'
  }
}

export function AttachLeadModal({ opportunityId, propertyName, open, onClose, onAttached }: AttachLeadModalProps) {
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [leads, setLeads] = useState<SearchLead[]>([])
  const [loading, setLoading] = useState(false)
  const [attachingId, setAttachingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'TENANT' as LeadType,
    budgetMaxCLP: '',
    desiredCommune: '',
  })
  const [creating, setCreating] = useState(false)

  // Cargar leads cuando se abre o cambia query
  useEffect(() => {
    if (!open) return
    if (mode !== 'search') return
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `/api/broker/leads/search?opportunityId=${encodeURIComponent(opportunityId)}&q=${encodeURIComponent(query)}`
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok) throw new Error('Error al buscar leads')
        const data = await res.json()
        setLeads(data.leads ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('No se pudieron cargar los leads')
        }
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [open, mode, query, opportunityId])

  // Bloquear scroll del body
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = original }
    }
  }, [open])

  // ESC para cerrar
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function attachExisting(leadId: string) {
    setAttachingId(leadId)
    setError(null)
    try {
      const res = await fetch(`/api/broker/opportunities/${opportunityId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'No se pudo adjuntar')
      }
      onAttached()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAttachingId(null)
    }
  }

  async function createAndAttach(e: React.FormEvent) {
    e.preventDefault()
    if (form.name.trim().length < 2) {
      setError('Nombre es requerido (mÃ­n. 2 caracteres)')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/broker/leads/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          budgetMaxCLP: form.budgetMaxCLP ? Number(form.budgetMaxCLP) : undefined,
          opportunityId,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'No se pudo crear el lead')
      }
      onAttached()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[#1C1917]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[#D5C3B6]/10">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B8965A]">
              Workspace Â· Adjuntar interesado
            </p>
            <h2 className="text-lg font-semibold text-[#FAF6F2] truncate">
              {propertyName ? `Adjuntar a ${propertyName}` : 'Adjuntar interesado'}
            </h2>
            <p className="text-xs text-[#9C8578] mt-0.5">
              Un lead puede estar adjunto a varias propiedades pero solo puede tener un cierre.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#9C8578]">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-[#D5C3B6]/10">
          <button
            type="button"
            onClick={() => setMode('search')}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              mode === 'search'
                ? 'bg-[#5E8B8C]/20 text-[#9CE2E3]'
                : 'text-[#9C8578] hover:text-[#D5C3B6]'
            )}
          >
            <Search className="h-3 w-3 inline mr-1" />
            Buscar existente
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              mode === 'create'
                ? 'bg-[#5E8B8C]/20 text-[#9CE2E3]'
                : 'text-[#9C8578] hover:text-[#D5C3B6]'
            )}
          >
            <Plus className="h-3 w-3 inline mr-1" />
            Crear nuevo
          </button>
        </div>

        {error && (
          <p className="mx-4 mt-3 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'search' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8578]" />
                <Input
                  placeholder="Buscar por nombre, ID pÃºblico, email o telÃ©fono..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                />
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-[#1C1917] animate-pulse" />
                  ))}
                </div>
              ) : leads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D5C3B6]/10 bg-[#1C1917]/40 p-8 text-center">
                  <p className="text-sm text-[#9C8578]">Sin leads disponibles para adjuntar.</p>
                  <Button
                    type="button"
                    onClick={() => setMode('create')}
                    size="sm"
                    className="mt-3 bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Crear nuevo lead
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {leads.map((l) => (
                    <li
                      key={l.id}
                      className="rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917] p-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-[#9C8578]">{l.publicId}</span>
                          <Badge className={cn('text-[9px] px-1.5 py-0 border', typeColor(l.type))}>
                            {typeLabel(l.type)}
                          </Badge>
                          {l.priority === 'URGENT' || l.priority === 'HIGH' ? (
                            <Badge className="bg-rose-500/15 text-rose-200 text-[9px] px-1.5 py-0 border border-rose-400/20">
                              {l.priority}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-[#FAF6F2] truncate">{l.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[#9C8578]">
                          {l.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-2.5 w-2.5" />
                              {l.email}
                            </span>
                          )}
                          {l.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />
                              {l.phone}
                            </span>
                          )}
                          {l.desiredCommune && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-2.5 w-2.5" />
                              {l.desiredCommune}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={attachingId === l.id}
                        onClick={() => attachExisting(l.id)}
                        className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] shrink-0"
                      >
                        {attachingId === l.id ? '...' : 'Adjuntar'}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <form id="create-lead-form" onSubmit={createAndAttach} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-[#B8965A]">
                    Nombre *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    
className="mt-1 bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
                    placeholder="Providencia, Las Condes, ..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-[#9C8578]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  {creating ? 'Creando...' : 'Crear y adjuntar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
