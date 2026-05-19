import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, RadioTower, UserRoundSearch } from "lucide-react"

const statusLabels = {
  PENDING: "Pendiente",
  REVIEWING: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
} as const

const statusClasses = {
  PENDING: "bg-[#F2C94C]/15 text-[#F2C94C]",
  REVIEWING: "bg-[#5E8B8C]/15 text-[#5E8B8C]",
  APPROVED: "bg-[#5E8B8C]/20 text-[#FAF6F2]",
  REJECTED: "bg-[#C27F79]/15 text-[#C27F79]",
} as const

export default async function DashboardPostulacionesPage() {
  const session = await auth()

  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/dashboard")
  }

  const applications = await prisma.tenantApplication.findMany({
    where: {
      property: {
        landlordId: session.user.id,
        isActive: true,
      },
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          commune: true,
          applicationOpen: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Postulaciones</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">
          Revisa los interesados de todas tus propiedades activas.
        </p>
      </div>

      {applications.length === 0 ? (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#5E8B8C]/10">
              <UserRoundSearch className="h-6 w-6 text-[#5E8B8C]/60" />
            </div>
            <div>
              <p className="text-[#FAF6F2] font-medium">Todavía no recibes postulaciones</p>
              <p className="text-sm text-[#9C8578]">
                Activa el portal público desde el detalle de una propiedad para empezar a recibir interesados.
              </p>
            </div>
            <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white" asChild>
              <Link href="/dashboard/propiedades">Ir a propiedades</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-[#FAF6F2] text-lg">{application.name}</CardTitle>
                    <p className="text-sm text-[#9C8578]">
                      {application.property.name || application.property.address}
                      {application.property.commune ? `, ${application.property.commune}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusClasses[application.status]}>
                      {statusLabels[application.status]}
                    </Badge>
                    <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]">
                      ${application.monthlyIncome.toLocaleString("es-CL")} líquidos
                    </Badge>
                    <Badge variant="outline" className={application.property.applicationOpen ? "border-[#5E8B8C]/20 text-[#5E8B8C]" : "border-[#C27F79]/20 text-[#C27F79]"}>
                      <RadioTower className="mr-1 h-3 w-3" />
                      {application.property.applicationOpen ? "Portal abierto" : "Portal cerrado"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#9C8578]">Contacto</p>
                    <p className="text-sm text-[#FAF6F2]">{application.email}</p>
                    <p className="text-sm text-[#D5C3B6]">{application.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#9C8578]">Documento</p>
                    <p className="text-sm text-[#FAF6F2]">{application.rut}</p>
                    {application.currentEmployer ? (
                      <p className="text-sm text-[#D5C3B6]">{application.currentEmployer}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#9C8578]">Recibida</p>
                    <p className="text-sm text-[#FAF6F2]">
                      {new Date(application.createdAt).toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {application.message ? (
                  <div className="rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917]/40 p-3 text-sm text-[#D5C3B6]">
                    {application.message}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
                    <Link href={`/dashboard/propiedades/${application.property.id}?tab=postulaciones`}>
                      Ver en propiedad
                    </Link>
                  </Button>
                  <Button variant="outline" className="border-[#5E8B8C]/20 text-[#5E8B8C]" asChild>
                    <a href={`mailto:${application.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contactar
                    </a>
                  </Button>
                  {application.documents.length > 0 &&
                    application.documents.map((document, index) => (
                      <Button
                        key={document}
                        variant="outline"
                        className="border-[#D5C3B6]/20 text-[#D5C3B6]"
                        asChild
                      >
                        <a href={document} target="_blank" rel="noopener noreferrer">
                          Documento {index + 1}
                        </a>
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
