import Link from "next/link"
import { notFound } from "next/navigation"
import { Bath, BedDouble, Building2, ArrowLeft, MapPin, Ruler } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getPublishedPropertyById } from "@/lib/public-listings"

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
})

export default async function PublicListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await getPublishedPropertyById(id)

  if (!property) {
    notFound()
  }

  const cover = property.photos[0]

  return (
    <div className="min-h-screen bg-[#1C1917] text-[#FAF6F2]">
      <header className="border-b border-[#D5C3B6]/10 bg-[#1C1917]/95 backdrop-blur supports-backdrop-filter:bg-[#1C1917]/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-serif font-semibold tracking-tight text-[#D5C3B6] shrink-0">
            NeiFe<span className="text-[#B8965A]">.</span>
          </Link>
          <Link
            href="/#arriendos"
            className="text-sm text-[#9C8578] hover:text-[#D5C3B6] transition-colors duration-300 shrink-0"
          >
            Ver arriendos
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <Link
          href="/#arriendos"
          className="inline-flex items-center gap-2 text-sm text-[#9C8578] hover:text-[#D5C3B6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a arriendos publicados
        </Link>

        <div className="mt-6 md:mt-8 grid gap-6 md:gap-8 xl:grid-cols-[minmax(0,1.7fr)_420px]">
          <div className="space-y-5 md:space-y-6">
            <div className="overflow-hidden rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] shadow-sm">
              <div className="aspect-[16/10] bg-[#1C1917]">
                {cover?.url ? (
                  <img
                    src={cover.url}
                    alt={cover.caption || property.name || property.address}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#9C8578]">
                    <Building2 className="h-16 w-16" />
                  </div>
                )}
              </div>
            </div>

            {property.photos.length > 1 ? (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {property.photos.slice(1, 7).map((photo) => (
                  <div
                    key={photo.id}
                    className="group overflow-hidden rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C] shadow-sm transition-colors hover:border-[#B8965A]/25"
                  >
                    <div className="relative aspect-[4/3] bg-[#1C1917]">
                      <img
                        src={photo.url}
                        alt={photo.caption || photo.room}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[#1C1917]/0 transition-colors duration-300 group-hover:bg-[#1C1917]/25" />
                    </div>
                    <div className="px-3 py-2.5 text-sm text-[#9C8578]">
                      {photo.caption || photo.room}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-5 md:space-y-6">
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#B8965A]">
                      Publicado en NeiFe
                    </p>
                    <h1 className="mt-2 text-2xl md:text-3xl font-serif font-semibold text-[#FAF6F2] leading-tight">
                      {property.name || property.address}
                    </h1>
                    <div className="mt-2 flex items-start gap-2 text-sm text-[#9C8578]">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        {property.address}, {property.commune}, {property.region}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#5E8B8C]/15 px-2.5 py-1 text-xs font-medium text-[#5E8B8C] shrink-0">
                    Disponible
                  </span>
                </div>

                <p className="mt-5 text-3xl font-semibold tabular-nums text-[#5E8B8C]">
                  {property.monthlyRentCLP
                    ? currencyFormatter.format(property.monthlyRentCLP)
                    : property.monthlyRentUF
                      ? `UF ${property.monthlyRentUF.toFixed(2)}`
                      : "Precio a convenir"}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2 md:gap-3">
                  <Metric icon={BedDouble} label="Dormitorios" value={property.bedrooms ?? "-"} />
                  <Metric icon={Bath} label="Baños" value={property.bathrooms ?? "-"} />
                  <Metric
                    icon={Ruler}
                    label="Superficie"
                    value={property.squareMeters ? `${property.squareMeters} m²` : "-"}
                  />
                </div>

                <div className="mt-5 rounded-xl bg-[#1C1917] p-4 border border-[#D5C3B6]/5">
                  <p className="text-sm leading-relaxed text-[#D5C3B6]">
                    {property.description || "Propiedad disponible para arriendo y administrada desde NeiFe."}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {property.applicationOpen && property.applicationSlug ? (
                    <Button asChild className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] h-11 rounded-lg">
                      <Link href={`/postular/${property.applicationSlug}`}>Postular a esta propiedad</Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] h-11 rounded-lg">
                      <Link href="/registro">Crear cuenta para postular</Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 h-11 rounded-lg"
                  >
                    <Link href="/login">Ya tengo cuenta en NeiFe</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl bg-[#1C1917] px-3 py-3 md:px-4 md:py-4 border border-[#D5C3B6]/5">
      <div className="flex items-center gap-2 text-[#FAF6F2]">
        <Icon className="h-5 w-5 shrink-0 text-[#5E8B8C]" />
        <span className="font-medium text-sm md:text-base">{value}</span>
      </div>
      <p className="mt-1.5 text-[11px] md:text-xs text-[#9C8578]">{label}</p>
    </div>
  )
}
