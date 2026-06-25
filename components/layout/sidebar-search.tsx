'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Target,
  Kanban,
  Users,
  Calendar,
  TrendingUp,
  MessageSquare,
  Building2,
  FileText,
  CreditCard,
  Wrench,
  FileBarChart,
  Settings,
  Search,
  UserCheck,
  ClipboardList,
  AlertCircle,
  BadgeCheck,
  Plus,
} from 'lucide-react'
import type { GlobalSearchResult, SearchResultType } from '@/types/search'

const STATIC_PAGES = [
  { label: 'Mi Día', href: '/broker/crm/mi-dia', icon: Target, group: 'CRM', keywords: ['mi dia', 'tareas', 'hoy'] },
  { label: 'Pipeline', href: '/broker/crm/workspace', icon: Kanban, group: 'CRM', keywords: ['pipeline', 'kanban', 'workspace', 'deals'] },
  { label: 'Contactos CRM', href: '/broker/crm/contactos', icon: Users, group: 'CRM', keywords: ['contactos', 'clientes', 'leads'] },
  { label: 'Calendario CRM', href: '/broker/crm/calendario', icon: Calendar, group: 'CRM', keywords: ['calendario', 'agenda', 'eventos'] },
  { label: 'Métricas', href: '/broker/crm/metricas', icon: TrendingUp, group: 'CRM', keywords: ['metricas', 'estadisticas'] },
  { label: 'Plantillas', href: '/broker/crm/plantillas', icon: MessageSquare, group: 'CRM', keywords: ['plantillas', 'mensajes'] },
  { label: 'Agregar propiedad', href: '/broker/propiedades/nueva', icon: Plus, group: 'Acciones', keywords: ['agregar', 'propiedad', 'nuevo'] },
  { label: 'Agregar mandato', href: '/broker/mandatos/nuevo', icon: Plus, group: 'Acciones', keywords: ['mandato', 'nuevo', 'crear'] },
  { label: 'Propiedades', href: '/broker/propiedades', icon: Building2, group: 'General', keywords: ['propiedades', 'inmuebles'] },
  { label: 'Clientes', href: '/broker/clientes', icon: Users, group: 'General', keywords: ['clientes', 'propietarios'] },
  { label: 'Mandatos', href: '/broker/mandatos', icon: FileText, group: 'General', keywords: ['mandatos'] },
  { label: 'Pagos', href: '/broker/pagos', icon: CreditCard, group: 'Operaciones', keywords: ['pagos', 'cobros'] },
  { label: 'Contratos', href: '/broker/contratos', icon: FileText, group: 'Operaciones', keywords: ['contratos'] },
  { label: 'Mantenciones', href: '/broker/mantenciones', icon: Wrench, group: 'Operaciones', keywords: ['mantenciones', 'reparaciones'] },
  { label: 'Rendiciones', href: '/broker/rendiciones', icon: FileBarChart, group: 'Operaciones', keywords: ['rendiciones', 'reportes'] },
  { label: 'Avisos', href: '/broker/avisos', icon: MessageSquare, group: 'Operaciones', keywords: ['avisos', 'notificaciones'] },
  { label: 'Configuración', href: '/broker/settings', icon: Settings, group: 'Sistema', keywords: ['configuracion', 'ajustes'] },
]

const TYPE_ICONS: Record<SearchResultType, React.FC<{ className?: string }>> = {
  contact: UserCheck,
  deal: ClipboardList,
  property: Building2,
  maintenance: AlertCircle,
  contract: FileText,
  statement: FileBarChart,
  task: BadgeCheck,
}

const TYPE_LABELS: Record<SearchResultType, string> = {
  contact: 'Contactos',
  deal: 'Deals',
  property: 'Propiedades',
  maintenance: 'Mantenciones',
  contract: 'Contratos',
  statement: 'Rendiciones',
  task: 'Tareas',
}

const BADGE_CLASSES: Record<string, string> = {
  green: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40',
  yellow: 'bg-amber-950/60 text-amber-400 border border-amber-800/40',
  red: 'bg-red-950/60 text-red-400 border border-red-800/40',
  blue: 'bg-sky-950/60 text-sky-400 border border-sky-800/40',
  gray: 'bg-[#2D3C3C]/60 text-[#9C8578] border border-[#2D3C3C]',
}

const STATIC_GROUPS = ['Acciones', 'CRM', 'General', 'Operaciones', 'Sistema']

interface SidebarSearchProps {
  isCollapsed: boolean
}

export function SidebarSearch({ isCollapsed }: SidebarSearchProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((current) => !current)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(query.trim())}`, {
          signal: abortRef.current!.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        } else {
          setResults([])
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error)
        }
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => {
      window.clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [query])

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const q = query.toLowerCase()
  const filteredPages = STATIC_PAGES.filter(
    (page) =>
      page.label.toLowerCase().includes(q) ||
      page.keywords.some((keyword) => keyword.includes(q)),
  )

  const resultsByType = new Map<SearchResultType, GlobalSearchResult[]>()
  results.forEach((item) => {
    const list = resultsByType.get(item.type) ?? []
    list.push(item)
    resultsByType.set(item.type, list)
  })

  const hasDynamicResults = results.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir búsqueda global (⌘K)"
        className={`flex items-center rounded-xl transition-all duration-200 text-[#9C8578] hover:text-[#D5C3B6] hover:bg-[#D5C3B6]/5 ${
          isCollapsed
            ? 'justify-center w-full px-2 py-2.5'
            : 'w-full gap-2 px-4 py-2.5'
        }`}
      >
        <Search className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span className="flex-1 text-left text-sm">Buscar...</span>}
        {!isCollapsed && (
          <kbd className="hidden sm:inline text-[10px] border border-[#2D3C3C] rounded px-1.5 py-0.5 text-[#9C8578] font-mono">
            ⌘K
          </kbd>
        )}
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value)
          if (!value) {
            setQuery('')
            setResults([])
          }
        }}
      >
        <CommandInput
          placeholder="Busca personas, deals, propiedades, fechas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading
              ? 'Buscando...'
              : query.length < 2
              ? 'Escribe al menos 2 caracteres'
              : `Sin resultados para "${query}"`}
          </CommandEmpty>

          {hasDynamicResults && (
            <>
              {[...resultsByType.entries()].map(([type, items]) => {
                if (items.length === 0) return null
                const Icon = TYPE_ICONS[type]
                return (
                  <CommandGroup key={type} heading={TYPE_LABELS[type]}>
                    {items.map((item) => (
                      <CommandItem
                        key={`${item.type}-${item.id}`}
                        value={item.title}
                        onSelect={() => navigate(item.href)}
                        className="flex items-start gap-3 py-2.5"
                      >
                        <Icon className="h-4 w-4 mt-1 text-[#5E8B8C]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-[#FAF6F2] truncate">
                              {item.title}
                            </span>
                            {item.meta && (
                              <span className="text-[10px] font-mono text-[#B8965A]">
                                {item.meta}
                              </span>
                            )}
                            {item.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${BADGE_CLASSES[item.badgeColor ?? 'gray']}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="text-xs text-[#9C8578] mt-1 truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
              <CommandSeparator />
            </>
          )}

          {STATIC_GROUPS.map((group) => {
            const pages = filteredPages.filter((page) => page.group === group)
            if (pages.length === 0) return null
            return (
              <CommandGroup key={group} heading={group}>
                {pages.map((page) => (
                  <CommandItem
                    key={`${page.href}-${page.label}`}
                    value={page.label}
                    onSelect={() => navigate(page.href)}
                    className="flex items-center gap-3 py-2"
                  >
                    <page.icon className="h-4 w-4 text-[#9C8578]" />
                    <span className="text-sm text-[#D5C3B6]">{page.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
        <div className="border-t border-[#2D3C3C] px-3 py-2 flex flex-wrap gap-3 text-[10px] text-[#9C8578]">
          <span>
            <kbd className="font-mono">↑↓</kbd> navegar
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> abrir
          </span>
          <span>
            <kbd className="font-mono">Esc</kbd> cerrar
          </span>
        </div>
      </CommandDialog>
    </>
  )
}
