import { NextRequest } from 'next/server'
import { proxyCloudinaryPdf } from './shared'

export async function GET(request: NextRequest) {
  return proxyCloudinaryPdf(request)
}
