/**
 * Servicio de emails para NeiFe
 * Utiliza Resend como proveedor de emails transaccionales
 * 
 * Variables de entorno requeridas:
 * - RESEND_API_KEY: Clave API de Resend (https://resend.com)
 */

interface PaymentReminderParams {
  tenantEmail: string
  tenantName: string
  propertyAddress: string
  rentAmount: number
  dueDate: string
  month: string
}

interface LandlordNotificationParams {
  landlordEmail: string
  landlordName: string
  propertyAddress: string
  pendingCount: number
  totalDue: number
}

/**
 * Genera el HTML del email de recordatorio de pago para arrendatario
 */
export function generatePaymentReminderEmailHTML(params: PaymentReminderParams): string {
  const formattedAmount = params.rentAmount.toLocaleString('es-CL')
  const formattedDueDate = new Date(params.dueDate).toLocaleDateString('es-CL')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #FAF6F2; }
    .header { background: #2D3C3C; padding: 24px; text-align: center; }
    .header-text { color: #D5C3B6; font-size: 24px; font-weight: bold; margin: 0; }
    .content { padding: 32px; background: #FAF6F2; }
    .greeting { color: #1C1917; font-size: 18px; margin-bottom: 16px; }
    .info-box { background: #F2E8E0; border-left: 4px solid #75524C; padding: 16px; margin: 20px 0; }
    .info-label { color: #9C8578; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .info-value { color: #1C1917; font-size: 16px; font-weight: bold; margin-top: 4px; }
    .amount { color: #5E8B8C; font-size: 32px; font-weight: bold; }
    .btn { display: inline-block; background: #75524C; color: #FAF6F2; padding: 12px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .footer { background: #2D3C3C; color: #9C8578; padding: 20px; text-align: center; font-size: 12px; }
    .footer a { color: #B8965A; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    {/* Header */}
    <div class="header">
      <p class="header-text">NeiFe</p>
    </div>

    {/* Content */}
    <div class="content">
      <p class="greeting">Hola ${params.tenantName},</p>
      
      <p>Te recordamos que tu pago de arriendo del mes de <strong>${params.month}</strong> está próximo a vencer.</p>

      <div class="info-box">
        <div class="info-label">Propiedad</div>
        <div class="info-value">${params.propertyAddress}</div>
      </div>

      <div class="info-box">
        <div class="info-label">Monto a pagar</div>
        <div class="amount">$${formattedAmount}</div>
      </div>

      <div class="info-box">
        <div class="info-label">Fecha de vencimiento</div>
        <div class="info-value">${formattedDueDate}</div>
      </div>

      <p>Puedes realizar el pago desde tu cuenta en NeiFe seleccionando entre las opciones de:</p>
      <ul style="color: #1C1917;">
        <li><strong>Tarjeta de crédito/débito</strong> — Pago inmediato</li>
        <li><strong>Transferencia bancaria</strong> — Datos se envían en la plataforma</li>
      </ul>

      <a href="https://neife.cl/mi-arriendo/pagos" class="btn">Realizar Pago</a>

      <p style="color: #9C8578; font-size: 12px; margin-top: 30px;">
        Si ya realizaste el pago, por favor ignora este mensaje.<br>
        Si tienes dudas, contáctanos en: soporte@neife.cl
      </p>
    </div>

    {/* Footer */}
    <div class="footer">
      <p>© 2025 NeiFe — Plataforma de Gestión de Arriendos para Chile</p>
      <p>
        <a href="https://neife.cl/privacidad">Privacidad</a> | 
        <a href="https://neife.cl/terminos">Términos</a> | 
        <a href="https://neife.cl/legal">Legal</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Genera el HTML del email de notificación para arrendador
 */
export function generateLandlordNotificationHTML(params: LandlordNotificationParams): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #FAF6F2; }
    .header { background: #2D3C3C; padding: 24px; text-align: center; }
    .header-text { color: #D5C3B6; font-size: 24px; font-weight: bold; }
    .content { padding: 32px; background: #FAF6F2; color: #1C1917; }
    .alert-box { background: #FFF0F0; border-left: 4px solid #C27F79; padding: 16px; margin: 20px 0; }
    .btn { display: inline-block; background: #5E8B8C; color: #FAF6F2; padding: 12px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="header-text">NeiFe — Panel de Arrendador</p>
    </div>

    <div class="content">
      <p>Hola ${params.landlordName},</p>
      
      <div class="alert-box">
        <strong>${params.pendingCount} propiedad(es)</strong> con pagos pendientes que requieren tu atención
      </div>

      <p>La siguiente propiedad tiene pagos pendientes:</p>
      <p><strong>${params.propertyAddress}</strong></p>
      <p><strong>Monto total por cobrar: $${params.totalDue.toLocaleString('es-CL')}</strong></p>

      <a href="https://neife.cl/dashboard/pagos" class="btn">Ver en tu Dashboard</a>

      <p style="color: #9C8578; font-size: 12px; margin-top: 30px;">
        Este es un mensaje automático de NeiFe. Por favor no respondas a este email.
      </p>
    </div>

    <div style="background: #2D3C3C; color: #9C8578; padding: 20px; text-align: center; font-size: 12px;">
      <p>© 2025 NeiFe — Gestión de Arriendos Chile</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Función para enviar email de recordatorio de pago
 * En producción, requiere configuración de Resend
 */
export async function sendPaymentReminder(
  params: PaymentReminderParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que RESEND_API_KEY esté configurada
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn(
        '[NeiFe] RESEND_API_KEY no configurada. Los emails de recordatorio no se enviarán en desarrollo.'
      )
      return { success: true } // Permitir que continúe en desarrollo
    }

    // En desarrollo, simular envío
    if (process.env.NODE_ENV === 'development') {
      console.log('[NeiFe] Recordatorio de pago simulado:', {
        para: params.tenantEmail,
        asunto: `Recordatorio: Tu pago de arriendo vence pronto — ${params.month}`,
      })
      return { success: true }
    }

    // En producción, enviar con Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'NeiFe <pagos@neife.cl>',
        to: params.tenantEmail,
        subject: `Recordatorio: Tu pago de arriendo vence pronto — ${params.month}`,
        html: generatePaymentReminderEmailHTML(params),
      }),
    })

    if (!response.ok) {
      throw new Error(`Error al enviar email: ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[NeiFe] Error enviando recordatorio de pago:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Función para enviar notificación al arrendador
 */
export async function sendLandlordNotification(
  params: LandlordNotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || process.env.NODE_ENV === 'development') {
      console.log('[NeiFe] Notificación al arrendador simulada:', {
        para: params.landlordEmail,
        propiedades: params.pendingCount,
      })
      return { success: true }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'NeiFe <notificaciones@neife.cl>',
        to: params.landlordEmail,
        subject: `Alerta: ${params.pendingCount} pago(s) pendiente(s) en NeiFe`,
        html: generateLandlordNotificationHTML(params),
      }),
    })

    if (!response.ok) {
      throw new Error(`Error al enviar email: ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[NeiFe] Error enviando notificación al arrendador:', errorMessage)
    return { success: false, error: errorMessage }
  }
}
