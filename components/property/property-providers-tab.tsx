'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Phone, Mail, Star } from 'lucide-react'

const SPECIALTY_LABELS: Record<string, string> = {
  PLUMBER: 'Gasfiter / Plomero',
  ELECTRICIAN: 'Electricista',
  PAINTER: 'Pintor',
  CARPENTER: 'Carpintero',
  LOCKSMITH: 'Cerrajero',
  GENERAL: 'Mantención general',
  OTHER: 'Otro',
}

interface Provider {
  id: string
  name: string
  specialty: string
  phone: string
  email?: string | null
  rating?: number | null
  description?: string | null
}

interface AssignedProvider {
  provider: Provider
  notes?: string | null
}

export function PropertyProvidersTab({
  propertyId,
  assignedProviders: initial,
  allProviders,
}: {
  propertyId: string
  assignedProviders: AssignedProvider[]
  allProviders: Provider[]
}) {
  const [assigned, setAssigned] = useState(initial)
  const [selectedId, setSelectedId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const assignedIds = new Set(assigned.map(a => a.provider.id))
  const available = allProviders.filter(p => !assignedIds.has(p.id))

  const handleAssign = async () => {
    if (!selectedId) return
    setLoading(true)

    const res = await fetch(`/api/properties/${propertyId}/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: selectedId, notes }),
    })

    if (res.ok) {
      const provider = allProviders.find(p => p.id === selectedId)!
      setAssigned(prev => [...prev, { provider, notes: notes || null }])
      setSelectedId('')
      setNotes('')
      toast.success('Proveedor asignado a esta propiedad')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Error al asignar proveedor')
    }

    setLoading(false)
  }

  const handleRemove = async (providerId: string) => {
    const res = await fetch(`/api/properties/${propertyId}/providers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId }),
    })

    if (res.ok) {
      setAssigned(prev => prev.filter(a => a.provider.id !== providerId))
      toast.success('Proveedor desasignado')
    } else {
      toast.error('Error al desasignar proveedor')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg text-[#1C1917] mb-1">
          Proveedores de esta propiedad
        </h3>
        <p className="text-sm text-[#9C8578]">
          Los proveedores asignados aquí son visibles para el arrendatario de esta propiedad.
          Cada propiedad puede tener proveedores distintos según su ubicación.
        </p>
      </div>

      {/* Proveedores asignados */}
      {assigned.length === 0 ? (
        <div className="text-center py-10 bg-[#FAF6F2] rounded-xl border border-dashed border-[#D5C3B6]">
          <p className="text-[#9C8578] text-sm">
            Sin proveedores asignados a esta propiedad
          </p>
          <p className="text-xs text-[#9C8578]/60 mt-1">
            Asigna proveedores de tu red para que el arrendatario pueda contactarlos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assigned.map(({ provider, notes: provNotes }) => (
            <div
              key={provider.id}
              className="flex items-start justify-between bg-[#FAF6F2] rounded-xl p-4 border border-[#D5C3B6]/30"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#1C1917] text-sm">{provider.name}</span>
                  {provider.rating && (
                    <span className="flex items-center gap-0.5 text-xs text-[#9C8578]">
                      <Star className="w-3 h-3 fill-[#F2C94C] text-[#F2C94C]" />
                      {provider.rating}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#75524C] font-medium">
                  {SPECIALTY_LABELS[provider.specialty] ?? provider.specialty}
                </p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex items-center gap-1 text-xs text-[#9C8578] hover:text-[#5E8B8C] transition"
                  >
                    <Phone className="w-3 h-3" />
                    {provider.phone}
                  </a>
                  {provider.email && (
                    <a
                      href={`mailto:${provider.email}`}
                      className="flex items-center gap-1 text-xs text-[#9C8578] hover:text-[#5E8B8C] transition"
                    >
                      <Mail className="w-3 h-3" />
                      {provider.email}
                    </a>
                  )}
                </div>
                {provNotes && (
                  <p className="text-xs text-[#9C8578] italic mt-1">{provNotes}</p>
                )}
              </div>
              <button
                onClick={() => handleRemove(provider.id)}
                className="p-1.5 hover:bg-[#C27F79]/10 rounded-lg transition ml-3 flex-shrink-0"
                title="Desasignar proveedor"
              >
                <Trash2 className="w-4 h-4 text-[#C27F79]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Asignar nuevo proveedor */}
      {available.length > 0 && (
        <div className="border-t border-[#D5C3B6]/30 pt-4 space-y-3">
          <p className="text-sm font-medium text-[#1C1917]">Asignar proveedor</p>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full border border-[#D5C3B6] rounded-lg px-3 py-2 text-sm bg-white text-[#1C1917]"
          >
            <option value="">Seleccionar proveedor...</option>
            {available.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {SPECIALTY_LABELS[p.specialty] ?? p.specialty}
              </option>
            ))}
          </select>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas opcionales (ej: disponible fines de semana)"
            className="w-full border border-[#D5C3B6] rounded-lg px-3 py-2 text-sm bg-white text-[#1C1917] placeholder:text-[#9C8578]"
          />
          <button
            onClick={handleAssign}
            disabled={!selectedId || loading}
            className="flex items-center gap-2 bg-[#5E8B8C] text-[#FAF6F2] px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Asignando...' : 'Asignar a esta propiedad'}
          </button>
        </div>
      )}

      {available.length === 0 && assigned.length > 0 && (
        <p className="text-xs text-[#9C8578] text-center">
          Todos tus proveedores ya están asignados a esta propiedad.{' '}
          <a href="/dashboard/proveedores" className="text-[#5E8B8C] hover:underline">
            Agregar más proveedores →
          </a>
        </p>
      )}

      {allProviders.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-[#9C8578]">
            No tienes proveedores en tu red aún.{' '}
            <a href="/dashboard/proveedores" className="text-[#5E8B8C] hover:underline">
              Agregar proveedores →
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
