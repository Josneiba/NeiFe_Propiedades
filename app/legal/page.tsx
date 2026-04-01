import Link from "next/link"
import { ArrowLeft, BookOpen, Scale, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Información Legal — NeiFe",
  description: "Marco legal que regula NeiFe y los arriendos en Chile."
}

export default function LegalPage() {
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
          <span className="text-sm text-[#B8965A] uppercase tracking-wider">Información Legal</span>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-16 space-y-12">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-[#5E8B8C]" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#FAF6F2] tracking-tight">
              Información Legal
            </h1>
          </div>
          <p className="text-lg text-[#9C8578]">
            Marco legal que regula NeiFe y la relación entre arrendadores y arrendatarios
          </p>
        </div>

        {/* Sections */}
        <section className="space-y-6">
          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <div className="flex items-start gap-3">
              <BookOpen className="h-6 w-6 text-[#5E8B8C] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-[#FAF6F2] mb-3">Ley 18.101: Arrendamiento de Predios Urbanos</h2>
                <p className="text-[#9C8578] mb-3 leading-relaxed">
                  Esta ley regula los contratos de arrendamiento de viviendas, locales comerciales y terrenos urbanos en Chile. Es el marco fundamental que protege los derechos y obligaciones de ambas partes.
                </p>
                <div className="bg-[#1C1917]/50 p-4 rounded-lg border border-[#D5C3B6]/10 space-y-2">
                  <p className="text-sm text-[#9C8578]"><strong className="text-[#D5C3B6]">Plazo mínimo:</strong> No hay plazo mínimo obligatorio (puede ser de 1 mes)</p>
                  <p className="text-sm text-[#9C8578]"><strong className="text-[#D5C3B6]">Aumento de arriendo:</strong> Máximo anual, debe ser estipulado en el contrato</p>
                  <p className="text-sm text-[#9C8578]"><strong className="text-[#D5C3B6]">Depósito de garantía:</strong> Máximo 2 meses de arriendo</p>
                  <p className="text-sm text-[#9C8578]"><strong className="text-[#D5C3B6]">Terminación:</strong> Requiere aviso previo o causa legal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#5E8B8C]/10 border border-[#5E8B8C]/30">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">Ley 21.461: "Devuélveme mi casa"</h2>
            <p className="text-[#9C8578] mb-3 leading-relaxed">
              Modificación a la Ley 18.101 que fortalece derechos de los arrendatarios, especialmente contra desalojos injustificados. Algunas disposiciones:
            </p>
            <ul className="space-y-2 text-[#9C8578]">
              <li className="flex gap-2"><span className="text-[#5E8B8C] font-bold">✓</span> <strong className="text-[#D5C3B6]">Protección contra desalojos arbitrarios</strong> — se requiere causa legal probada</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C] font-bold">✓</span> <strong className="text-[#D5C3B6]">Derecho a impugnar desalojos</strong> — el arrendatario puede recurrir a los tribunales</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C] font-bold">✓</span> <strong className="text-[#D5C3B6]">Plazo para abandonar vivienda</strong> — mínimo 30 días después de sentencia</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C] font-bold">✓</span> <strong className="text-[#D5C3B6]">Prohibición de cláusulas abusivas</strong> — no puede haber condiciones injustas</li>
              <li className="flex gap-2"><span className="text-[#5E8B8C] font-bold">✓</span> <strong className="text-[#D5C3B6]">Acceso a información</strong> — arrendador debe informar derechos y obligaciones</li>
            </ul>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <div className="flex items-start gap-3">
              <Lock className="h-6 w-6 text-[#5E8B8C] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-[#FAF6F2] mb-3">Ley 19.628: Protección de Datos Personales</h2>
                <p className="text-[#9C8578] mb-3 leading-relaxed">
                  Regula el tratamiento de datos personales en Chile. Establece derechos y obligaciones en la recopilación y uso de información personal.
                </p>
                <div className="bg-[#1C1917]/50 p-4 rounded-lg border border-[#D5C3B6]/10 space-y-2">
                  <p className="text-sm text-[#9C8578]"><strong className="text-[#D5C3B6]">Derechos del titular:</strong> acceso, rectificación, cancelación, oposición</p>
                  <p className="text-sm text-[#9C8578]"><strong className="text-[#D5C3B6]">Consentimiento:</strong> debe ser informado, libre, específico e inequívoco</p>
                  <p className="text-sm text-[#9C8578]"><strong className="text-[#D5C3B6]">Seguridad:</strong> responsable debe adoptar medidas de protección</p>
                  <p className="text-sm text-[#9C8578]"><strong className="text-[#D5C3B6]">Transferencia:</strong> solo a terceros con consentimiento</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">Código Civil Chileno</h2>
            <p className="text-[#9C8578] mb-3 leading-relaxed">
              Proporciona el marco general de obligaciones y contratos. Aplica cuando hay vacíos en leyes específicas:
            </p>
            <ul className="space-y-2 text-[#9C8578]">
              <li className="flex gap-2"><span className="text-[#B8965A]">•</span> Validez de contratos y acuerdos</li>
              <li className="flex gap-2"><span className="text-[#B8965A]">•</span> Obligaciones de ambas partes</li>
              <li className="flex gap-2"><span className="text-[#B8965A]">•</span> Resolución de controversias</li>
              <li className="flex gap-2"><span className="text-[#B8965A]">•</span> Responsabilidad por incumplimiento</li>
            </ul>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#75524C]/10 border border-[#75524C]/30">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2] mb-3">Derechos y Obligaciones del Arrendador</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-[#D5C3B6] mb-3">Derechos</h3>
                <ul className="space-y-2 text-[#9C8578] text-sm">
                  <li className="flex gap-2"><span className="text-[#75524C]">✓</span> Recibir pago puntual del arriendo</li>
                  <li className="flex gap-2"><span className="text-[#75524C]">✓</span> Recuperar la propiedad al término del contrato</li>
                  <li className="flex gap-2"><span className="text-[#75524C]">✓</span> Solicitar reparaciones del arrendatario</li>
                  <li className="flex gap-2"><span className="text-[#75524C]">✓</span> Desalojar por incumplimiento grave</li>
                  <li className="flex gap-2"><span className="text-[#75524C]">✓</span> Retener depósito por daños</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#D5C3B6] mb-3">Obligaciones</h3>
                <ul className="space-y-2 text-[#9C8578] text-sm">
                  <li className="flex gap-2"><span className="text-[#75524C]">→</span> Entregar propiedad habitable</li>
                  <li className="flex gap-2"><span className="text-[#75524C]">→</span> Realizar mantenciones necesarias</li>
                  <li className="flex gap-2"><span className="text-[#75524C]">→</span> Respetar privacidad del arrendatario</li>
                  <li className="flex gap-2"><span className="text-[#75524C]">→</span> Devolver depósito al término</li>
                  <li className="flex gap-2"><span className="text-[#75524C]">→</span> Proporcionar contrato por escrito</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#5E8B8C]/10 border border-[#5E8B8C]/30">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2] mb-3">Derechos y Obligaciones del Arrendatario</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-[#D5C3B6] mb-3">Derechos</h3>
                <ul className="space-y-2 text-[#9C8578] text-sm">
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Gozar de la propiedad en paz</li>
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Solicitar mantenciones necesarias</li>
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Privacidad e intimidad</li>
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Protección contra desalojos injustificados</li>
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">✓</span> Recibir depósito al término</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#D5C3B6] mb-3">Obligaciones</h3>
                <ul className="space-y-2 text-[#9C8578] text-sm">
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">→</span> Pagar arriendo en plazo acordado</li>
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">→</span> Usar propiedad adecuadamente</li>
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">→</span> Pagar servicios básicos a su cargo</li>
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">→</span> Avisar de daños o problemas</li>
                  <li className="flex gap-2"><span className="text-[#5E8B8C]">→</span> Devolver propiedad limpia al término</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-xl bg-[#2D3C3C]/30 border border-[#D5C3B6]/10">
            <h2 className="text-2xl font-serif font-bold text-[#FAF6F2]">¿Dudas sobre tus derechos?</h2>
            <p className="text-[#9C8578] mb-4">
              Para consultas sobre aspectos legales de tu arriendo, te recomendamos:
            </p>
            <ul className="space-y-2 text-[#9C8578]">
              <li className="flex gap-2"><span className="text-[#B8965A]">→</span> Contactar con NeiFe: legal@neife.cl</li>
              <li className="flex gap-2"><span className="text-[#B8965A]">→</span> Consultar con un abogado especializado</li>
              <li className="flex gap-2"><span className="text-[#B8965A]">→</span> Acudir a la Defensoría de los Derechos del Pueblo</li>
            </ul>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="pt-8 mt-12 border-t border-[#D5C3B6]/10 text-center space-y-4">
          <p className="text-[#9C8578]">
            Lee también nuestros <Link href="/privacidad" className="text-[#5E8B8C] underline underline-offset-2 hover:text-[#D5C3B6]">términos de privacidad</Link> y <Link href="/terminos" className="text-[#5E8B8C] underline underline-offset-2 hover:text-[#D5C3B6]">condiciones de uso</Link>.
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
