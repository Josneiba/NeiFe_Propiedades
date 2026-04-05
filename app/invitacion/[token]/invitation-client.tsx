'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Building2, MapPin, DollarSign, User } from 'lucide-react'

interface Invitation {
  property: {
    name: string
    address: string
    commune: string
    region: string
    monthlyRentUF: number | null
    monthlyRentCLP: number | null
  }
  sender: {
    name: string
  }
  expiresAt: string
}

export default function InvitationClient({
  invitation,
  token,
}: {
  invitation: Invitation
  token: string
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  const handleAccept = async () => {
    setAccepting(true)
    setError('')

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (res.ok) {
        router.push('/mi-arriendo')
        router.refresh()
      } else {
        setError(data.error ?? 'Error al aceptar la invitación')
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setAccepting(false)
    }
  }

  const daysUntilExpiry = Math.ceil(
    (new Date(invitation.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="bg-[#2D3C3C] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#75524C]/20 border-b border-[#75524C]/20 px-8 py-6">
        <div className="flex items-center gap-3 mb-1">
          <User className="w-5 h-5 text-[#9C8578]" />
          <p className="text-[#9C8578] text-sm">Invitación de</p>
        </div>
        <p className="text-[#FAF6F2] font-semibold text-lg">{invitation.sender.name}</p>
      </div>

      {/* Detalles de la propiedad */}
      <div className="px-8 py-6 space-y-4">
        <h2 className="font-serif text-xl text-[#FAF6F2]">
          {invitation.property.name}
        </h2>

        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-[#9C8578]">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#75524C]" />
            <span>{invitation.property.address}, {invitation.property.commune}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-[#9C8578]">
            <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#75524C]" />
            <span>Región {invitation.property.region}</span>
          </div>
          {(invitation.property.monthlyRentUF || invitation.property.monthlyRentCLP) && (
            <div className="flex items-start gap-2 text-sm text-[#D5C3B6]">
              <DollarSign className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#5E8B8C]" />
              <span className="font-mono">
                {invitation.property.monthlyRentUF
                  ? `UF ${invitation.property.monthlyRentUF}/mes`
                  : `$${invitation.property.monthlyRentCLP?.toLocaleString('es-CL')}/mes`
                }
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-[#9C8578] bg-[#1C1917]/30 rounded-lg px-3 py-2">
          Esta invitación expira en {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Acciones según estado de sesión */}
      <div className="px-8 pb-8 space-y-3">
        {error && (
          <div className="bg-[#C27F79]/10 border border-[#C27F79]/30 rounded-xl p-3 text-sm text-[#C27F79]">
            {error}
          </div>
        )}

        {status === 'loading' ? (
          <div className="flex items-center justify-center py-4">
            <span className="w-5 h-5 border-2 border-[#9C8578] border-t-[#D5C3B6] rounded-full animate-spin" />
          </div>
        ) : status === 'unauthenticated' ? (
          <>
            <p className="text-[#9C8578] text-sm text-center">
              Necesitas una cuenta NeiFe para aceptar esta invitación
            </p>
            <Link
              href={`/registro?invite=${token}&role=tenant`}
              className="flex items-center justify-center w-full bg-[#75524C] text-[#FAF6F2] py-3 rounded-xl font-medium hover:opacity-90 transition"
            >
              Crear cuenta y aceptar →
            </Link>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/invitacion/${token}`)}`}
              className="flex items-center justify-center w-full border border-[#D5C3B6]/20 text-[#D5C3B6] py-3 rounded-xl text-sm hover:bg-[#D5C3B6]/10 transition"
            >
              Ya tengo cuenta — Iniciar sesión
            </Link>
          </>
        ) : session?.user.role !== 'TENANT' ? (
          <>
            <p className="text-[#C27F79] text-sm text-center">
              Tu cuenta es de arrendador. Solo los arrendatarios pueden aceptar invitaciones.
            </p>
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full border border-[#5E8B8C]/30 text-[#5E8B8C] py-3 rounded-xl text-sm hover:bg-[#5E8B8C]/10 transition"
            >
              Ir a mi dashboard
            </Link>
          </>
        ) : (
          <>
            <p className="text-[#9C8578] text-sm text-center">
              Sesión activa como{' '}
              <strong className="text-[#D5C3B6]">{session.user.name}</strong>
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-[#75524C] text-[#FAF6F2] py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {accepting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#FAF6F2]/30 border-t-[#FAF6F2] rounded-full animate-spin" />
                  Aceptando...
                </span>
              ) : (
                'Aceptar invitación →'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
