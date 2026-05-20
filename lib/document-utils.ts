export function isPdfFileUrl(url?: string | null) {
  if (!url) return false
  const normalized = url.toLowerCase()
  return normalized.includes(".pdf") || normalized.includes("/raw/upload/")
}

export function isImageFileUrl(url?: string | null) {
  if (!url) return false
  return /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(url)
}

export function getDocumentViewUrl(url?: string | null) {
  if (!url) return null
  return isPdfFileUrl(url) ? `/api/pdf?url=${encodeURIComponent(url)}` : url
}

export function getDocumentKindLabel(url?: string | null) {
  if (isPdfFileUrl(url)) return "PDF"
  if (isImageFileUrl(url)) return "Imagen"
  return "Archivo"
}
