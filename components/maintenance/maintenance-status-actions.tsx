'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Check, Loader2, Play, XCircle } from 'lucide-react'

type ProviderOption = {
  id: string
  name: string
}

type Props = {
  requestId: string
  currentStatus: 'REQUESTED' | 'REVIEWING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  providers?: ProviderOption[]
}

export function MaintenanceStatusActions({
  requestId,
  currentStatus,
  providers = [],
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [providerId, setProviderId] = useState('')

  const updateStatus = async (
    status: Props['currentStatus'],
    extra?: Record<string, unknown>
  ) => {
    setLoadingAction(status)
    try {
      const res = await fetch(`/api/maintenance/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...extra,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la mantención')

      toast({
        title: 'Mantención actualizada',
        description: `Nuevo estado: ${status}`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo actualizar la mantención',
        variant: 'destructive',
      })
    } finally {
      setLoadingAction(null)
    }
  }

  if (currentStatus === 'COMPLETED' || currentStatus === 'REJECTED') {
    return null
  }

  return (
    <div className="space-y-3 pt-2">
      {providers.length > 0 && (currentStatus === 'APPROVED' || currentStatus === 'IN_PROGRESS') ? (
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">Seleccionar proveedor</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(currentStatus === 'REQUESTED' || currentStatus === 'REVIEWING') && (
          <>
            <Button
              className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
              disabled={loadingAction !== null}
              onClick={() =>
                updateStatus('APPROVED', {
                  note: 'Solicitud aprobada para gestión',
                })
              }
            >
              {loadingAction === 'APPROVED' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Aprobar
            </Button>
            <Button
              variant="outline"
              className="border-red-500/30 text-red-600"
              disabled={loadingAction !== null}
              onClick={() =>
                updateStatus('REJECTED', {
                  rejectionReason: 'No corresponde aprobación en esta etapa',
                  note: 'Solicitud rechazada',
                })
              }
            >
              {loadingAction === 'REJECTED' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Rechazar
            </Button>
          </>
        )}

        {currentStatus === 'APPROVED' && (
          <Button
            className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
            disabled={loadingAction !== null}
            onClick={() =>
              updateStatus('IN_PROGRESS', {
                providerId: providerId || undefined,
                note: providerId
                  ? 'Trabajo iniciado con proveedor asignado'
                  : 'Trabajo iniciado',
              })
            }
          >
            {loadingAction === 'IN_PROGRESS' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Iniciar trabajo
          </Button>
        )}

        {currentStatus === 'IN_PROGRESS' && (
          <Button
            className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
            disabled={loadingAction !== null}
            onClick={() =>
              updateStatus('COMPLETED', {
                providerId: providerId || undefined,
                note: 'Trabajo completado',
              })
            }
          >
            {loadingAction === 'COMPLETED' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Marcar completada
          </Button>
        )}
      </div>
    </div>
  )
}
