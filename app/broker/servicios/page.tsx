import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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

  const inputFilterClass =
    "w-full rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-sm text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Servicios básicos</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">
          Carga cuentas de agua, luz, gas y cargos comunes para que el arrendatario vea el detalle completo.
        </p>
        {filterProperty && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917]/40 px-4 py-3 text-sm">
            <span className="text-[#FAF6F2]">
              Filtrado por: <strong>{filterProperty.name || filterProperty.address}</strong>
            </span>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10" asChild>
              <Link href="/broker/servicios">Ver todas las propiedades</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10" asChild>
              <Link href={`/broker/propiedades/${filterProperty.id}`}>Ir al detalle</Link>
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-4">
          <form className="grid gap-4 md:grid-cols-4" action="/broker/servicios" method="GET">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#9C8578]" htmlFor="property">
                Propiedad
              </label>
              <select id="property" name="property" defaultValue={filterPropertyId ?? ""} className={inputFilterClass}>
                <option value="">Todas</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.address}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#9C8578]" htmlFor="month">
                Mes
              </label>
              <select id="month" name="month" defaultValue={monthFilter ?? ""} className={inputFilterClass}>
                <option value="">Todos</option>
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#9C8578]" htmlFor="year">
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
                className={inputFilterClass}
                placeholder="Todos"
              />
            </div>
            <div className="flex gap-3 pt-1 md:col-span-4">
              <Button type="submit" className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                Aplicar filtros
              </Button>
              {(filterPropertyId || monthFilter || yearFilter) && (
                <Button variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10" asChild>
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

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Registros mensuales</p>
          {services.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9C8578]">
              No hay registros de servicios aún para esta cartera.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D5C3B6]/10 text-left">
                    {!filterProperty && (
                      <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Propiedad</th>
                    )}
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Período</th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Arrendatario</th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Agua</th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Electricidad</th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Gas</th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-[#9C8578]">Cargos extra</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((row) => {
                    const label = row.property.name || row.property.address
                    const extraTotal =
                      row.garbage + row.commonExpenses + row.other
                    return (
                      <tr key={row.id} className="border-b border-[#D5C3B6]/10 hover:bg-[#D5C3B6]/5 transition-colors">
                        {!filterProperty && (
                          <td className="px-3 py-3">
                            <Link
                              href={`/broker/servicios?property=${row.property.id}`}
                              className="font-medium text-[#5E8B8C] hover:underline"
                            >
                              {label}
                            </Link>
                            <p className="text-xs text-[#9C8578]">{row.property.commune}</p>
                          </td>
                        )}
                        <td className="px-3 py-3 text-[#9C8578]">
                          {monthNames[row.month - 1]} {row.year}
                        </td>
                        <td className="px-3 py-3 text-[#FAF6F2]">
                          {row.property.tenant?.name || "Sin arrendatario"}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 text-[#FAF6F2]">
                            <Droplets className="h-3.5 w-3.5 text-sky-500" />
                            {row.water}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 text-[#FAF6F2]">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            {row.electricity}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 text-[#FAF6F2]">
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                            {row.gas}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 text-[#FAF6F2]">
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
