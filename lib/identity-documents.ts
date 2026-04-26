import { formatRut, normalizeRut, validateRut } from '@/lib/validate-rut'

export const DOCUMENT_COUNTRIES = [
  { value: 'CL', label: 'Chile' },
  { value: 'AR', label: 'Argentina' },
  { value: 'PE', label: 'Peru' },
  { value: 'CO', label: 'Colombia' },
  { value: 'MX', label: 'Mexico' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'ES', label: 'Espana' },
  { value: 'OTHER', label: 'Otro pais' },
] as const

export const DOCUMENT_TYPES = [
  { value: 'RUT', label: 'RUT' },
  { value: 'DNI', label: 'DNI' },
  { value: 'CEDULA', label: 'Cedula' },
  { value: 'PASSPORT', label: 'Pasaporte' },
  { value: 'RFC', label: 'RFC' },
  { value: 'CURP', label: 'CURP' },
  { value: 'NIF_NIE', label: 'NIF/NIE' },
  { value: 'OTHER', label: 'Otro documento' },
] as const

export type DocumentCountryCode = (typeof DOCUMENT_COUNTRIES)[number]['value']
export type DocumentTypeCode = (typeof DOCUMENT_TYPES)[number]['value']

export const DOCUMENT_COUNTRY_VALUES = DOCUMENT_COUNTRIES.map((item) => item.value) as [
  DocumentCountryCode,
  ...DocumentCountryCode[],
]
export const DOCUMENT_TYPE_VALUES = DOCUMENT_TYPES.map((item) => item.value) as [
  DocumentTypeCode,
  ...DocumentTypeCode[],
]

const DOCUMENT_TYPES_BY_COUNTRY: Record<DocumentCountryCode, DocumentTypeCode[]> = {
  CL: ['RUT', 'PASSPORT', 'OTHER'],
  AR: ['DNI', 'PASSPORT', 'OTHER'],
  PE: ['DNI', 'CEDULA', 'PASSPORT', 'OTHER'],
  CO: ['CEDULA', 'PASSPORT', 'OTHER'],
  MX: ['CURP', 'RFC', 'PASSPORT', 'OTHER'],
  US: ['PASSPORT', 'OTHER'],
  ES: ['NIF_NIE', 'PASSPORT', 'OTHER'],
  OTHER: ['PASSPORT', 'OTHER'],
}

export function getDocumentTypeOptions(country: DocumentCountryCode) {
  return DOCUMENT_TYPES.filter((type) =>
    DOCUMENT_TYPES_BY_COUNTRY[country].includes(type.value)
  )
}

export function getDefaultDocumentType(country: DocumentCountryCode): DocumentTypeCode {
  return DOCUMENT_TYPES_BY_COUNTRY[country][0]
}

export function getDocumentLabel(type?: string | null) {
  switch (type) {
    case 'RUT':
      return 'RUT'
    case 'DNI':
      return 'DNI'
    case 'CEDULA':
      return 'Cedula'
    case 'PASSPORT':
      return 'Pasaporte'
    case 'RFC':
      return 'RFC'
    case 'CURP':
      return 'CURP'
    case 'NIF_NIE':
      return 'NIF/NIE'
    case 'OTHER':
      return 'Documento'
    default:
      return 'Documento'
  }
}

export function getDocumentPlaceholder(
  country: DocumentCountryCode,
  type: DocumentTypeCode
) {
  if (country === 'CL' && type === 'RUT') return '12.345.678-5'
  if (country === 'AR' && type === 'DNI') return '12345678'
  if (country === 'PE' && type === 'DNI') return '12345678'
  if (country === 'CO' && type === 'CEDULA') return '1234567890'
  if (country === 'MX' && type === 'CURP') return 'ABCD010203HDFXYZ09'
  if (country === 'MX' && type === 'RFC') return 'ABCD0102031A2'
  if (country === 'ES' && type === 'NIF_NIE') return '12345678Z'
  if (type === 'PASSPORT') return 'A1234567'
  return 'Ingresa tu documento'
}

function sanitizeForValidation(type: DocumentTypeCode, value: string) {
  const upper = value.trim().toUpperCase()

  switch (type) {
    case 'RUT':
      return upper.replace(/[^0-9K.\-\s]/g, '')
    case 'PASSPORT':
    case 'OTHER':
      return upper.replace(/[^A-Z0-9\-]/g, '')
    default:
      return upper.replace(/[^A-Z0-9]/g, '')
  }
}

function normalizeGenericDocument(type: DocumentTypeCode, value: string) {
  const sanitized = sanitizeForValidation(type, value)

  if (type === 'RUT') {
    return normalizeRut(sanitized)
  }

  if (type === 'PASSPORT' || type === 'OTHER') {
    return sanitized.replace(/\s+/g, '')
  }

  return sanitized
}

function validateDni(country: DocumentCountryCode, normalized: string) {
  if (!/^\d+$/.test(normalized)) return false
  if (country === 'AR') return /^\d{7,8}$/.test(normalized)
  if (country === 'PE') return /^\d{8}$/.test(normalized)
  return /^\d{6,12}$/.test(normalized)
}

function validateCedula(country: DocumentCountryCode, normalized: string) {
  if (country === 'CO') return /^\d{6,10}$/.test(normalized)
  return /^[A-Z0-9]{5,20}$/.test(normalized)
}

function validatePassport(normalized: string) {
  return /^[A-Z0-9]{6,12}$/.test(normalized)
}

function validateRfc(normalized: string) {
  return /^([A-ZÑ&]{3,4})\d{6}[A-Z0-9]{3}$/.test(normalized)
}

function validateCurp(normalized: string) {
  return /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(normalized)
}

function calculateNifLetter(body: number) {
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  return letters[body % 23]
}

function validateNifNie(normalized: string) {
  if (/^\d{8}[A-Z]$/.test(normalized)) {
    const body = parseInt(normalized.slice(0, 8), 10)
    return calculateNifLetter(body) === normalized.slice(-1)
  }

  if (/^[XYZ]\d{7}[A-Z]$/.test(normalized)) {
    const prefix = normalized[0] === 'X' ? '0' : normalized[0] === 'Y' ? '1' : '2'
    const body = parseInt(`${prefix}${normalized.slice(1, 8)}`, 10)
    return calculateNifLetter(body) === normalized.slice(-1)
  }

  return false
}

function validateOther(normalized: string) {
  return /^[A-Z0-9\-]{5,20}$/.test(normalized)
}

export function validateDocument(params: {
  country: DocumentCountryCode
  type: DocumentTypeCode
  value: string
}) {
  const normalized = normalizeGenericDocument(params.type, params.value)
  const label = getDocumentLabel(params.type)

  if (!normalized) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      label,
      message: `El ${label} es obligatorio`,
    }
  }

  let isValid = false

  switch (params.type) {
    case 'RUT':
      isValid = validateRut(normalized)
      break
    case 'DNI':
      isValid = validateDni(params.country, normalized)
      break
    case 'CEDULA':
      isValid = validateCedula(params.country, normalized)
      break
    case 'PASSPORT':
      isValid = validatePassport(normalized)
      break
    case 'RFC':
      isValid = validateRfc(normalized)
      break
    case 'CURP':
      isValid = validateCurp(normalized)
      break
    case 'NIF_NIE':
      isValid = validateNifNie(normalized)
      break
    case 'OTHER':
      isValid = validateOther(normalized)
      break
    default:
      isValid = false
  }

  return {
    isValid,
    normalized,
    formatted: params.type === 'RUT' && isValid ? formatRut(normalized) : normalized,
    label,
    message: isValid ? null : `${label} invalido o con formato incorrecto`,
  }
}

export function buildIdentityFields(params: {
  country: DocumentCountryCode
  type: DocumentTypeCode
  number: string
}) {
  const result = validateDocument({
    country: params.country,
    type: params.type,
    value: params.number,
  })

  return {
    documentCountry: params.country,
    documentType: params.type,
    documentNumber: result.formatted || result.normalized,
    documentNumberNormalized: result.normalized,
    rut: params.country === 'CL' && params.type === 'RUT' ? result.normalized : null,
  }
}

export function getUserIdentity(user: {
  rut?: string | null
  documentType?: string | null
  documentNumber?: string | null
  documentNumberNormalized?: string | null
}) {
  const label = getDocumentLabel(user.documentType ?? (user.rut ? 'RUT' : null))
  const value = user.documentNumber ?? user.documentNumberNormalized ?? user.rut ?? null

  return { label, value }
}
