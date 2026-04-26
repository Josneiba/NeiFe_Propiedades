import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'

export async function GET(req: NextRequest) {
  console.log('\n=== DIAGNOSTICO DE RESEND ===\n')

  // Verificar variables de entorno
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM?.trim() || null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  console.log('📋 Variables de entorno:')
  console.log(`  RESEND_API_KEY: ${apiKey ? '✅ Configurada' : '❌ NO CONFIGURADA'}`)
  console.log(`  RESEND_FROM: ${fromEmail ? `✅ ${fromEmail}` : '❌ NO CONFIGURADA'}`)
  console.log(`  NEXT_PUBLIC_APP_URL: ${appUrl ? `✅ ${appUrl}` : '❌ NO CONFIGURADA'}`)

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'RESEND_API_KEY no está configurada',
        status: 'FAILED',
      },
      { status: 400 }
    )
  }

  const resend = new Resend(apiKey)

  try {
    const fromUsed = getResendFrom()
    const toEmail = req.nextUrl.searchParams.get('to')?.trim() || 'delivered@resend.dev'
    console.log('\n📧 Intentando enviar correo de prueba...')
    console.log(`  Destinatario: ${toEmail}`)

    const result = await resend.emails.send({
      from: fromUsed,
      to: toEmail,
      subject: 'Test de NeiFe - Verifica que Resend está funcionando',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5E8B8C;">✅ NeiFe - Resend está funcionando</h2>
          <p style="color: #666;">Este es un correo de prueba enviado desde tu aplicación NeiFe.</p>
          <p style="color: #666;">
            <strong>Información:</strong><br/>
            API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}<br/>
            Remitente: ${fromUsed}<br/>
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `,
    })

    if (result.error) {
      console.error('❌ Error de Resend:', result.error)
      return NextResponse.json(
        {
          error: 'Error al enviar correo de prueba',
          details: result.error,
          status: 'FAILED',
        },
        { status: 400 }
      )
    }

    console.log(`✅ Correo enviado exitosamente`)
    console.log(`   Email ID: ${result.data?.id}`)

    return NextResponse.json(
      {
        status: 'SUCCESS',
        message: 'Resend está funcionando correctamente',
        emailId: result.data?.id,
        to: toEmail,
        from: fromUsed,
        configuration: {
          apiKeyConfigured: !!apiKey,
          fromEmailConfigured: !!fromEmail,
          appUrlConfigured: !!appUrl,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error durante el test:', error)
    return NextResponse.json(
      {
        error: 'Error durante el test de Resend',
        details: error instanceof Error ? error.message : String(error),
        status: 'FAILED',
      },
      { status: 500 }
    )
  }
}
