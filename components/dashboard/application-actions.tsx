"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Check, AlertTriangle } from 'lucide-react'

interface Props {
  applicationId: string
  status: string
}

export default function ApplicationActions({ applicationId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const handleApprove = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Error al aprobar la postulación')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (rejecting) return
    setRejecting(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Error al rechazar la postulación')
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status !== 'APPROVED' && (
        <Button onClick={handleApprove} className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white" disabled={loading}>
          <Check className="h-4 w-4 mr-2" />
          Aprobar
        </Button>
      )}

      {status !== 'REJECTED' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-[#C27F79]/20 text-[#C27F79]">
              <Trash2 className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar rechazo</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[#9C8578] mt-2">¿Deseas rechazar esta postulación? Esta acción puede revertirse manualmente.</p>
            <DialogFooter>
              <div className="flex gap-2 mt-4 justify-end">
                <Button variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">Cancelar</Button>
                <Button className="bg-[#C27F79] hover:bg-[#C27F79]/90 text-white" onClick={handleReject} disabled={rejecting}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Confirmar rechazo
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
