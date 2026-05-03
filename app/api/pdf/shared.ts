import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getPdfUrlFromRequest(request: NextRequest, path: string[]) {
  const queryUrl = request.nextUrl.searchParams.get('url')

  if (queryUrl) {
    return queryUrl
  }

  if (path.length === 0) {
    return null
  }

  return decodeURIComponent(path.join('/'))
}

function isAllowedCloudinaryPdf(pdfUrl: string) {
  try {
    const parsedUrl = new URL(pdfUrl)
    const expectedCloudName = process.env.CLOUDINARY_CLOUD_NAME

    if (parsedUrl.protocol !== 'https:') {
      return false
    }

    if (parsedUrl.hostname !== 'res.cloudinary.com') {
      return false
    }

    if (expectedCloudName && !parsedUrl.pathname.startsWith(`/${expectedCloudName}/`)) {
      return false
    }

    return parsedUrl.pathname.includes('/raw/upload/') && parsedUrl.pathname.toLowerCase().endsWith('.pdf')
  } catch {
    return false
  }
}

function extractCloudinaryPublicId(pdfUrl: string) {
  const parsedUrl = new URL(pdfUrl)
  const match = parsedUrl.pathname.match(/^\/[^/]+\/raw\/upload\/(?:v\d+\/)?(.+)$/)

  return match?.[1] ?? null
}

export async function proxyCloudinaryPdf(request: NextRequest, path: string[] = []) {
  const pdfUrl = getPdfUrlFromRequest(request, path)

  if (!pdfUrl) {
    return NextResponse.json({ error: 'Missing PDF URL' }, { status: 400 })
  }

  try {
    if (!isAllowedCloudinaryPdf(pdfUrl)) {
      return NextResponse.json({ error: 'Invalid Cloudinary PDF URL' }, { status: 400 })
    }

    const publicId = extractCloudinaryPublicId(pdfUrl)

    if (!publicId) {
      return NextResponse.json({ error: 'Invalid Cloudinary public ID' }, { status: 400 })
    }

    const signedDownloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'raw',
      type: 'upload',
      attachment: false,
      expires_at: Math.floor(Date.now() / 1000) + 300,
    })

    const response = await fetch(signedDownloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch PDF:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to fetch PDF', status: response.status }, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/pdf'
    const fileName = pdfUrl.split('/').pop() || 'document.pdf'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType.includes('pdf') ? contentType : 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error loading PDF:', error)
    return NextResponse.json({ error: 'Failed to load PDF', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
