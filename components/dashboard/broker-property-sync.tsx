"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Check, RefreshCw, Loader2, Home } from "lucide-react"

interface BrokerPropertySyncProps {
  landlordId: string
  brokerId: string
  onSyncComplete?: () => void
}

export function BrokerPropertySync({ 
  landlordId, 
  brokerId, 
  onSyncComplete 
}: BrokerPropertySyncProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    total: number
    synced: number
    lastSync?: Date
  } | null>(null)

  useEffect(() => {
    checkSyncStatus()
  }, [landlordId, brokerId])

  const checkSyncStatus = async () => {
    try {
      const response = await fetch(`/api/sync/broker-property-status?landlordId=${landlordId}&brokerId=${brokerId}`)
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data)
      }
    } catch (error) {
      console.error('Error checking sync status:', error)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    
    try {
      // Obtener todas las propiedades del landlord
      const propertiesResponse = await fetch(`/api/properties?landlordId=${landlordId}`)
      if (!propertiesResponse.ok) {
        throw new Error('No se pudieron obtener las propiedades')
      }
      
      const propertiesData = await propertiesResponse.json()
      const properties = propertiesData.properties || []
      
      if (properties.length === 0) {
        toast.error('El propietario no tiene propiedades registradas')
        return
      }

      // Sincronizar acceso a todas las propiedades
      const syncResponse = await fetch('/api/sync/broker-property-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landlordId,
          brokerId,
          propertyIds: properties.map((p: any) => p.id)
        })
      })

      if (!syncResponse.ok) {
        const error = await syncResponse.json()
        throw new Error(error.error || 'Error al sincronizar')
      }

      const syncData = await syncResponse.json()
      
      toast.success('Sincronización completada', {
        description: `Se sincronizaron ${syncData.syncedProperties} de ${syncData.totalRequested} propiedades`
      })

      // Actualizar estado
      setSyncStatus({
        total: syncData.totalRequested,
        synced: syncData.syncedProperties,
        lastSync: new Date()
      })

      onSyncComplete?.()
      
      // Recargar la página después de un momento
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error('Error syncing properties:', error)
      toast.error(error instanceof Error ? error.message : 'Error al sincronizar propiedades')
    } finally {
      setIsSyncing(false)
    }
  }

  if (!syncStatus) {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Verificando estado de sincronización...</p>
      </div>
    )
  }

  const isFullySynced = syncStatus.total === syncStatus.synced

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Propiedades sincronizadas
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {syncStatus.synced} de {syncStatus.total} propiedades
          </p>
          {syncStatus.lastSync && (
            <p className="text-xs text-muted-foreground">
              Última sincronización: {syncStatus.lastSync.toLocaleString('es-CL')}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isFullySynced ? (
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              Sincronizado
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
              <RefreshCw className="h-3 w-3" />
              Pendiente
            </Badge>
          )}
        </div>
      </div>

      {!isFullySynced && (
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sincronizar propiedades
            </>
          )}
        </Button>
      )}

      {isFullySynced && (
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="outline"
          className="w-full gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Actualizar sincronización
            </>
          )}
        </Button>
      )}
    </div>
  )
}
