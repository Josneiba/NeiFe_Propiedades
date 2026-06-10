'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Mail, Phone, Building2, Calendar, Tag, X, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ContactType, UnifiedContact } from '@/lib/contactos'

type FilterTab = 'ALL' | ContactType

const TABS: Array<{ key: FilterTab; label: string; color: string }> = [
  { key: 'ALL', label: 'Todos', color: '#D5C3B6' },
  { key: 'OWNER', label: 'Propietarios', color: '#5E8B8C' },
  { key: 'PROSPECT_OWNER', label: 'Prospectos', color: '#9CE2E3' },
  { key: 'TENANT', label: 'Arrendatarios', color: '#5E8B8C' },
  { key: 'BUYER', label: 'Compradores', color: '#B8965A' },
  { key: 'INVESTOR', label: 'Inversores', color: '#75524C' },
]

function tagColor(tag: string): string {
  switch (tag) {
    case 'Propietario':
      return 'bg-[#5E8B8C]/15 text-[#9CE2E3] border-[#5E8B8C]/30'
    case 'Propietario (Prospecto)':
      return 'bg-[#9CE2E3]/15 text-[#9CE2E3] border-[#9CE2E3]/30'
    case 'Arrendatario':
      return 'bg-[#5E8B8C]/15 text-[#9CE2E3] border-[#5E8B8C]/30'
    case 'Comprador':
      return 'bg-[#B8965A]/15 text-[#D4A857] border-[#B8965A]/30'
    case 'Inversor':
      return 'bg-[#75524C]/15 text-[#D5C3B6] border-[#75524C]/30'
    default:
      return 'bg-[#9C8578]/15 text-[#D5C3B6] border-[#9C8578]/30'
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'bg-rose-500/20 text-rose-200 border-rose-400/30'
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-200 border-orange-400/30'
    case 'LOW':
      return 'bg-[#9C8578]/15 text-[#9C8578] border-[#9C8578]/30'
    default:
      return 'bg-[#5E8B8C]/15 text-[#9CE2E3] border-[#5E8B8C]/30'
  }
}

function followUpLabel(next: string | null): { label: string; color: string } | null {
  if (!next) return null
  const d = new Date(next)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const fmt = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  if (diffDays < 0) return { label: `Vencido ${Math.abs(diffDays)}d Â· ${fmt}`, color: 'text-rose-300' }
  if (diffDays === 0) return { label: `Hoy Â· ${fmt}`, color: 'text-yellow-300' }
  if (diffDays <= 3) return { label: `En ${diffDays}d Â· ${fmt}`, color: 'text-orange-300' }
  return { label: fmt, color: 'text-[#9C8578]' }
}

export function ContactosUnifiedClient({ initialContacts }: { initialContacts: UnifiedContact[] }) {
  const [tab, setTab] = useState<FilterTab>('ALL')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return initialContacts.filter((c) => {
      if (tab !== 'ALL' && c.type !== tab) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.publicId.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false) ||
        c.linkedProperties.some(
          (p) =>
            (p.propertyName?.toLowerCase().includes(q) ?? false) ||
            (p.propertyPublicId?.toLowerCase().includes(q) ?? false)
        )
      )
    })
  }, [initialContacts, tab, query])

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: initialContacts.length }
    for (const t of TABS) {
      if (t.key === 'ALL') continue
      map[t.key] = initialContacts.filter((c) => c.type === t.key).length
    }
    return map
  }, [initialContacts])

  const selected = selectedId ? initialContacts.find((c) => c.id === selectedId) ?? null : null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-1">
            Workspace Â· Contactos
          </p>
          <h1 className="text-3xl font-serif font-semibold text-[#FAF6F2]">Todos tus contactos</h1>
          <p className="text-sm text-[#9C8578] mt-2 max-w-2xl">
            Vista unificada de propietarios, prospectos, arrendatarios, compradores e inversores.
            Cada contacto muestra su ID pÃºblico, sus propiedades vinculadas y la etapa actual del workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]">
            <Link href="/broker/contactos?action=new">
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo contacto
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">
            <Link href="/broker/workspace">
              <Building2 className="h-4 w-4 mr-1.5" />
              Ir al Workspace
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition border',
              tab === t.key
                ? 'bg-[#5E8B8C]/20 text-[#9CE2E3] border-[#5E8B8C]/30'
                : 'text-[#9C8578] hover:text-[#D5C3B6] border-transparent hover:border-[#D5C3B6]/10'
            )}
          >
            {t.label} ({counts[t.key] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8578]" />
        <Input
          placeholder="Buscar por nombre, ID pÃºblico, email, telÃ©fono o propiedad..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2]"
        />
      </div>

      {/* Lista de contactos */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D5C3B6]/10 bg-[#1C1917]/40 p-12 text-center">
          <p className="text-sm text-[#9C8578]">Sin contactos en esta categorÃ­a todavÃ­a.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const followUp = followUpLabel(c.nextFollowUpAt)
            return (
              <button
                key={`${c.type}-${c.id}`}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className="text-left rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-4 hover:border-[#B8965A]/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-[#9C8578] truncate">{c.publicId}</p>
                    <p className="text-sm font-semibold text-[#FAF6F2] truncate">{c.name}</p>
                  </div>
                  <Badge className={cn('text-[9px] px-1.5 py-0 border', tagColor(c.tag))}>
                    {c.tag}
                  </Badge>
                </div>

                <div className="space-y-1 text-[11px] text-[#9C8578]">
                  {c.email && (
                    <p className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </p>
                  )}
                  {c.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      {c.phone}
                    </p>
                  )}
                </div>

                {/* Propiedades vinculadas */}
                {c.linkedProperties.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#D5C3B6]/10 space-y-1.5">
                    {c.linkedProperties.slice(0, 2).map((lp, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                        <Building2 className="h-3 w-3 text-[#B8965A] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[#FAF6F2] truncate">
                            {lp.propertyName || lp.propertyPublicId || lp.opportunityPublicId}
                          </p>
                          <p className="text-[#9C8578] truncate">
                            {lp.stageLabel} Â· {lp.attachmentStatus}
                          </p>
                        </div>
                      </div>
                    ))}
                    {c.linkedProperties.length > 2 && (
                      <p className="text-[9px] text-[#9C8578]">
                        +{c.linkedProperties.length - 2} mÃ¡s
                      </p>
                    )}
                  </div>
                )}

                {/* Footer: prioridad + follow-up */}
                <div className="mt-3 flex items-center justify-between">
                  {c.priority && c.priority !== 'NORMAL' && c.priority !== 'MEDIUM' && (
                    <Badge className={cn('text-[9px] px-1.5 py-0 border', priorityColor(c.priority))}>
                      {c.priority}
                    </Badge>
                  )}
                  {followUp && (
                    <p className={cn('text-[10px] flex items-center gap-1', followUp.color)}>
                      <Calendar className="h-3 w-3" />
                      {followUp.label}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Drawer de detalle */}
      {selected && (
        <ContactDetailDrawer contact={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

function ContactDetailDrawer({ contact, onClose }: { contact: UnifiedContact; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Cerrar"
        className="flex-1 bg-[#1C1917]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="w-full max-w-md bg-[#2D3C3C] border-l border-[#D5C3B6]/10 flex flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#2D3C3C] border-b border-[#D5C3B6]/10 p-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-[#9C8578]">{contact.publicId}</p>
            <h2 className="text-lg font-semibold text-[#FAF6F2] truncate">{contact.name}</h2>
            <Badge className={cn('mt-1 text-[10px] px-1.5 py-0 border', tagColor(contact.tag))}>
              <Tag className="h-2.5 w-2.5 mr-1" />
              {contact.tag}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#9C8578]">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#B8965A] mb-2">
              Contacto
            </h3>
            <div className="space-y-1.5 text-xs text-[#FAF6F2]">
              {contact.email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-[#9C8578]" />
                  <a className="hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
              )}
              {contact.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-[#9C8578]" />
                  <a className="hover:underline" href={`tel:${contact.phone}`}>{contact.phone}</a>
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#B8965A] mb-2">
              Estado
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#1C1917] text-[#D5C3B6] border-[#D5C3B6]/20">{contact.status}</Badge>
              {contact.priority && contact.priority !== 'NORMAL' && (
                <Badge className={cn('border', priorityColor(contact.priority))}>{contact.priority}</Badge>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#B8965A] mb-2">
              Propiedades vinculadas ({contact.linkedProperties.length})
            </h3>
            {contact.linkedProperties.length === 0 ? (
              <p className="text-xs text-[#9C8578]">AÃºn no estÃ¡ adjunto a ninguna oportunidad.</p>
            ) : (
              <ul className="space-y-2">
                {contact.linkedProperties.map((lp, idx) => (
                  <li key={idx} className="rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917] p-2.5">
                    <p className="text-[10px] font-mono text-[#9C8578]">
                      {lp.opportunityPublicId}
                      {lp.propertyPublicId ? ` Â· ${lp.propertyPublicId}` : ''}
                    </p>
                    <p className="text-sm text-[#FAF6F2] truncate">
                      {lp.propertyName ?? 'â€” sin propiedad aÃºn â€”'}
                    </p>
                    <p className="text-[10px] text-[#9C8578]">
                      {lp.propertyCommune ?? ''} {lp.propertyCommune ? 'Â·' : ''} {lp.stageLabel} Â· {lp.attachmentStatus}
                    </p>
                    <Button asChild variant="ghost" size="sm" className="mt-1 h-7 px-2 text-[#9CE2E3]">
                      <Link href={`/broker/workspace?focus=${lp.opportunityId}`}>
                        Ver en workspace
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#B8965A] mb-2">
              PrÃ³ximos pasos
            </h3>
            <div className="space-y-1.5 text-xs text-[#FAF6F2]">
              {contact.email && (
                <Button asChild variant="outline" size="sm" className="w-full justify-start border-[#D5C3B6]/20 text-[#D5C3B6]">
                  <a href={`mailto:${contact.email}`}>
                    <Mail className="h-3.5 w-3.5 mr-2" />
                    Enviar email
                  </a>
                </Button>
              )}
              {contact.phone && (
                <Button asChild variant="outline" size="sm" className="w-full justify-start border-[#D5C3B6]/20 text-[#D5C3B6]">
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="h-3.5 w-3.5 mr-2" />
                    Llamar
                  </a>
                </Button>
              )}
              {contact.nextFollowUpAt && (
                <p className="text-[10px] text-[#9C8578] flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  PrÃ³ximo seguimiento: {new Date(contact.nextFollowUpAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
