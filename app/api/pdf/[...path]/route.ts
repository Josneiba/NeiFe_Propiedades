import { NextRequest } from 'next/server'
import { proxyCloudinaryPdf } from '../shared'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyCloudinaryPdf(request, path)
}
