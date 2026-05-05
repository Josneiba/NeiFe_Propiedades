import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MonthlyServiceManager } from "@/components/services/monthly-service-manager"
import { Droplets, Zap, Flame, BadgeDollarSign } from "lucide-react"

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

export default async function BrokerServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; month?: string; year?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { property: filterPropertyId, month: monthFilter, year: yearFilter } = await searchParams

  const propertyWhere = {
    isActive: true,
    OR: [
      { managedBy: session.user.id },
      {
        mandates: {
          some: {
            brokerId: session.user.id,
            status: "ACTIVE" as const,
          },
        },
      },
    ],
  }

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    select: { id: true, name: true, address: true, commune: true },
    orderBy: { createdAt: "desc" },
  })

  const filterProperty =
    filterPropertyId != null && filterPropertyId !== ""
      ? await prisma.property.findFirst({
          where: {
            id: filterPropertyId,
            ...propertyWhere,
          },
          select: { id: true, name: true, address: true, commune: true },
        })
      : null

  if (filterPropertyId && !filterProperty) {
    redirect("/broker/servicios")
  }

  const services = await prisma.monthlyService.findMany({
    where: {
      property: {
        ...propertyWhere,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
      ...(monthFilter ? { month: Number(monthFilter) } : {}),
      ...(yearFilter ? { year: Number(yearFilter) } : {}),
    },
    include: {
      property: {
        select: { id: true, name: true, address: true, commune: true, tenant: { select: { name: true } } },
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
          Carga cuentas de agua, luz, gas y cargos comunes para que el arrendatario vea el detalle completo.
        </p>
        {filterProperty && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-foreground">
              Filtrado por: <strong>{filterProperty.name || filterProperty.address}</strong>
            </span>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <Link href="/broker/servicios">Ver todas las propiedades</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <Link href={`/broker/propiedades/${filterProperty.id}`}>Ir al detalle</Link>
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <form className="grid gap-4 md:grid-cols-4" action="/broker/servicios" method="GET">
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
            <div className="flex gap-3 pt-1 md:col-span-4">
              <Button type="submit" className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90">
                Aplicar filtros
              </Button>
              {(filterPropertyId || monthFilter || yearFilter) && (
                <Button variant="outline" className="border-border" asChild>
                  <Link href="/broker/servicios">Limpiar</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {properties.length > 0 && (
        <MonthlyServiceManager
          properties={properties}
          defaultPropertyId={filterProperty?.id ?? filterPropertyId ?? null}
          title="Registrar servicios del mes"
          description="Como corredor administrador puedes informar cargos y boletas para que el arrendatario sepa exactamente qué debe pagar."
        />
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Registros mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay registros de servicios aún para esta cartera.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {!filterProperty && (
                      <th className="px-2 py-3 font-semibold text-foreground">Propiedad</th>
                    )}
                    <th className="px-2 py-3 font-semibold text-foreground">Período</th>
                    <th className="px-2 py-3 font-semibold text-foreground">Arrendatario</th>
                    <th className="px-2 py-3 font-semibold text-foreground">Agua</th>
                    <th className="px-2 py-3 font-semibold text-foreground">Electricidad</th>
                    <th className="px-2 py-3 font-semibold text-foreground">Gas</th>
                    <th className="px-2 py-3 font-semibold text-foreground">Cargos extra</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((row) => {
                    const label = row.property.name || row.property.address
                    const extraTotal =
                      row.garbage + row.commonExpenses + row.other
                    return (
                      <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                        {!filterProperty && (
                          <td className="px-2 py-3">
                            <Link
                              href={`/broker/servicios?property=${row.property.id}`}
                              className="font-medium text-[#5E8B8C] hover:underline"
                            >
                              {label}
                            </Link>
                            <p className="text-xs text-muted-foreground">{row.property.commune}</p>
                          </td>
                        )}
                        <td className="px-2 py-3 text-muted-foreground">
                          {monthNames[row.month - 1]} {row.year}
                        </td>
                        <td className="px-2 py-3 text-foreground">
                          {row.property.tenant?.name || "Sin arrendatario"}
                        </td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <Droplets className="h-3.5 w-3.5 text-sky-500" />
                            {row.water}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            {row.electricity}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                            {row.gas}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <BadgeDollarSign className="h-3.5 w-3.5 text-[#B8965A]" />
                            {extraTotal}
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
