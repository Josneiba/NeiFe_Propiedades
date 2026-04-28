'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Copy, ExternalLink, Loader2, Mail, RadioTower } from 'lucide-react'

type Application = {
  id: string
  name: string
  email: string
  phone: string
  rut: string
  monthlyIncome: number
  currentEmployer?: string | null
  message?: string | null
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'
  documents: string[]
  createdAt: string
}

type Props = {
  propertyId: string
  propertyAddress: string
  applicationOpen: boolean
  applicationSlug?: string | null
  hasTenant: boolean
  initialApplications?: Application[]
}

export function ApplicationPortalManager({
  propertyId,
  propertyAddress,
  applicationOpen,
  applicationSlug,
  hasTenant,
  initialApplications = [],
}: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [apps, setApps] = useState(initialApplications)
  const [loadingApps, setLoadingApps] = useState(initialApplications.length === 0)
  const [portal, setPortal] = useState({
    applicationOpen,
    applicationSlug,
  })

  const publicUrl = useMemo(() => {
    if (!portal.applicationSlug || typeof window === 'undefined') return null
    return `${window.location.origin}/postular/${portal.applicationSlug}`
  }, [portal.applicationSlug])

  useEffect(() => {
    let active = true

    const loadApplications = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/applications`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'No se pudieron cargar las postulaciones')
        }
        if (!active) return
        setApps(data.applications || [])
        setPortal({
          applicationOpen: Boolean(data.property?.applicationOpen),
          applicationSlug: data.property?.applicationSlug ?? null,
        })
      } catch (error) {
        if (!active) return
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'No se pudieron cargar las postulaciones',
          variant: 'destructive',
        })
      } finally {
        if (active) setLoadingApps(false)
      }
    }

    loadApplications()
    return () => {
      active = false
    }
  }, [propertyId, toast])

  const togglePortal = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}/toggle-applications`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el portal')

      setPortal(data.property)
      toast({
        title: data.property.applicationOpen ? 'Portal activado' : 'Portal desactivado',
        description: data.property.applicationOpen
          ? 'Ya puedes compartir el enlace de postulación.'
          : 'La propiedad dejó de aceptar postulaciones públicas.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el portal',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (applicationId: string, status: Application['status']) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el estado')

      setApps((current) =>
        current.map((app) =>
          app.id === applicationId ? { ...app, status: data.application.status } : app
        )
      )
      toast({ title: 'Estado actualizado' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar la postulación',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#D5C3B6]/10 bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Portal público de postulación</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Comparte un link para recibir postulantes cuando la propiedad esté disponible.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={portal.applicationOpen ? 'text-[#5E8B8C]' : 'text-muted-foreground'}>
              {portal.applicationOpen ? 'Recibiendo postulaciones' : 'Portal desactivado'}
            </Badge>
            <Button
              onClick={togglePortal}
              disabled={saving || hasTenant}
              className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RadioTower className="mr-2 h-4 w-4" />}
              {portal.applicationOpen ? 'Cerrar portal' : 'Abrir portal'}
            </Button>
          </div>
        </div>

        {hasTenant ? (
          <p className="mt-3 text-sm text-[#C27F79]">
            Esta propiedad ya tiene arrendatario activo, así que no puede recibir nuevas postulaciones.
          </p>
        ) : null}

        {portal.applicationOpen && publicUrl ? (
          <div className="mt-4 rounded-xl border border-[#D5C3B6]/10 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Link para compartir</p>
            <div className="mt-2 flex flex-col gap-2 md:flex-row">
              <div className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {publicUrl}
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl)
                  toast({ title: 'Enlace copiado' })
                }}
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Postulaciones recibidas</h3>
          <p className="text-sm text-muted-foreground">{propertyAddress}</p>
        </div>

        {loadingApps ? (
          <div className="rounded-2xl border border-[#D5C3B6]/10 bg-card p-8 text-center text-sm text-muted-foreground">
            Cargando postulaciones...
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl border border-[#D5C3B6]/10 bg-card p-8 text-center text-sm text-muted-foreground">
            Aún no hay postulaciones para esta propiedad.
          </div>
        ) : (
          apps.map((application) => (
            <div key={application.id} className="rounded-2xl border border-[#D5C3B6]/10 bg-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{application.name}</p>
                    <Badge variant="outline">{application.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {application.rut} · ${application.monthlyIncome.toLocaleString('es-CL')} líquidos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {application.email} · {application.phone}
                  </p>
                  {application.currentEmployer ? (
                    <p className="text-sm text-muted-foreground">
                      Empleador: {application.currentEmployer}
                    </p>
                  ) : null}
                  {application.message ? (
                    <p className="text-sm text-foreground/90">{application.message}</p>
                  ) : null}
                  {application.documents.length > 0 ? (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {application.documents.map((document, index) => (
                        <a
                          key={document}
                          href={document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#5E8B8C] hover:underline"
                        >
                          Documento {index + 1}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-[#5E8B8C]/30 text-[#5E8B8C]"
                    onClick={() => updateStatus(application.id, 'APPROVED')}
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#C27F79]/30 text-[#C27F79]"
                    onClick={() => updateStatus(application.id, 'REJECTED')}
                  >
                    Rechazar
                  </Button>
                  <Button variant="outline" className="gap-2" asChild>
                    <a href={`mailto:${application.email}`}>
                      <Mail className="h-4 w-4" />
                      Contactar
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
