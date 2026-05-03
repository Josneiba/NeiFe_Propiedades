import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { path } = await params
  const pdfUrl = decodeURIComponent(path.join('/'))

  try {
    // Extraer el public_id de la URL de Cloudinary
    // URL format: https://res.cloudinary.com/cloud_name/raw/upload/v1234567/folder/file.pdf
    const urlMatch = pdfUrl.match(/\/v\d+\/(.+)$/)
    if (!urlMatch) {
      return NextResponse.json({ error: 'Invalid Cloudinary URL format' }, { status: 400 })
    }

    const publicId = urlMatch[1].replace(/\.pdf$/, '') // Remover extensión para signed URL

    // Generar signed URL con autenticación
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      secure: true,
      format: 'pdf',
    })

    const response = await fetch(signedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    
    if (!response.ok) {
      console.error('Failed to fetch PDF:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to fetch PDF', status: response.status }, { status: response.status })
    }

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error loading PDF:', error)
    return NextResponse.json({ error: 'Failed to load PDF', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
