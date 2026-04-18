import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import InvitationClient from './invitation-client'

export const metadata: Metadata = {
  title: 'Invitación de arriendo — NeiFe',
}

async function getInvitation(token: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        property: true,
        sender: { select: { name: true, email: true } },
      },
    })

    if (!invitation) {
      return { ok: false as const, error: 'Invitación no encontrada' }
    }

    if (invitation.status !== 'PENDING') {
      return { ok: false as const, error: 'Invitación ya fue procesada' }
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      })
      return { ok: false as const, error: 'Invitación expirada' }
    }

    const result: any = {
      type: invitation.type,
      sender: invitation.sender,
      expiresAt: invitation.expiresAt.toISOString(),
    }

    if (invitation.property) {
      const p = invitation.property
      result.property = {
        name: p.name || p.address,
        address: p.address,
        commune: p.commune,
        region: p.region,
        monthlyRentUF: p.monthlyRentUF,
        monthlyRentCLP: p.monthlyRentCLP,
      }
    }

    return {
      ok: true as const,
      invitation: result,
    }
  } catch {
    return { ok: false as const, error: 'Error al cargar la invitación' }
  }
}

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await getInvitation(token)

  return (
    <div className="min-h-screen bg-[#1C1917] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-semibold text-[#D5C3B6]">NeiFe</h1>
          <p className="text-[#9C8578] text-sm mt-1">Gestión de Arriendos Chile</p>
        </div>

        {!result.ok ? (
          <div className="bg-[#2D3C3C] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-[#C27F79]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-xl font-serif text-[#FAF6F2] mb-2">Invitación no válida</h2>
            <p className="text-[#9C8578] text-sm mb-6">{result.error}</p>
            <a href="/login" className="text-[#5E8B8C] text-sm hover:underline">
              Ir al inicio de sesión →
            </a>
          </div>
        ) : (
          <InvitationClient invitation={result.invitation} token={token} />
        )}
      </div>
    </div>
  )
}
