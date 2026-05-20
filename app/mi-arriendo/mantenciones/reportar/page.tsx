import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Wrench } from "lucide-react"
import { ReportMaintenanceForm } from "./report-maintenance-form"

export default async function ReportarMantencionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "TENANT") redirect("/mi-arriendo")

  const property = await prisma.property.findFirst({
    where: { tenantId: session.user.id },
    select: {
      id: true,
      address: true,
      commune: true,
      managedByUser: {
        select: {
          name: true,
        },
      },
      landlord: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!property) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Reportar mantención</h1>
          <p className="mt-1 text-sm text-[#9C8578]">
            Envía una solicitud para que puedan revisar la falla en tu propiedad.
          </p>
        </div>

        <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
          <CardContent className="p-10 text-center">
            <Wrench className="mx-auto mb-3 h-10 w-10 text-[#9C8578]/40" />
            <p className="text-[#9C8578]">No tienes una propiedad asignada todavía.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ReportMaintenanceForm property={property} />
}
