import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MonthlyServiceManager } from "@/components/services/monthly-service-manager"
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

export default async function BrokerServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; month?: string; year?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/dashboard")
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
        select: { id: true, name: true, address: true, commune: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 120,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#FAF6F2]">Servicios básicos</h1>
        <p className="text-[#9C8578]">
          Registra y comparte cargos de agua, luz, gas, gastos comunes y boletas.
        </p>
        {filterProperty && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917] px-4 py-3 text-sm">
            <span className="text-[#FAF6F2]">
              Filtrado por: <strong>{filterProperty.name || filterProperty.address}</strong>
            </span>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#FAF6F2]" asChild>
              <Link href="/broker/servicios">Ver todas las propiedades</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#FAF6F2]" asChild>
              <Link href={`/broker/propiedades/${filterProperty.id}`}>
                Ir al detalle
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-4">
          <form className="grid gap-4 md:grid-cols-4" action="/broker/servicios" method="GET">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[#9C8578]" htmlFor="property">
                Propiedad
              </label>
              <select
                id="property"
                name="property"
                defaultValue={filterPropertyId ?? ""}
                className="w-full rounded-md border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
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
              <label className="text-sm text-[#9C8578]" htmlFor="month">
                Mes
              </label>
              <select
                id="month"
                name="month"
                defaultValue={monthFilter ?? ""}
                className="w-full rounded-md border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
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
              <label className="text-sm text-[#9C8578]" htmlFor="year">
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
                className="w-full rounded-md border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-[#FAF6F2]"
                placeholder="Todos"
              />
            </div>
            <div className="md:col-span-4 flex gap-3 pt-1">
              <Button type="submit" className="bg-[#5E8B8C] text-white hover:bg-[#5E8B8C]/90">
                Aplicar filtros
              </Button>
              {(filterPropertyId || monthFilter || yearFilter) && (
                <Button variant="outline" className="border-[#D5C3B6]/20 text-[#FAF6F2]" asChild>
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
          title="Registrar servicios para arrendatarios"
          description="Úsalo para cargar cargos y boletas cuando la propiedad esté bajo tu administración."
        />
      )}

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2]">Registros mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#9C8578]">
              No hay registros de servicios aún para tus propiedades administradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D5C3B6]/10 text-left">
                    {!filterProperty && (
                      <th className="py-3 px-2 font-semibold text-[#FAF6F2]">
                        Propiedad
                      </th>
                    )}
                    <th className="py-3 px-2 font-semibold text-[#FAF6F2]">Período</th>
                    <th className="py-3 px-2 font-semibold text-[#FAF6F2]">Agua</th>
                    <th className="py-3 px-2 font-semibold text-[#FAF6F2]">Electricidad</th>
                    <th className="py-3 px-2 font-semibold text-[#FAF6F2]">Gas</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#D5C3B6]/10 hover:bg-[#1C1917]/60"
                    >
                      {!filterProperty && (
                        <td className="py-3 px-2">
                          <Link
                            href={`/broker/servicios?property=${row.property.id}`}
                            className="font-medium text-[#5E8B8C] hover:underline"
                          >
                            {row.property.name || row.property.address}
                          </Link>
                          <p className="text-xs text-[#9C8578]">{row.property.commune}</p>
                        </td>
                      )}
                      <td className="py-3 px-2 text-[#9C8578]">
                        {monthNames[row.month - 1]} {row.year}
                      </td>
                      <td className="py-3 px-2 text-[#FAF6F2]">
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="h-3.5 w-3.5 text-sky-500" />
                          {row.water}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-[#FAF6F2]">
                        <span className="inline-flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          {row.electricity}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-[#FAF6F2]">
                        <span className="inline-flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          {row.gas}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
