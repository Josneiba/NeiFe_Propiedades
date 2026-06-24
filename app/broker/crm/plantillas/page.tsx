'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface Template {
  id: string
  body: string
  subject?: string
  channel: 'TELEFONO' | 'WHATSAPP' | 'EMAIL' | 'PRESENCIAL' | 'VIDEO'
  createdAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ body: '', subject: '', channel: 'WHATSAPP' })
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const res = await fetch('/api/crm/templates')
      if (res.ok) setTemplates(await res.json())
    } catch {
      toast.error('Error cargando plantillas')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!formData.body.trim()) {
      toast.error('La plantilla no puede estar vacía')
      return
    }

    try {
      const res = await fetch('/api/crm/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success('Plantilla guardada')
        setFormData({ body: '', subject: '', channel: 'WHATSAPP' })
        setShowForm(false)
        loadTemplates()
      } else {
        toast.error('Error al guardar plantilla')
      }
    } catch {
      toast.error('Error al guardar plantilla')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla?')) return
    try {
      const res = await fetch(`/api/crm/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Plantilla eliminada')
        loadTemplates()
      }
    } catch {
      toast.error('Error al eliminar plantilla')
    }
  }

  const channelLabels = {
    WHATSAPP: 'WhatsApp',
    EMAIL: 'Email',
    TELEFONO: 'Teléfono',
    PRESENCIAL: 'Presencial',
    VIDEO: 'Video',
  }

  const channelColors = {
    WHATSAPP: 'bg-green-500/20 text-green-300',
    EMAIL: 'bg-blue-500/20 text-blue-300',
    TELEFONO: 'bg-purple-500/20 text-purple-300',
    PRESENCIAL: 'bg-orange-500/20 text-orange-300',
    VIDEO: 'bg-pink-500/20 text-pink-300',
  }

  if (loading) return (
    <div className="min-h-screen bg-[#1a2424] p-6 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#5E8B8C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1a2424] text-[#FAF6F2]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Plantillas de Mensajes</h1>
            <p className="text-sm text-[#D5C3B6]/60 mt-1">Gestiona plantillas reutilizables por canal</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm)
              setEditing(null)
              if (!showForm) setFormData({ body: '', subject: '', channel: 'WHATSAPP' })
            }}
            className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#D5C3B6]/60 uppercase mb-2">
                Canal
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                className="w-full bg-[#2D3C3C] border border-[#D5C3B6]/15 rounded text-[#FAF6F2] px-3 py-2 text-sm"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
                <option value="TELEFONO">Teléfono</option>
              </select>
            </div>

            {formData.channel === 'EMAIL' && (
              <div>
                <label className="block text-xs font-semibold text-[#D5C3B6]/60 uppercase mb-2">
                  Asunto
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Asunto del email"
                  className="bg-[#2D3C3C] border-[#D5C3B6]/15 text-[#FAF6F2] h-9"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#D5C3B6]/60 uppercase mb-2">
                Contenido
              </label>
              <p className="text-xs text-[#D5C3B6]/50 mb-2">
                Usa {'{'}  {'}'} para variables: {'{'}corredor{'}'}, {'{'}nombre{'}'}, {'{'}propiedad{'}'}, {'{'}monto{'}'}
              </p>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Escribe tu plantilla aqui..."
                className="w-full bg-[#2D3C3C] border border-[#D5C3B6]/15 rounded px-3 py-2 text-sm text-[#FAF6F2] placeholder-[#9C8578]/40 focus:outline-none focus:border-[#5E8B8C]/50 resize-none h-32"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ body: '', subject: '', channel: 'WHATSAPP' })
                }}
                className="text-[#D5C3B6]/60"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90"
              >
                Guardar Plantilla
              </Button>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid gap-4">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-[#D5C3B6]/40">
              <p>No hay plantillas. Crea una nueva para comenzar.</p>
            </div>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs ${(channelColors[t.channel as keyof typeof channelColors])}`}>
                        {channelLabels[t.channel as keyof typeof channelLabels]}
                      </Badge>
                      <span className="text-xs text-[#D5C3B6]/50">
                        {new Date(t.createdAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <p className="text-sm text-[#FAF6F2] whitespace-pre-wrap break-words">{t.body}</p>
                    {t.subject && (
                      <p className="text-xs text-[#B8965A] mt-2 font-semibold">Asunto: {t.subject}</p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(t.body)
                        toast.success('Copiado al portapapeles')
                      }}
                      className="text-[#D5C3B6]/60 hover:text-[#D5C3B6]"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(t.id)}
                      className="text-red-400/60 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
