import Link from "next/link"
import { notFound } from "next/navigation"
import { Bath, BedDouble, Building2, ChevronLeft, MapPin, Ruler } from "lucide-react"
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
      <div className="container mx-auto px-4 py-10">
        <Link
          href="/#arriendos"
          className="inline-flex items-center gap-2 text-sm text-[#9C8578] hover:text-[#D5C3B6]"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a arriendos publicados
        </Link>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_420px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C]">
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {property.photos.slice(1, 7).map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-xl border border-[#D5C3B6]/10 bg-[#2D3C3C]"
                  >
                    <div className="aspect-[4/3] bg-[#1C1917]">
                      <img
                        src={photo.url}
                        alt={photo.caption || photo.room}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="px-3 py-3 text-sm text-[#9C8578]">
                      {photo.caption || photo.room}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#B8965A]">
                      Publicado en NeiFe
                    </p>
                    <h1 className="mt-3 text-3xl font-serif font-semibold text-[#FAF6F2]">
                      {property.name || property.address}
                    </h1>
                    <div className="mt-3 flex items-center gap-2 text-[#9C8578]">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {property.address}, {property.commune}, {property.region}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#5E8B8C]/15 px-2.5 py-1 text-xs font-medium text-[#5E8B8C]">
                    Disponible
                  </span>
                </div>

                <p className="mt-6 text-3xl font-semibold text-[#FAF6F2]">
                  {property.monthlyRentCLP
                    ? currencyFormatter.format(property.monthlyRentCLP)
                    : property.monthlyRentUF
                      ? `UF ${property.monthlyRentUF.toFixed(2)}`
                      : "Precio a convenir"}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Metric icon={BedDouble} label="Dormitorios" value={property.bedrooms ?? "-"} />
                  <Metric icon={Bath} label="Baños" value={property.bathrooms ?? "-"} />
                  <Metric
                    icon={Ruler}
                    label="Superficie"
                    value={property.squareMeters ? `${property.squareMeters} m²` : "-"}
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-[#1C1917] p-4">
                  <p className="text-sm leading-7 text-[#D5C3B6]">
                    {property.description || "Propiedad disponible para arriendo y administrada desde NeiFe."}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {property.applicationOpen && property.applicationSlug ? (
                    <Button asChild className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                      <Link href={`/postular/${property.applicationSlug}`}>Postular a esta propiedad</Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                      <Link href="/registro">Crear cuenta para postular</Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10"
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
    <div className="rounded-xl bg-[#1C1917] px-4 py-4">
      <div className="flex items-center gap-2 text-[#FAF6F2]">
        <Icon className="h-4 w-4 text-[#5E8B8C]" />
        <span className="font-medium">{value}</span>
      </div>
      <p className="mt-2 text-xs text-[#9C8578]">{label}</p>
    </div>
  )
}
