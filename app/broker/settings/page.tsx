'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Loader } from 'lucide-react'
import { toast } from 'sonner'

export default function BrokerSettingsPage() {
  const [dailyContactGoal, setDailyContactGoal] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/broker/settings')
        if (res.ok) {
          const data = await res.json()
          setDailyContactGoal(data.dailyContactGoal || 10)
        }
      } catch (e) {
        toast.error('Error al cargar configuración')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  async function handleSave() {
    if (dailyContactGoal < 1 || dailyContactGoal > 100) {
      toast.error('La meta debe estar entre 1 y 100')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/broker/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyContactGoal }),
      })

      if (res.ok) {
        toast.success('Configuración guardada')
      } else {
        toast.error('Error al guardar configuración')
      }
    } catch (e) {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a2424] p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#5E8B8C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a2424] text-[#FAF6F2]">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-sm text-[#D5C3B6]/60 mt-1">Personaliza tu experiencia en el CRM</p>
        </div>

        <Card className="bg-[#1a2a2a] border-[#2D3C3C]">
          <CardHeader>
            <CardTitle className="text-[#FAF6F2]">Objetivos Diarios</CardTitle>
            <CardDescription className="text-[#D5C3B6]/60">
              Define tu meta de contactos por día en la sección "Mi Día"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#D5C3B6] mb-2">
                Meta de Contactos por Día
              </label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={dailyContactGoal}
                    onChange={(e) => setDailyContactGoal(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="bg-[#2D3C3C] border-[#D5C3B6]/20 text-[#FAF6F2] h-10"
                  />
                </div>
                <p className="text-xs text-[#D5C3B6]/50">contactos/día</p>
              </div>
              <p className="text-xs text-[#9C8578] mt-2">
                Valor actual: {dailyContactGoal} contactos. Este será el objetivo en tu panel diario.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2]"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
