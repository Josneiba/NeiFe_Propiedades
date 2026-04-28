import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { canAccessMandate } from '@/lib/mandates'
import {
  buildMandateDocumentHash,
  buildMandateDocumentSnapshot,
  type MandateDocumentSnapshot,
} from '@/lib/mandate-document'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, FileText, ShieldCheck } from 'lucide-react'

function formatDate(value?: string | null) {
  if (!value) return 'No definida'
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function commissionLabel(snapshot: MandateDocumentSnapshot) {
  if (snapshot.terms.commissionRate == null) return 'No definida'
  const type =
    snapshot.terms.commissionType === 'ONE_TIME'
      ? 'Única vez'
      : snapshot.terms.commissionType === 'ANNUAL'
        ? 'Anual'
        : 'Mensual'
  return `${snapshot.terms.commissionRate}% · ${type}`
}

export default async function MandateDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

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

  if (!mandate || !canAccessMandate(mandate, session.user.id)) {
    redirect('/dashboard')
  }

  const snapshot =
    (mandate.documentSnapshot as MandateDocumentSnapshot | null) ||
    buildMandateDocumentSnapshot(mandate)
  const hash = mandate.documentHash || buildMandateDocumentHash(snapshot)

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#5E8B8C] text-white">Mandato digital</Badge>
            <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">
              {snapshot.documentNumber}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-foreground">
            Mandato de administración
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Documento trazable generado dentro de NeiFe con firmas registradas y hash de integridad.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
            <a href={`/api/mandates/${mandate.id}/document?download=1`}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </a>
          </Button>
          {mandate.status === 'ACTIVE' ? (
            <Button asChild variant="outline" className="border-border text-foreground">
              <Link href={`/mandatos/${mandate.id}/seguimiento`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver seguimiento compartido
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-[#75524C]" />
            Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="font-medium text-foreground">{snapshot.legal.title}</p>
            <p className="mt-2 leading-6 text-muted-foreground">{snapshot.legal.statement}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Propiedad</p>
              <p className="mt-2 font-semibold text-foreground">
                {snapshot.property.name || snapshot.property.address}
              </p>
              <p className="mt-1 text-muted-foreground">
                {snapshot.property.address}, {snapshot.property.commune}
                {snapshot.property.region ? `, ${snapshot.property.region}` : ''}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Términos</p>
              <p className="mt-2 text-foreground">Inicio: {formatDate(snapshot.terms.startsAt)}</p>
              <p className="mt-1 text-foreground">Término: {formatDate(snapshot.terms.expiresAt)}</p>
              <p className="mt-1 text-foreground">Comisión: {commissionLabel(snapshot)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Propietario</p>
              <p className="mt-2 font-semibold text-foreground">{snapshot.owner.name}</p>
              <p className="mt-1 text-muted-foreground">{snapshot.owner.email}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Corredor</p>
              <p className="mt-2 font-semibold text-foreground">{snapshot.broker.name}</p>
              <p className="mt-1 text-muted-foreground">{snapshot.broker.email}</p>
              {snapshot.broker.company ? (
                <p className="mt-1 text-muted-foreground">{snapshot.broker.company}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-[#5E8B8C]/20 bg-[#5E8B8C]/10 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#5E8B8C]" />
              <p className="font-medium text-foreground">Firmas registradas</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-foreground">Propietario</p>
                <p className="mt-1 text-muted-foreground">
                  {snapshot.signatures.owner.signed
                    ? `Firmado por ${snapshot.signatures.owner.name}`
                    : 'Pendiente de firma'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {snapshot.signatures.owner.signedAt
                    ? formatDate(snapshot.signatures.owner.signedAt)
                    : 'Sin fecha'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Corredor</p>
                <p className="mt-1 text-muted-foreground">
                  {snapshot.signatures.broker.signed
                    ? `Firmado por ${snapshot.signatures.broker.name}`
                    : 'Pendiente de firma'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {snapshot.signatures.broker.signedAt
                    ? formatDate(snapshot.signatures.broker.signedAt)
                    : 'Sin fecha'}
                </p>
              </div>
            </div>
          </div>

          {snapshot.terms.notes ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notas</p>
              <p className="mt-2 whitespace-pre-wrap text-foreground">{snapshot.terms.notes}</p>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            <p>Hash del documento: {hash}</p>
            <p className="mt-2">
              Generado en NeiFe el {formatDate(mandate.documentGeneratedAt?.toISOString() || snapshot.generatedAt)}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
