import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { path } = await params
  // Reconstruir la URL de Cloudinary desde los path segments
  const cloudinaryUrl = decodeURIComponent(path.join('/'))

  // Validar que la URL sea de Cloudinary
  if (!cloudinaryUrl.includes('res.cloudinary.com')) {
    return NextResponse.json({ error: 'URL no válida' }, { status: 400 })
  }

  try {
    // Fetch directo del archivo desde Cloudinary (ya es público)
    const response = await fetch(cloudinaryUrl)

    if (!response.ok) {
      console.error('Failed to fetch from Cloudinary:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Archivo no encontrado', status: response.status },
        { status: response.status }
      )
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/pdf'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (error) {
    console.error('Error loading file from Cloudinary:', error)
    return NextResponse.json(
      { error: 'Error al cargar archivo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
