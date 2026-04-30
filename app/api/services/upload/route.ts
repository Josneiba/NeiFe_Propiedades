import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/cloudinary'

export const maxDuration = 60 // Allow longer execution for uploads

// POST multipart/form-data — upload de boletas
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const propertyId = formData.get('propertyId') as string
    const month = formData.get('month') as string
    const year = formData.get('year') as string
    const type = formData.get('type') as
      | 'water'
      | 'electricity'
      | 'gas'
      | 'garbage'
      | 'commonExpenses'

    if (!file || !propertyId || !month || !year || !type) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    if (
      session.user.role !== 'LANDLORD' &&
      session.user.role !== 'OWNER' &&
      session.user.role !== 'BROKER'
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Validar acceso a la propiedad
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        isActive: true,
        OR:
          session.user.role === 'BROKER'
            ? [
                { managedBy: session.user.id },
                {
                  mandates: {
                    some: {
                      brokerId: session.user.id,
                      status: 'ACTIVE',
                    },
                  },
                },
              ]
            : [{ landlordId: session.user.id }],
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido' },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const filename = `${propertyId}-${month}-${year}-${type}`
    const url = await uploadFile(
      Buffer.from(buffer),
      'boletas',
      filename,
      file.type
    )

    // Actualizar el registro de servicios
    const fieldMap: Record<string, string> = {
      water: 'waterBillUrl',
      electricity: 'lightBillUrl',
      gas: 'gasBillUrl',
      garbage: 'garbageBillUrl',
      commonExpenses: 'commonBillUrl',
    }

    const updateData: any = {}
    updateData[fieldMap[type]] = url

    const service = await prisma.monthlyService.update({
      where: {
        propertyId_month_year: {
          propertyId,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      data: updateData,
    })

    return NextResponse.json({ url, service })
  } catch (error) {
    console.error('Error uploading bill:', error)
    return NextResponse.json(
      { error: 'Error al subir boleta' },
      { status: 500 }
    )
  }
}
