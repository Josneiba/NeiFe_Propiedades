import Link from "next/link"
import { ArrowLeft, Shield, Lock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Política de Privacidad — NeiFe",
  description: "Cómo protegemos y tratamos tus datos personales en NeiFe."
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1917] via-[#2D3C3C] to-[#1C1917]">
      {/* Header */}
      <div className="border-b border-[#D5C3B6]/10 bg-[#1C1917]/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-[#9C8578] hover:text-[#D5C3B6]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a inicio
            </Button>
          </Link>
          <span className="text-sm text-[#B8965A] uppercase tracking-wider">Política de Privacidad</span>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-16 space-y-12">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-[#5E8B8C]" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#FAF6F2] tracking-tight">
              Política de Privacidad
            </h1>
          </div>
          <p className="text-lg text-[#9C8578]">
            Última actualización: Marzo 2025
          </p>
        </div>

        {/* Sections */}
        <section className="space-y-6">
          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">1. Responsable del Tratamiento</h2>
            <p className="text-[#9C8578] leading-relaxed">
              <strong className="text-[#D5C3B6]">NeiFe</strong> — Plataforma de gestión de arriendos es el responsable del tratamiento de tus datos personales de conformidad con la Ley 19.628 sobre Protección de la Vida Privada.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">2. Datos que Recopilamos</h2>
            <ul className="space-y-3 text-[#9C8578]">
              <li className="flex gap-3">
                <span className="text-[#5E8B8C] font-bold">•</span>
                <span><strong className="text-[#D5C3B6]">Datos de identificación:</strong> nombre completo, documento de identidad, email, teléfono</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#5E8B8C] font-bold">•</span>
                <span><strong className="text-[#D5C3B6]">Datos de la propiedad:</strong> dirección, fotos, documentos catastro</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#5E8B8C] font-bold">•</span>
                <span><strong className="text-[#D5C3B6]">Datos de uso:</strong> dirección IP, navegador, historial de acciones en la plataforma</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#5E8B8C] font-bold">•</span>
                <span><strong className="text-[#D5C3B6]">Datos financieros:</strong> historial de pagos (nunca guardamos datos bancarios completos)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">3. Finalidad del Tratamiento</h2>
            <ul className="space-y-2 text-[#9C8578]">
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Gestión del contrato de arriendo y cumplimiento de obligaciones</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Comunicaciones relacionadas al arriendo y pagos</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Cumplimiento de obligaciones legales (Ley 18.101, Ley 21.461)</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Mejora del servicio y análisis de uso</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Prevención de fraude y seguridad</li>
            </ul>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">4. Base Legal</h2>
            <p className="text-[#9C8578] leading-relaxed">
              El tratamiento de tus datos se basa en tu <strong className="text-[#D5C3B6]">consentimiento explícito</strong> al registrarte en NeiFe y aceptar estos términos. También cumplimos con lo establecido en la <strong className="text-[#D5C3B6]">Ley 19.628 sobre Protección de la Vida Privada</strong> y otras leyes aplicables en Chile.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">5. Conservación de Datos</h2>
            <p className="text-[#9C8578] leading-relaxed">
              Conservamos tus datos <strong className="text-[#D5C3B6]">durante la vigencia del contrato de arriendo + 5 años posteriores</strong>, conforme a la obligación legal de conservación de registros. Pasado este período, los datos serán eliminados o anonimizados.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <div className="flex items-start gap-3">
              <Eye className="h-6 w-6 text-[#5E8B8C] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-[#FAF6F2] mb-3">6. Tus Derechos</h2>
                <p className="text-[#9C8578] mb-4 leading-relaxed">
                  De conformidad con la Ley 19.628, tienes derecho a ejercer los siguientes derechos sobre tus datos personales:
                </p>
                <ul className="space-y-2 text-[#9C8578]">
                  <li className="flex gap-2"><span className="text-[#B8965A] font-bold">→</span> <strong className="text-[#D5C3B6]">Acceso:</strong> conocer qué datos tenemos sobre ti</li>
                  <li className="flex gap-2"><span className="text-[#B8965A] font-bold">→</span> <strong className="text-[#D5C3B6]">Rectificación:</strong> corregir datos inexactos o incompletos</li>
                  <li className="flex gap-2"><span className="text-[#B8965A] font-bold">→</span> <strong className="text-[#D5C3B6]">Cancelación:</strong> solicitar eliminación de datos</li>
                  <li className="flex gap-2"><span className="text-[#B8965A] font-bold">→</span> <strong className="text-[#D5C3B6]">Oposición:</strong> oponerse al tratamiento de datos</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">7. Transferencia a Terceros</h2>
            <p className="text-[#9C8578] mb-4 leading-relaxed">
              Utilizamos proveedores de servicios que pueden procesar tus datos:
            </p>
            <ul className="space-y-3 text-[#9C8578]">
              <li><strong className="text-[#D5C3B6]">Cloudinary:</strong> almacenamiento de fotos de propiedades (servidores en USA, cumple GDPR)</li>
              <li><strong className="text-[#D5C3B6]">Resend:</strong> envío de emails transaccionales (servidores en USA, cumple GDPR)</li>
              <li><strong className="text-[#D5C3B6]">PostgreSQL:</strong> base de datos encriptada (servidores locales)</li>
            </ul>
            <p className="text-[#9C8578] mt-4">
              Todos nuestros proveedores cumplen con estándares internacionales de seguridad de datos.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <div className="flex items-start gap-3">
              <Lock className="h-6 w-6 text-[#5E8B8C] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-[#FAF6F2] mb-3">8. Seguridad</h2>
                <ul className="space-y-2 text-[#9C8578]">
                  <li className="flex gap-2"><span className="text-[#B8965A]">🔒</span> Contraseñas encriptadas con bcrypt (no reversibles)</li>
                  <li className="flex gap-2"><span className="text-[#B8965A]">🔒</span> Comunicaciones HTTPS en toda la plataforma</li>
                  <li className="flex gap-2"><span className="text-[#B8965A]">🔒</span> Acceso restringido por roles y permisos</li>
                  <li className="flex gap-2"><span className="text-[#B8965A]">🔒</span> Auditoría de accesos (quién, cuándo, qué datos consultó)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">9. Contacto para Privacidad</h2>
            <p className="text-[#9C8578] leading-relaxed mb-3">
              Si tienes preguntas, deseas ejercer tus derechos o tienes una queja sobre el tratamiento de tus datos:
            </p>
            <div className="bg-[#1C1917]/50 p-4 rounded-lg border border-[#D5C3B6]/10">
              <p className="text-[#D5C3B6] font-medium">Email: privacidad@neife.cl</p>
              <p className="text-[#9C8578] text-sm mt-2">Responderemos en un plazo máximo de 10 días hábiles.</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="pt-8 mt-12 border-t border-[#D5C3B6]/10 text-center">
          <p className="text-[#9C8578] mb-4">
            ¿Dudas sobre tu privacidad? Contacta con nuestro equipo.
          </p>
          <Link href="/">
            <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] shadow-lg shadow-[#5E8B8C]/20">
              Volver a NeiFe
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
