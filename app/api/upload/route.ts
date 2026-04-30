import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { uploadFile } from '@/lib/cloudinary'

export const maxDuration = 60 // Allow longer execution for uploads

// POST multipart/form-data — upload general
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string

    if (!file || !folder) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Validar folder
    const allowedFolders = [
      'properties',
      'maintenance',
      'contracts',
      'avatars',
      'receipts',
      'boletas',
      'documents',
      'checklists',
    ]
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json(
        { error: 'Carpeta no permitida' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
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

    // Validar tamaño
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name}`
    const url = await uploadFile(Buffer.from(buffer), folder, filename, file.type)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Error al subir archivo' },
      { status: 500 }
    )
  }
}
