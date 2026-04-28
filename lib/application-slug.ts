export function generateApplicationSlug(address: string) {
  const base = address
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('-')

  const random = Math.random().toString(36).slice(2, 8)
  return `${base || 'propiedad'}-${random}`
}
