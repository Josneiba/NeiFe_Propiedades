import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface InvitationEmailProps {
  inviteLink: string
  invitedEmail: string
  propertyAddress?: string
  senderName?: string
}

export const InvitationEmail = ({
  inviteLink,
  invitedEmail,
  propertyAddress = 'Tu propiedad en NeiFe',
  senderName = 'Tu arrendador',
}: InvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>Invitación a NeiFe - Plataforma de Gestión de Arriendos</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Row>
            <Text style={heading}>¡Bienvenido a NeiFe!</Text>
          </Row>
          <Hr style={hr} />
          <Row>
            <Text style={paragraph}>
              Hola,
            </Text>
          </Row>
          <Row>
            <Text style={paragraph}>
              <strong>{senderName}</strong> te ha invitado a unirte a <strong>{propertyAddress}</strong> en NeiFe, la plataforma de gestión de arriendos más moderna de Chile.
            </Text>
          </Row>
          <Row>
            <Text style={paragraph}>
              Con NeiFe podrás:
            </Text>
          </Row>
          <Row>
            <ul style={{ marginLeft: '20px', color: '#666' }}>
              <li style={{ marginBottom: '8px' }}>📅 Gestionar tu calendario de arriendo</li>
              <li style={{ marginBottom: '8px' }}>💰 Ver y pagar arriendos de forma segura</li>
              <li style={{ marginBottom: '8px' }}>🔧 Reportar mantenciones rápidamente</li>
              <li style={{ marginBottom: '8px' }}>📄 Acceder a tus contratos digitalmente</li>
              <li style={{ marginBottom: '8px' }}>👥 Contactar directamente con tu arrendador</li>
            </ul>
          </Row>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Aceptar Invitación
            </Button>
          </Section>
          <Hr style={hr} />
          <Row>
            <Text style={footer}>
              Si el botón no funciona, copia y pega este enlace en tu navegador:
            </Text>
          </Row>
          <Row>
            <Link href={inviteLink} style={link}>
              {inviteLink}
            </Link>
          </Row>
          <Row>
            <Text style={footerSmall}>
              Este enlace expira en 7 días. Si no solicitaste esta invitación, puedes ignorar este correo.
            </Text>
          </Row>
          <Hr style={hr} />
          <Row>
            <Text style={footerSmall}>
              © 2026 NeiFe. Todos los derechos reservados.
            </Text>
          </Row>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#f3f3f5',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const box = {
  padding: '0 48px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '1.5',
  textAlign: 'left' as const,
  marginBottom: '12px',
}

const buttonContainer = {
  padding: '27px 0 27px',
}

const button = {
  backgroundColor: '#5E8B8C',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const link = {
  color: '#5E8B8C',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
}

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '1.5',
  textAlign: 'left' as const,
}

const footerSmall = {
  color: '#999',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'left' as const,
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 20px 0',
}
