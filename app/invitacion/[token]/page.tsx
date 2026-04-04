import { Metadata } from 'next'
import InvitationClient from './invitation-client'

export const metadata: Metadata = {
  title: 'Invitación de arriendo — NeiFe',
}

async function getInvitation(token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/invitations/${token}`,
      { cache: 'no-store' }
    )
    const data = await res.json()
    return { data, ok: res.ok, status: res.status }
  } catch {
    return { data: { error: 'Error de conexión' }, ok: false, status: 500 }
  }
}

export default async function InvitacionPage({
  params,
}: {
  params: { token: string }
}) {
  const { data, ok } = await getInvitation(params.token)

  return (
    <div className="min-h-screen bg-[#1C1917] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo NeiFe */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-semibold text-[#D5C3B6]">NeiFe</h1>
          <p className="text-[#9C8578] text-sm mt-1">Gestión de Arriendos Chile</p>
        </div>

        {!ok ? (
          // Invitación inválida
          <div className="bg-[#2D3C3C] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-[#C27F79]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-xl font-serif text-[#FAF6F2] mb-2">
              Invitación no válida
            </h2>
            <p className="text-[#9C8578] text-sm mb-6">{data.error}</p>
            
            <a
              href="/login"
              className="text-[#5E8B8C] text-sm hover:underline"
            >
              Ir al inicio de sesión →
            </a>
          </div>
        ) : (
          <InvitationClient
            invitation={data.invitation}
            token={params.token}
          />
        )}
      </div>
    </div>
  )
}
