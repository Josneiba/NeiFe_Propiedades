import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Rate limit simple en memoria para Nominatim (máx 1 req/seg por su política)
let lastRequest = 0

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const address = req.nextUrl.searchParams.get('address')
  if (!address?.trim()) {
    return NextResponse.json({ error: 'Dirección requerida' }, { status: 400 })
  }

  // Respetar rate limit de Nominatim: 1 req/segundo
  const now = Date.now()
  const elapsed = now - lastRequest
  if (elapsed < 1100) {
    await new Promise(r => setTimeout(r, 1100 - elapsed))
  }
  lastRequest = Date.now()

  try {
    // Siempre agregar Chile al query para restringir resultados
    const query = `${address.trim()}, Chile`
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '3')
    url.searchParams.set('countrycodes', 'cl')
    url.searchParams.set('addressdetails', '1')

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requiere User-Agent identificable
        'User-Agent': 'NeiFe-App/1.0 (contacto@neife.cl)',
        'Accept-Language': 'es',
      },
      // Cache de 1 hora para la misma dirección
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ lat: null, lng: null, error: 'Error en geocodificación' })
    }

    const data = await res.json()

    if (!data.length) {
      return NextResponse.json({
        lat: null,
        lng: null,
        error: 'Dirección no encontrada. Ajusta el marcador manualmente.'
      })
    }

    // Devolver el primer resultado con contexto
    const result = data[0]
    return NextResponse.json({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      // Alternativas si hay más de un resultado
      alternatives: data.slice(1, 3).map((r: any) => ({
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        displayName: r.display_name,
      }))
    })
  } catch (error) {
    console.error('[NeiFe Geocode]:', error)
    return NextResponse.json({ lat: null, lng: null, error: 'Error de conexión' })
  }
}
