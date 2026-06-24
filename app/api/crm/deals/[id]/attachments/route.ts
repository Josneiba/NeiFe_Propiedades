import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/cloudinary'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await paramsPromise
  const brokerId = session.user.id

  // Verificar que el deal pertenece al broker
  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    select: { brokerId: true },
  })

  if (!deal || deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const attachments = await prisma.crmDealAttachment.findMany({
    where: { dealId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(attachments)
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await paramsPromise
  const brokerId = session.user.id

  // Verificar que el deal pertenece al broker
  const deal = await prisma.crmDeal.findUnique({
    where: { id },
    select: { brokerId: true, code: true },
  })

  if (!deal || deal.brokerId !== brokerId) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type
    const fileName = file.name

    // Subir a Cloudinary
    const fileUrl = await uploadFile(
      buffer,
      `deals/${deal.code}`,
      fileName,
      mimeType
    )

    // Guardar en base de datos
    const attachment = await prisma.crmDealAttachment.create({
      data: {
        dealId: id,
        fileName,
        fileUrl,
        fileSize: file.size,
        mimeType,
        uploadedBy: brokerId,
      },
    })

    return NextResponse.json(attachment)
  } catch (error: any) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir archivo' },
      { status: 500 }
    )
  }
}
