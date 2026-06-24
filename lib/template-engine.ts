export type TemplateVars = {
  nombre?: string
  propiedad?: string
  direccion?: string
  monto?: string
  fecha?: string
  fecha_inicio?: string
  fecha_fin?: string
  corredor?: string
  empresa?: string
  telefono_corredor?: string
  sector?: string
  [key: string]: string | undefined
}

/** Interpola {{variable}} en un template con los valores dados */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

/** Extrae las variables usadas en un template */
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

/** Genera link de WhatsApp directo con mensaje pre-rellenado */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  const withCountry = clean.startsWith('56') ? clean : `56${clean}`
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`
}
