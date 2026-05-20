import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type DateValue = Date | string | number | null | undefined

type DateFormatOptions = Intl.DateTimeFormatOptions & {
  fallback?: string
}

function coerceDate(value: DateValue) {
  if (value == null) return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateCompact(date: DateValue, options?: DateFormatOptions) {
  const safeDate = coerceDate(date)
  if (!safeDate) return options?.fallback ?? 'No disponible'

  const { fallback: _fallback, ...intlOptions } = options ?? {}

  return safeDate.toLocaleDateString('es-CL', {
    timeZone: 'UTC',
    ...intlOptions,
  })
}

export function formatDateLong(date: DateValue, options?: DateFormatOptions) {
  const safeDate = coerceDate(date)
  if (!safeDate) return options?.fallback ?? 'No disponible'

  const { fallback: _fallback, ...intlOptions } = options ?? {}

  return safeDate.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    ...intlOptions,
  })
}
