import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplets, Zap, Flame } from "lucide-react"

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export default async function DashboardServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { property: filterPropertyId } = await searchParams

  const filterProperty =
    filterPropertyId != null && filterPropertyId !== ""
      ? await prisma.property.findFirst({
          where: {
            id: filterPropertyId,
            landlordId: session.user.id,
          },
          select: { id: true, name: true, address: true, commune: true },
        })
      : null

  if (filterPropertyId && !filterProperty) {
    redirect("/dashboard/servicios")
  }

  const services = await prisma.monthlyService.findMany({
    where: {
      property: {
        landlordId: session.user.id,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
    },
    include: {
      property: {
        select: { id: true, name: true, address: true, commune: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 120,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Servicios básicos</h1>
        <p className="text-muted-foreground">
          Consumos y registros por propiedad (agua, luz, gas)
        </p>
        {filterProperty && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-foreground">
              Filtrado por:{" "}
              <strong>{filterProperty.name || filterProperty.address}</strong>
            </span>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <Link href="/dashboard/servicios">Ver todas las propiedades</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <Link href={`/dashboard/propiedades/${filterProperty.id}`}>
                Ir al detalle
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Registros mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No hay registros de servicios aún.
              {!filterProperty && (
                <>
                  {" "}
                  Puedes filtrar desde el detalle de cada propiedad o cargar datos vía API.
                </>
              )}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {!filterProperty && (
                      <th className="py-3 px-2 font-semibold text-foreground">
                        Propiedad
                      </th>
                    )}
                    <th className="py-3 px-2 font-semibold text-foreground">
                      Período
                    </th>
                    <th className="py-3 px-2 font-semibold text-foreground">
                      Agua
                    </th>
                    <th className="py-3 px-2 font-semibold text-foreground">
                      Electricidad
                    </th>
                    <th className="py-3 px-2 font-semibold text-foreground">
                      Gas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((row) => {
                    const label =
                      row.property.name || row.property.address
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-border/50 hover:bg-muted/30"
                      >
                        {!filterProperty && (
                          <td className="py-3 px-2">
                            <Link
                              href={`/dashboard/servicios?property=${row.property.id}`}
                              className="text-[#5E8B8C] hover:underline font-medium"
                            >
                              {label}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {row.property.commune}
                            </p>
                          </td>
                        )}
                        <td className="py-3 px-2 text-muted-foreground">
                          {monthNames[row.month - 1]} {row.year}
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <Droplets className="h-3.5 w-3.5 text-sky-500" />
                            {row.water}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            {row.electricity}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                            {row.gas}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
