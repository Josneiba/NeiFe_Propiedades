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
  searchParams: Promise<{ property?: string; month?: string; year?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { property: filterPropertyId, month: monthFilter, year: yearFilter } = await searchParams

  const properties = await prisma.property.findMany({
    where: { landlordId: session.user.id, isActive: true },
    select: { id: true, name: true, address: true, commune: true },
    orderBy: { createdAt: "desc" },
  })

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
      ...(monthFilter ? { month: Number(monthFilter) } : {}),
      ...(yearFilter ? { year: Number(yearFilter) } : {}),
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

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <form className="grid gap-4 md:grid-cols-4" action="/dashboard/servicios" method="GET">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-muted-foreground" htmlFor="property">
                Propiedad
              </label>
              <select
                id="property"
                name="property"
                defaultValue={filterPropertyId ?? ""}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="">Todas</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.address}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="month">
                Mes
              </label>
              <select
                id="month"
                name="month"
                defaultValue={monthFilter ?? ""}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="">Todos</option>
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="year">
                Año
              </label>
              <input
                id="year"
                name="year"
                type="number"
                inputMode="numeric"
                min="2000"
                max="2100"
                defaultValue={yearFilter ?? ""}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                placeholder="Todos"
              />
            </div>
            <div className="md:col-span-4 flex gap-3 pt-1">
              <Button type="submit" className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90">
                Aplicar filtros
              </Button>
              {(filterPropertyId || monthFilter || yearFilter) && (
                <Button variant="outline" className="border-border" asChild>
                  <Link href="/dashboard/servicios">Limpiar</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

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
