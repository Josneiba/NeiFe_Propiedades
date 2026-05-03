import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TenantApplicationForm } from '@/components/public/tenant-application-form'
import { isPrismaConnectionError, logPrismaConnectionWarning } from '@/lib/prisma-errors'

export default async function PostularPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let property

  try {
    property = await prisma.property.findFirst({
      where: {
        applicationSlug: slug,
        applicationOpen: true,
        isActive: true,
        tenantId: null,
      },
      select: {
        id: true,
        address: true,
        commune: true,
        region: true,
        bedrooms: true,
        bathrooms: true,
        squareMeters: true,
        monthlyRentCLP: true,
        description: true,
        photos: {
          where: { type: 'CURRENT' },
          take: 4,
          select: { url: true, room: true },
        },
      },
    })
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      logPrismaConnectionWarning('public-application', error)
      notFound()
    }

    throw error
  }

  if (!property) notFound()

  return (
    <div className="min-h-screen bg-[#1C1917]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-[#D5C3B6]/15 bg-[#2D3C3C] px-5 py-2.5">
            <span className="font-semibold text-[#D5C3B6]">NeiFe</span>
          </div>
          <h1 className="mb-2 text-2xl font-serif font-semibold text-[#FAF6F2]">
            Postula a este arriendo
          </h1>
          <p className="text-[#9C8578]">
            {property.address}, {property.commune}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-[#D5C3B6]/12 bg-[#2D3C3C] p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#FAF6F2]">{property.bedrooms ?? '-'}</p>
              <p className="text-xs text-[#9C8578]">Dormitorios</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#FAF6F2]">{property.bathrooms ?? '-'}</p>
              <p className="text-xs text-[#9C8578]">Baños</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#B8965A]">
                {property.monthlyRentCLP
                  ? `$${property.monthlyRentCLP.toLocaleString('es-CL')}`
                  : 'A convenir'}
              </p>
              <p className="text-xs text-[#9C8578]">Renta mensual</p>
            </div>
          </div>
          {property.description ? (
            <p className="mt-4 text-sm leading-6 text-[#D5C3B6]">{property.description}</p>
          ) : null}
        </div>

        <TenantApplicationForm propertyId={property.id} />
      </div>
    </div>
  )
}
