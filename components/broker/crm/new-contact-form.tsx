'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, Check, Plus, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface FormState {
  name: string
  type: string
  priority: string
  phone: string
  email: string
  rut: string
  source: string
  wasReferred: boolean
  referredBy: string
  invitedToScheduleVisit: boolean
  interestedCommune: string
  interestedPropertyType: string
  budgetMin: string
  budgetMax: string
  preferredChannel: string
  notes: string
}

// Mismo estilo que en la pantalla de Filtros: el select se ve como texto +
// flecha integrados en la fila, no como una caja de formulario aparte.
const FLAT_SELECT_TRIGGER =
  'h-auto w-auto gap-1 border-none bg-transparent p-0 text-sm font-medium text-[#FAF6F2] shadow-none hover:text-[#7FB8B9] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[placeholder]:text-[#9C8578]'

const INITIAL_STATE: FormState = {
  name: '',
  type: 'LEAD',
  priority: 'MEDIUM',
  phone: '',
  email: '',
  rut: '',
  source: 'OTRO',
  wasReferred: false,
  referredBy: '',
  invitedToScheduleVisit: false,
  interestedCommune: '',
  interestedPropertyType: '',
  budgetMin: '',
  budgetMax: '',
  preferredChannel: '',
  notes: '',
}

// Formulario completo de "Nuevo contacto" — página propia (no modal), con el
// mismo patrón de PME: header con cerrar/guardar arriba, secciones con
// campos que se revelan con un "+", una tarjeta destacada con explicación, y
// un bloque de "más opciones" plegado por defecto. Los campos de intereses
// (comuna, tipo de propiedad, presupuesto) son el equivalente inmobiliario de
// los campos de PME.
export function NewContactForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [showPhone, setShowPhone] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [showRut, setShowRut] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          priority: form.priority,
          phone: form.phone || null,
          email: form.email || null,
          rut: form.rut || null,
          source: form.source,
          referredBy: form.wasReferred ? form.referredBy || null : null,
          interestedCommune: form.interestedCommune || null,
          interestedPropertyType: form.interestedPropertyType || null,
          budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
          preferredChannel: form.preferredChannel || null,
          notes: form.notes || null,
        }),
      })

      if (!res.ok) throw new Error()
      const created = await res.json()

      if (form.invitedToScheduleVisit) {
        const activityRes = await fetch('/api/crm/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'VISITA',
            title: 'Invitado a agendar visita',
            description: 'Se invitó al contacto a agendar una visita después de crear su perfil.',
            contactId: created.id,
            isDone: true,
            completedAt: new Date().toISOString(),
          }),
        })

        if (!activityRes.ok) throw new Error()
      }

      toast.success(`Contacto ${created.code} creado correctamente`)
      router.push('/broker/crm/contactos')
      router.refresh()
    } catch {
      toast.error('No se pudo crear el contacto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1C2828] text-[#FAF6F2]">
      {/* Header sticky: cerrar a la izquierda, guardar (check) a la derecha — igual patrón que "Person hinzufügen" en PME */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#2D3C3C] bg-[#1C2828] px-4 py-3">
        <Link
          href="/broker/crm/contactos"
          aria-label="Cerrar"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#9C8578] hover:bg-[#152022]"
        >
          <X className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-[#FAF6F2]">Nuevo contacto</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          aria-label="Guardar contacto"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C27F79] text-[#1C2828] transition hover:bg-[#C27F79]/85 disabled:opacity-60"
        >
          <Check className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-xl space-y-7 p-4 pb-16">
        {/* Datos básicos */}
        <section className="space-y-3">
          <div>
            <Label htmlFor="name" className="mb-1 block text-xs font-semibold text-[#9C8578]">Nombre completo *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => set('name', event.target.value)}
              placeholder="Carlos Mendoza"
              className="h-11 border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-[#2D3C3C]/70 py-3">
              <span className="text-sm text-[#D5C3B6]">Tipo *</span>
              <Select value={form.type} onValueChange={(value) => set('type', value)}>
                <SelectTrigger className={FLAT_SELECT_TRIGGER}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                  <SelectItem value="LEAD">Lead</SelectItem>
                  <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                  <SelectItem value="ARRENDATARIO">Arrendatario</SelectItem>
                  <SelectItem value="INVERSIONISTA">Inversionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-[#D5C3B6]">Fuente *</span>
              <Select value={form.source} onValueChange={(value) => set('source', value)}>
                <SelectTrigger className={FLAT_SELECT_TRIGGER}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                  <SelectItem value="PORTAL">Portal</SelectItem>
                  <SelectItem value="REFERIDO">Referido</SelectItem>
                  <SelectItem value="RRSS">RRSS</SelectItem>
                  <SelectItem value="LLAMADA_DIRECTA">Llamada directa</SelectItem>
                  <SelectItem value="LETRERO">Letrero</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Tarjeta destacada — mismo patrón visual que la tarjeta persuasiva de
            PME ("Zur Kirche eingeladen"), aplicado a algo que sí existe en el
            modelo de datos: marcar el contacto como prioridad alta. */}
        <section className="space-y-3 rounded-2xl border border-[#2D3C3C] bg-[#152022] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#FAF6F2]">
              <span className="text-base">⭐</span> Prioridad alta
            </div>
            <Switch
              checked={form.priority === 'HIGH'}
              onCheckedChange={(checked) => set('priority', checked ? 'HIGH' : 'MEDIUM')}
            />
          </div>
          <p className="text-xs leading-relaxed text-[#9C8578]">
            Los contactos de prioridad alta aparecen destacados con una estrella en la lista y suben primero en tus tareas pendientes — úsalo para quien necesita seguimiento inmediato.
          </p>

          <div className="flex items-center justify-between gap-4 border-t border-[#2D3C3C] pt-3">
            <div>
              <div className="text-sm font-medium text-[#FAF6F2]">Invitado a agendar visita</div>
              <p className="text-xs leading-relaxed text-[#9C8578]">
                Se registrará una actividad de CRM para recordar que el contacto debe visitar una propiedad.
              </p>
            </div>
            <Switch
              checked={form.invitedToScheduleVisit}
              onCheckedChange={(checked) => set('invitedToScheduleVisit', Boolean(checked))}
            />
          </div>
        </section>

        {/* Datos de contacto — cada campo se revela con un "+", igual que en PME */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Datos de contacto</h2>

          {showPhone ? (
            <Input
              autoFocus
              value={form.phone}
              onChange={(event) => set('phone', event.target.value)}
              placeholder="+56 9 8765 4321"
              className="h-11 border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowPhone(true)}
              className="flex items-center gap-2 text-sm font-medium text-[#C27F79]"
            >
              <Plus className="h-4 w-4" /> Teléfono
            </button>
          )}

          {showEmail ? (
            <Input
              autoFocus
              type="email"
              value={form.email}
              onChange={(event) => set('email', event.target.value)}
              placeholder="correo@mail.com"
              className="h-11 border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="flex items-center gap-2 text-sm font-medium text-[#C27F79]"
            >
              <Plus className="h-4 w-4" /> Email
            </button>
          )}

          {showRut ? (
            <Input
              autoFocus
              value={form.rut}
              onChange={(event) => set('rut', event.target.value)}
              placeholder="12.345.678-9"
              className="h-11 border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowRut(true)}
              className="flex items-center gap-2 text-sm font-medium text-[#C27F79]"
            >
              <Plus className="h-4 w-4" /> RUT
            </button>
          )}
        </section>

        {/* Cómo se enteró / referido */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Cómo llegó</h2>
          <label className="flex items-center gap-2.5 text-sm text-[#FAF6F2]">
            <Checkbox checked={form.wasReferred} onCheckedChange={(checked) => set('wasReferred', Boolean(checked))} />
            ¿Fue referido por alguien?
          </label>
          {form.wasReferred && (
            <Input
              autoFocus
              value={form.referredBy}
              onChange={(event) => set('referredBy', event.target.value)}
              placeholder="Nombre de quién lo refirió"
              className="h-11 border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
            />
          )}
        </section>

        {/* Más opciones — plegado por defecto, igual a "Optionen einblenden" de PME */}
        {!showMoreOptions ? (
          <button
            type="button"
            onClick={() => setShowMoreOptions(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#C27F79] px-5 py-2.5 text-sm font-semibold text-[#1C2828] transition hover:bg-[#C27F79]/85"
          >
            Mostrar más opciones
            <ChevronDown className="h-4 w-4" />
          </button>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Intereses</h2>
              <div>
                <Label className="mb-1 block text-xs font-semibold text-[#9C8578]">Comuna / sector de interés</Label>
                <Input
                  value={form.interestedCommune}
                  onChange={(event) => set('interestedCommune', event.target.value)}
                  placeholder="Providencia, Ñuñoa..."
                  className="h-11 border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
                />
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-[#D5C3B6]">Tipo de propiedad de interés</span>
                <Select value={form.interestedPropertyType} onValueChange={(value) => set('interestedPropertyType', value)}>
                  <SelectTrigger className={FLAT_SELECT_TRIGGER}>
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                    <SelectItem value="DEPARTAMENTO">Departamento</SelectItem>
                    <SelectItem value="CASA">Casa</SelectItem>
                    <SelectItem value="OFICINA">Oficina</SelectItem>
                    <SelectItem value="LOCAL_COMERCIAL">Local comercial</SelectItem>
                    <SelectItem value="ESTACIONAMIENTO">Estacionamiento</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1 block text-xs font-semibold text-[#9C8578]">Presupuesto mínimo (CLP)</Label>
                  <Input
                    type="number"
                    value={form.budgetMin}
                    onChange={(event) => set('budgetMin', event.target.value)}
                    placeholder="50.000.000"
                    className="h-11 border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-semibold text-[#9C8578]">Presupuesto máximo (CLP)</Label>
                  <Input
                    type="number"
                    value={form.budgetMax}
                    onChange={(event) => set('budgetMax', event.target.value)}
                    placeholder="90.000.000"
                    className="h-11 border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
                  />
                </div>
              </div>
            </section>

            <section className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Método de contacto preferido</h2>
              <Select value={form.preferredChannel} onValueChange={(value) => set('preferredChannel', value)}>
                <SelectTrigger className={FLAT_SELECT_TRIGGER}>
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent className="border-[#2D3C3C] bg-[#1C2828]">
                  <SelectItem value="TELEFONO">Teléfono</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="VIDEO">Videollamada</SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8578]">Notas</h2>
              <Textarea
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
                placeholder="Contexto adicional sobre este contacto..."
                className="border-[#2D3C3C] bg-[#152022] text-[#FAF6F2]"
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
