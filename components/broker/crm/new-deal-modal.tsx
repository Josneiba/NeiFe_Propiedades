'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronLeft, Plus, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'

interface ContactResult {
  id: string
  code: string
  name: string
  type: string
  phone: string | null
}

interface LinkedContact {
  contact: ContactResult
  role: 'PROPIETARIO' | 'ARRENDATARIO' | 'AVAL' | 'OTRO'
}

function ContactSearch({
  onSelect,
  onCreateNew,
  placeholder = 'Buscar por nombre o código...',
}: {
  onSelect: (c: ContactResult) => void
  onCreateNew: () => void
  placeholder?: string
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!q.trim()) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/crm/contacts?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json())
      } catch (err) {
        console.error('Error searching contacts:', err)
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [q])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8578]" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="pl-9 bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] text-sm"
        />
      </div>

      {loading && <div className="text-[#9C8578] text-xs py-2">Buscando...</div>}
      {results.length > 0 && (
        <div className="border border-[#D5C3B6]/20 rounded-lg bg-[#1C2828] max-h-64 overflow-y-auto">
          {results.slice(0, 5).map((c: any) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); setQ(''); setResults([]) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#2D3C3C] transition-colors border-b border-[#D5C3B6]/10 last:border-0"
            >
              <span className="font-mono text-[10px] text-[#B8965A]">{c.code}</span>
              <span className="flex-1 text-sm text-[#FAF6F2]">{c.name}</span>
              <Badge className="text-[10px] bg-[#5E8B8C]/20 text-[#5E8B8C] border-[#5E8B8C]/30">
                {c.type === 'PROPIETARIO' ? 'Propietario' : c.type === 'ARRENDATARIO' ? 'Arrendatario' : c.type}
              </Badge>
            </button>
          ))}
        </div>
      )}
      {q.trim().length > 1 && results.length === 0 && !loading && (
        <button
          onClick={() => { onCreateNew(); setQ('') }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#2D3C3C] border border-[#D5C3B6]/20 rounded-lg text-sm text-[#5E8B8C] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear nuevo contacto "{q}"
        </button>
      )}
    </div>
  )
}

function QuickCreateContact({
  initialName,
  onCreated,
  onCancel,
}: {
  initialName?: string
  onCreated: (c: ContactResult) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName || '')
  const [type, setType] = useState('PROPIETARIO')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return toast.error('El nombre es requerido')
    setSaving(true)
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, phone: phone || null, source: 'OTRO' }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      toast.success(`Contacto ${created.code} creado`)
      onCreated({ id: created.id, code: created.code, name: created.name, type: created.type, phone: created.phone })
    } catch {
      toast.error('Error al crear contacto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
      <div className="bg-[#1C2828] border border-[#D5C3B6]/15 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
        <h3 className="text-lg font-semibold text-[#FAF6F2]">Crear contacto rápido</h3>
        
        <div>
          <Label htmlFor="qc-name" className="text-[#9C8578] text-xs font-semibold mb-1.5 block">Nombre *</Label>
          <Input
            id="qc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-8 text-xs" />
        </div>

        <div>
          <Label htmlFor="qc-type" className="text-[#9C8578] text-xs font-semibold mb-1.5 block">Tipo *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/20">
              <SelectItem value="PROPIETARIO">Propietario</SelectItem>
              <SelectItem value="ARRENDATARIO">Arrendatario</SelectItem>
              <SelectItem value="INVERSIONISTA">Inversionista</SelectItem>
              <SelectItem value="LEAD">Lead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="qc-phone" className="text-[#9C8578] text-xs font-semibold mb-1.5 block">Teléfono</Label>
          <Input
            id="qc-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56 9 XXXX"
            className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-8 text-xs" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-[#D5C3B6]/20 text-[#9C8578] flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={saving}
            className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80 flex-1">
            {saving ? 'Creando...' : 'Crear y vincular'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function NewDealModal({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1)
  const [dealId, setDealId] = useState<string | null>(null)
  
  const [title, setTitle] = useState('')
  const [operationType, setOperationType] = useState('ARRIENDO')
  const [value, setValue] = useState('')
  const [savingDeal, setSavingDeal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [linkedContacts, setLinkedContacts] = useState<LinkedContact[]>([])
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [linkingRole, setLinkingRole] = useState<'PROPIETARIO' | 'ARRENDATARIO' | 'AVAL' | 'OTRO'>('PROPIETARIO')

  const [propertyQ, setPropertyQ] = useState('')
  const [propertyResults, setPropertyResults] = useState<any[]>([])
  const [linkedProperty, setLinkedProperty] = useState<any>(null)

  function resetAll() {
    setStep(1); setDealId(null); setTitle(''); setOperationType('ARRIENDO')
    setValue(''); setLinkedContacts([]); setShowQuickCreate(false)
    setLinkedProperty(null); setPropertyQ(''); setPropertyResults([])
  }

  async function handleCreateDeal() {
    if (!title.trim()) return toast.error('El título es requerido')
    setSavingDeal(true)
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, operationType, value: value ? parseFloat(value) : undefined }),
      })
      if (!res.ok) throw new Error()
      const deal = await res.json()
      setDealId(deal.id)
      setStep(2)
      toast.success(`${deal.code} creado — ahora vincula un contacto`)
    } catch {
      toast.error('Error al crear la oportunidad')
    } finally {
      setSavingDeal(false)
    }
  }

  async function handleLinkContact(contact: ContactResult) {
    if (!dealId) return
    try {
      const res = await fetch(`/api/crm/deals/${dealId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id, role: linkingRole, isPrimary: linkedContacts.length === 0 }),
      })
      if (res.ok) {
        setLinkedContacts((prev) => [...prev, { contact, role: linkingRole }])
        toast.success(`[${contact.code}] vinculado como ${linkingRole === 'PROPIETARIO' ? 'Propietario' : 'Arrendatario'}`)
      }
    } catch {
      toast.error('Error al vincular contacto')
    }
  }

  async function handleUnlinkContact(contactId: string) {
    if (!dealId) return
    try {
      await fetch(`/api/crm/deals/${dealId}/contacts/${contactId}`, { method: 'DELETE' })
      setLinkedContacts((prev) => prev.filter((lc) => lc.contact.id !== contactId))
    } catch {
      toast.error('Error al desvincular contacto')
    }
  }

  useEffect(() => {
    if (!propertyQ.trim()) { setPropertyResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/crm/properties?q=${encodeURIComponent(propertyQ)}`)
        if (res.ok) setPropertyResults(await res.json())
      } catch (err) {
        console.error('Error searching properties:', err)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [propertyQ])

  async function handleLinkProperty(property: any) {
    if (!dealId) return
    try {
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      })
      if (res.ok) {
        setLinkedProperty(property)
        toast.success(`Propiedad ${property.code} vinculada`)
      }
    } catch {
      toast.error('Error al vincular propiedad')
    }
  }

  function handleFinish() {
    onCreated()
    onClose()
    resetAll()
  }

  const stepLabels = ['Oportunidad', 'Contactos', 'Propiedad']

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetAll(); onClose() } }}>
      <DialogContent className="bg-[#1C2828] border-[#D5C3B6]/15 text-[#FAF6F2] max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-scale">
        <DialogHeader>
          <DialogTitle>
            Nueva oportunidad
            {/* Step indicator */}
            <div className="flex gap-2 mt-4">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i < step ? 'bg-[#5E8B8C] text-white' :
                    step === i + 1 ? 'bg-[#B8965A] text-white' :
                    'bg-[#2D3C3C] text-[#9C8578]'
                  }`}>{i + 1}</div>
                  {i < stepLabels.length - 1 && <div className={`w-8 h-1 transition-colors ${i < step ? 'bg-[#5E8B8C]' : 'bg-[#D5C3B6]/20'}`} />}
                </div>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* PASO 1: Deal base */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#9C8578] mb-1.5 block">Título de la oportunidad *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDeal()}
                placeholder="Ej: Arriendo Depto Providencia — C. Mendoza"
                className={`bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] ${errors.title ? 'border-red-600' : ''}`}
              />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#9C8578] mb-1.5 block">Tipo de operación</Label>
                <Select value={operationType} onValueChange={setOperationType}>
                  <SelectTrigger className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C2828] border-[#D5C3B6]/20">
                    <SelectItem value="ARRIENDO">Arriendo</SelectItem>
                    <SelectItem value="VENTA">Venta</SelectItem>
                    <SelectItem value="ARRIENDO_Y_VENTA">Arriendo y Venta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#9C8578] mb-1.5 block">Valor CLP (opcional)</Label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="620000"
                  className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2]"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={handleCreateDeal}
                disabled={savingDeal}
                className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80">
                {savingDeal ? 'Creando...' : 'Crear y continuar'}
              </Button>
            </div>
          </div>
        )}

        {/* PASO 2: Contactos */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-[#9C8578] text-sm">
              Vincula los contactos de esta oportunidad. Puedes agregar más después.
            </p>

            {linkedContacts.length > 0 && (
              <div className="space-y-2">
                {linkedContacts.map((lc) => (
                  <div
                    key={lc.contact.id}
                    className="flex items-center justify-between p-3 bg-[#2D3C3C] rounded-lg border border-[#D5C3B6]/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#B8965A]">{lc.contact.code}</span>
                        <span className="text-sm text-[#FAF6F2]">{lc.contact.name}</span>
                        <Badge className="text-[9px] bg-[#5E8B8C]/20 text-[#5E8B8C]">
                          {lc.role === 'PROPIETARIO' ? 'Propietario' : 'Arrendatario'}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnlinkContact(lc.contact.id)}
                      className="text-[#9C8578] hover:text-red-400 transition-colors ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showQuickCreate && (
              <>
                <div>
                  <Label className="text-[#9C8578] text-xs font-semibold mb-2 block">Rol del contacto a agregar</Label>
                  <div className="flex gap-2">
                    {(['PROPIETARIO', 'ARRENDATARIO', 'AVAL'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setLinkingRole(r)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                          linkingRole === r
                            ? 'bg-[#5E8B8C]/30 text-[#5E8B8C] border border-[#5E8B8C]/40'
                            : 'text-[#9C8578] border border-[#D5C3B6]/15 hover:text-[#D5C3B6]'
                        }`}>
                        {r === 'PROPIETARIO' ? 'Propietario' : r === 'ARRENDATARIO' ? 'Arrendatario' : 'Aval'}
                      </button>
                    ))}
                  </div>
                </div>
                <ContactSearch
                  onSelect={(c) => handleLinkContact(c)}
                  onCreateNew={() => setShowQuickCreate(true)}
                  placeholder={`Buscar ${linkingRole === 'PROPIETARIO' ? 'propietario' : 'arrendatario'}...`}
                />
              </>
            )}

            {showQuickCreate && (
              <QuickCreateContact
                onCreated={(c) => { handleLinkContact(c); setShowQuickCreate(false) }}
                onCancel={() => setShowQuickCreate(false)}
              />
            )}

            <div className="flex justify-between pt-4 gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="border-[#D5C3B6]/20 text-[#9C8578]">
                ← Atrás
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="border-[#D5C3B6]/20 text-[#9C8578] text-xs">
                  Saltar
                </Button>
                <Button
                  onClick={() => {
                    if (linkedContacts.length === 0) {
                      toast.error('Agrega al menos un contacto para continuar')
                      return
                    }
                    setStep(3)
                  }}
                  disabled={linkedContacts.length === 0}
                  className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80 text-xs disabled:opacity-50">
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Propiedad CRM */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-[#9C8578] text-sm">
              Vincula una propiedad CRM si ya la tienes en cartera. Puedes hacerlo después también.
            </p>

            {linkedProperty ? (
              <div className="flex items-center justify-between p-3 bg-[#2D3C3C] rounded-lg border border-[#D5C3B6]/10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#B8965A]">{linkedProperty.code}</span>
                    <span className="text-sm text-[#FAF6F2]">{linkedProperty.address}</span>
                  </div>
                </div>
                <button
                  onClick={() => setLinkedProperty(null)}
                  className="text-[#9C8578] hover:text-red-400 transition-colors ml-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8578]" />
                  <Input
                    value={propertyQ}
                    onChange={(e) => setPropertyQ(e.target.value)}
                    placeholder="Buscar por dirección o código INMU-..."
                    className="pl-9 bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] text-sm"
                  />
                </div>
                {propertyResults.length > 0 && (
                  <div className="border border-[#D5C3B6]/20 rounded-lg bg-[#1C2828] max-h-64 overflow-y-auto">
                    {propertyResults.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleLinkProperty(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#2D3C3C] transition-colors border-b border-[#D5C3B6]/10 last:border-0">
                        <span className="font-mono text-[10px] text-[#B8965A]">{p.code}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#FAF6F2] truncate">{p.address}</p>
                          <p className="text-[10px] text-[#9C8578]">{p.commune}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between pt-4 gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="border-[#D5C3B6]/20 text-[#9C8578]">
                ← Atrás
              </Button>
              <Button
                onClick={handleFinish}
                className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80">
                ✓ Finalizar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
