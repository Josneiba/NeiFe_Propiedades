import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MonthlyServiceManager } from "@/components/services/monthly-service-manager"
import { CheckCircle2, Droplets, Zap, Flame } from "lucide-react"
import { ServiceRecordCard } from "@/components/services/service-record-card"

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
  searchParams: Promise<{ property?: string; month?: string; year?: string; saved?: string; flash?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { property: filterPropertyId, month: monthFilter, year: yearFilter, saved, flash } = await searchParams

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
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Servicios básicos</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">
          Consumos y registros por propiedad (agua, luz, gas)
        </p>
        {filterProperty && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#D5C3B6]/10 bg-[#2D3C3C] px-4 py-3 text-sm">
            <span className="text-[#FAF6F2]">
              Filtrado por:{" "}
              <strong>{filterProperty.name || filterProperty.address}</strong>
            </span>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
              <Link href="/dashboard/servicios">Ver todas las propiedades</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
              <Link href={`/dashboard/propiedades/${filterProperty.id}`}>
                Ir al detalle
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-4">
          <form className="grid gap-4 md:grid-cols-4" action="/dashboard/servicios" method="GET">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#9C8578]" htmlFor="property">
                Propiedad
              </label>
              <select
                id="property"
                name="property"
                defaultValue={filterPropertyId ?? ""}
                className="w-full rounded-md border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]"
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
              <label className="text-xs font-medium uppercase tracking-wider text-[#9C8578]" htmlFor="month">
                Mes
              </label>
              <select
                id="month"
                name="month"
                defaultValue={monthFilter ?? ""}
                className="w-full rounded-md border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]"
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
                className="w-full rounded-md border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]"
                placeholder="Todos"
              />
            </div>
            <div className="md:col-span-4 flex gap-3 pt-1">
              <Button type="submit" className="bg-[#5E8B8C] text-[#FAF6F2] hover:bg-[#5E8B8C]/90">
                Aplicar filtros
              </Button>
              {(filterPropertyId || monthFilter || yearFilter) && (
                <Button variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
                  <Link href="/dashboard/servicios">Limpiar</Link>
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
        />
      )}

      <Card id="service-records" className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-5">
          {flash === "updated" && saved ? (
            <Alert className="mb-4 border-[#5E8B8C]/30 bg-[#5E8B8C]/10 text-[#D5C3B6]">
              <CheckCircle2 className="text-[#5E8B8C]" />
              <AlertTitle className="text-[#FAF6F2]">Registro actualizado</AlertTitle>
              <AlertDescription className="text-[#9C8578]">
                Resaltamos el período que acabas de guardar para que lo ubiques más rápido.
              </AlertDescription>
            </Alert>
          ) : null}
          <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Registros mensuales</p>
          {services.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#5E8B8C]/10 flex items-center justify-center mx-auto mb-4">
                <Droplets className="h-6 w-6 text-[#5E8B8C]/50" />
              </div>
              <h3 className="text-lg font-medium text-[#FAF6F2] mb-2">No hay registros de servicios</h3>
              <p className="text-sm text-[#9C8578] max-w-sm mx-auto">
                {!filterProperty
                  ? "Puedes registrar cargos y subir boletas directamente desde el formulario superior."
                  : "No hay registros para esta propiedad con los filtros aplicados."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((row) => (
                <ServiceRecordCard
                  key={row.id}
                  record={row}
                  monthLabel={`${monthNames[row.month - 1]} ${row.year}`}
                  propertyLabel={!filterProperty ? row.property.name || row.property.address : undefined}
                  propertyMeta={!filterProperty ? row.property.commune : undefined}
                  highlighted={saved === `${row.property.id}-${row.year}-${row.month}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
