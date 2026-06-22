import { auth } from '@/lib/auth-session'
import { NextRequest, NextResponse } from 'next/server'
import {
  generateDealPDF,
  generateContractPDF,
  generateBrokerStatementPDF,
  generateComparisonPDF,
  exportDealsAsZip,
} from '@/lib/pdf-export'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    const ids = searchParams.get('ids')?.split(',') || []
    const format = searchParams.get('format') || 'pdf'
    const title = searchParams.get('title') || 'Reporte'

    if (!type) {
      return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 })
    }

    let pdfBuffer: Buffer
    let filename: string

    switch (type) {
      case 'deal':
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        pdfBuffer = await generateDealPDF(id, {
          includeContacts: true,
          includeActivities: true,
        })
        filename = `negocio-${id}.pdf`
        break

      case 'contract':
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        pdfBuffer = await generateContractPDF(id)
        filename = `contrato-${id}.pdf`
        break

      case 'statement':
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
        }
        pdfBuffer = await generateBrokerStatementPDF(
          id,
          new Date(startDate),
          new Date(endDate)
        )
        filename = `estado-${id}.pdf`
        break

      case 'comparison':
        if (ids.length === 0) {
          return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
        }
        pdfBuffer = await generateComparisonPDF(ids, title)
        filename = `comparativa-${Date.now()}.pdf`
        break

      case 'bulk':
        if (ids.length === 0 || !format) {
          return NextResponse.json({ error: 'Missing ids or format' }, { status: 400 })
        }
        pdfBuffer = await exportDealsAsZip(ids, format as any)
        filename = `exportacion-${Date.now()}.${format === 'pdf' ? 'zip' : format}`
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { type, id, ids, format, title } = await request.json()

    if (!type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 })
    }

    let pdfBuffer: Buffer
    let filename: string

    switch (type) {
      case 'deal':
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        pdfBuffer = await generateDealPDF(id, { includeContacts: true, includeActivities: true })
        filename = `negocio-${id}.pdf`
        break

      case 'comparison':
        if (!ids || ids.length === 0) return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
        pdfBuffer = await generateComparisonPDF(ids, title)
        filename = `comparativa-${Date.now()}.pdf`
        break

      case 'bulk':
        if (!ids || ids.length === 0) return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
        pdfBuffer = await exportDealsAsZip(ids, format)
        filename = `exportacion-${Date.now()}.${format === 'pdf' ? 'zip' : format}`
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
