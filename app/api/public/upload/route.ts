import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/cloudinary'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name}`
    const url = await uploadFile(Buffer.from(buffer), 'applications', filename)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error uploading public document:', error)
    return NextResponse.json(
      { error: 'Error al subir archivo' },
      { status: 500 }
    )
  }
}
