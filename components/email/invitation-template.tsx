import { buildBrandedEmailHtml, escapeHtml } from '@/lib/email-composer'

interface InvitationEmailProps {
  inviteLink: string
  invitedEmail: string
  propertyAddress?: string
  senderName?: string
  isBrokerInvite?: boolean
}

export function buildInvitationEmailHtml({
  inviteLink,
  invitedEmail,
  propertyAddress,
  senderName,
  isBrokerInvite = false,
}: InvitationEmailProps) {
  const safeSender = escapeHtml(senderName?.trim() || 'Equipo NeiFe')
  const safeEmail = escapeHtml(invitedEmail)
  const safeProperty = escapeHtml(propertyAddress?.trim() || 'tu propiedad')

  return buildBrandedEmailHtml({
    preview: isBrokerInvite
      ? 'Un corredor solicita administrar tus propiedades en NeiFe'
      : `Te invitaron a revisar ${safeProperty} en NeiFe`,
    title: isBrokerInvite ? 'Invitación para comenzar tu administración' : 'Tienes una invitación pendiente',
    greeting: 'Hola,',
    intro: isBrokerInvite
      ? [
          `<strong>${safeSender}</strong> quiere administrar tus propiedades a través de NeiFe.`,
          `Este correo fue enviado a <strong>${safeEmail}</strong>. Si aún no tienes cuenta, podrás crearla como arrendador y luego aprobar o rechazar la solicitud desde tu panel.`,
        ]
      : [
          `<strong>${safeSender}</strong> te invitó a unirte a NeiFe para gestionar ${safeProperty}.`,
          `Este correo fue enviado a <strong>${safeEmail}</strong>. Si todavía no tienes cuenta, podrás crearla y aceptar la invitación en pocos pasos.`,
        ],
    infoRows: isBrokerInvite
      ? [
          { label: 'Solicitud', value: 'Autorización para que un corredor administre tus propiedades' },
          { label: 'Próximo paso', value: 'Crear tu cuenta como arrendador o iniciar sesión para revisar la solicitud' },
        ]
      : [
          { label: 'Propiedad', value: safeProperty },
          { label: 'Próximo paso', value: 'Iniciar sesión o crear tu cuenta para aceptar la invitación' },
        ],
    bulletList: isBrokerInvite
      ? [
          'Crear una cuenta como <strong>arrendador</strong> si aún no la tienes.',
          'Revisar quién solicita la administración y aprobar solo si estás de acuerdo.',
          'Seguir viendo la operación de tu propiedad desde tu propio panel una vez aprobada.',
        ]
      : [
          'Acceder a la propiedad y su información desde tu panel.',
          'Mantener tus gestiones y documentos centralizados en NeiFe.',
        ],
    cta: {
      label: isBrokerInvite ? 'Revisar invitación y continuar' : 'Aceptar invitación',
      url: inviteLink,
    },
    closing: [
      'Si el botón no funciona, puedes copiar y pegar el enlace manualmente en tu navegador.',
      `<a href="${inviteLink}" style="color:#5E8B8C;word-break:break-all;">${escapeHtml(inviteLink)}</a>`,
    ],
    footnote:
      'Este enlace expira en 7 días. Si no reconoces esta gestión, puedes ignorar este correo sin realizar ninguna acción.',
  })
}

