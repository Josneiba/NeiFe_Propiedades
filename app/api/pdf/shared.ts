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

function parseCloudinaryPdfUrl(pdfUrl: string) {
  try {
    const parsedUrl = new URL(pdfUrl)
    const match = parsedUrl.pathname.match(/^\/([^/]+)\/raw\/upload\/(?:v\d+\/)?(.+\.pdf)$/i)

    if (parsedUrl.protocol !== 'https:') {
      return null
    }

    if (parsedUrl.hostname !== 'res.cloudinary.com') {
      return null
    }

    if (!match) {
      return null
    }

    return {
      cloudName: match[1],
      publicId: match[2],
    }
  } catch {
    return null
  }
}

export async function proxyCloudinaryPdf(request: NextRequest, path: string[] = []) {
  const pdfUrl = getPdfUrlFromRequest(request, path)

  if (!pdfUrl) {
    return NextResponse.json({ error: 'Missing PDF URL' }, { status: 400 })
  }

  try {
    const parsedPdf = parseCloudinaryPdfUrl(pdfUrl)

    if (!parsedPdf) {
      return NextResponse.json({ error: 'Invalid Cloudinary PDF URL' }, { status: 400 })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || parsedPdf.cloudName
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary is not configured correctly' }, { status: 500 })
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 300
    const timestamp = Math.floor(Date.now() / 1000)
    const signatureParams = {
      attachment: 'false',
      expires_at: expiresAt,
      format: 'pdf',
      public_id: parsedPdf.publicId,
      timestamp,
      type: 'upload',
    }
    const signature = cloudinary.utils.api_sign_request(signatureParams, apiSecret)
    const signedDownloadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?${new URLSearchParams({
      timestamp: String(timestamp),
      public_id: parsedPdf.publicId,
      format: 'pdf',
      type: 'upload',
      attachment: 'false',
      expires_at: String(expiresAt),
      signature,
      api_key: apiKey,
    }).toString()}`

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
