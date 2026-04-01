import Link from "next/link"
import { ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Términos y Condiciones de Uso — NeiFe",
  description: "Términos y condiciones para usar NeiFe."
}

export default function TerminosPage() {
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
          <span className="text-sm text-[#B8965A] uppercase tracking-wider">Términos y Condiciones</span>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-16 space-y-12">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-[#75524C]" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#FAF6F2] tracking-tight">
              Términos y Condiciones
            </h1>
          </div>
          <p className="text-lg text-[#9C8578]">
            Última actualización: Marzo 2025
          </p>
        </div>

        {/* Sections */}
        <section className="space-y-6">
          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">1. Descripción del Servicio</h2>
            <p className="text-[#9C8578] leading-relaxed">
              NeiFe es una plataforma digital SaaS que facilita la gestión integral de arriendos en Chile. Permite a arrendadores gestionar propiedades, pagos, mantenciones y contratos. Los arrendatarios pueden administrar sus arriendos, pagos y comunicaciones con sus arrendadores.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">2. Responsabilidades del Arrendador</h2>
            <p className="text-[#9C8578] mb-3 leading-relaxed">
              El arrendador se compromete a:
            </p>
            <ul className="space-y-2 text-[#9C8578]">
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Cumplir con la Ley 18.101 (arrendamiento de predios urbanos)</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Proporcionar información veraz y actualizada sobre la propiedad</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Entregar la propiedad en condiciones habitables</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Realizar mantenciones y reparaciones necesarias</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> No cobrar más que el monto acordado en el contrato</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Respetar la privacidad e intimidad del arrendatario</li>
            </ul>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">3. Responsabilidades del Arrendatario</h2>
            <p className="text-[#9C8578] mb-3 leading-relaxed">
              El arrendatario se compromete a:
            </p>
            <ul className="space-y-2 text-[#9C8578]">
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Pagar el arriendo en la fecha acordada</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Cuidar la propiedad en buen estado</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Pagar servicios básicos a su cargo (agua, luz, gas)</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Notificar al arrendador de daños o desperfectos</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Respetar los términos del contrato de arriendo</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> No subarrendar sin consentimiento explícito</li>
            </ul>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#75524C]/10 border border-[#75524C]/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-[#C27F79] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-[#FAF6F2] mb-3">4. Limitación de Responsabilidad</h2>
                <p className="text-[#9C8578] leading-relaxed">
                  NeiFe actúa como facilitador neutral. <strong className="text-[#D5C3B6]">NeiFe no es responsable</strong> de:
                </p>
                <ul className="space-y-2 text-[#9C8578] mt-3">
                  <li className="flex gap-2"><span className="text-[#C27F79]">•</span> Conflictos entre arrendador y arrendatario</li>
                  <li className="flex gap-2"><span className="text-[#C27F79]">•</span> Incumplimiento de obligaciones legales entre partes</li>
                  <li className="flex gap-2"><span className="text-[#C27F79]">•</span> Daños a la propiedad o pérdida de bienes</li>
                  <li className="flex gap-2"><span className="text-[#C27F79]">•</span> Falta de disponibilidad temporal de la plataforma</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">5. Marco Legal Aplicable</h2>
            <p className="text-[#9C8578] mb-3 leading-relaxed">
              El uso de NeiFe se rige por las siguientes leyes chilenas:
            </p>
            <ul className="space-y-2 text-[#9C8578]">
              <li><strong className="text-[#D5C3B6]">Ley 18.101:</strong> Regula el arrendamiento de predios urbanos</li>
              <li><strong className="text-[#D5C3B6]">Ley 21.461 "Devuélveme mi casa":</strong> Protege derechos de arrendatarios</li>
              <li><strong className="text-[#D5C3B6]">Ley 19.628:</strong> Protección de datos personales</li>
              <li><strong className="text-[#D5C3B6]">Código Civil Chileno:</strong> Normas generales de contratos</li>
            </ul>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">6. Jurisdicción y Competencia</h2>
            <p className="text-[#9C8578] leading-relaxed">
              Cualquier controversia derivada del uso de NeiFe se regirá por las leyes de la República de Chile y será resuelta en los tribunales competentes de Santiago, Chile.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">7. Modificaciones de los Términos</h2>
            <p className="text-[#9C8578] leading-relaxed">
              NeiFe se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de email y entrarán en vigencia 15 días después de la notificación. El uso continuado de la plataforma implica aceptación de los cambios.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">8. Cancelación de Cuenta</h2>
            <p className="text-[#9C8578] leading-relaxed">
              Puedes solicitar la cancelación de tu cuenta en cualquier momento. Los datos se conservarán según la Ley 19.628 y obligaciones legales de auditoría fiscal. La cancelación no elimina responsabilidades contraídas durante el uso de la plataforma.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">9. Contacto Legal</h2>
            <p className="text-[#9C8578] mb-3">
              Para consultas sobre estos términos:
            </p>
            <div className="bg-[#1C1917]/50 p-4 rounded-lg border border-[#D5C3B6]/10">
              <p className="text-[#D5C3B6] font-medium">Email: legal@neife.cl</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="pt-8 mt-12 border-t border-[#D5C3B6]/10 text-center">
          <Link href="/">
            <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] shadow-lg shadow-[#75524C]/20">
              Volver a NeiFe
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
