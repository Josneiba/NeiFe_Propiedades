import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { canAccessMandate } from '@/lib/mandates'
import {
  buildMandateDocumentSnapshot,
  generateMandatePdf,
  type MandateDocumentSnapshot,
} from '@/lib/mandate-document'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const mandate = await prisma.mandate.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          commune: true,
          region: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      broker: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
    },
  })

  if (!mandate) {
    return NextResponse.json({ error: 'Mandato no encontrado' }, { status: 404 })
  }

  if (!canAccessMandate(mandate, session.user.id)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const snapshot =
    (mandate.documentSnapshot as MandateDocumentSnapshot | null) ||
    buildMandateDocumentSnapshot(mandate)
  const pdf = generateMandatePdf(snapshot)
  const filename = `${snapshot.documentNumber}.pdf`
  const download = req.nextUrl.searchParams.get('download') === '1'

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
