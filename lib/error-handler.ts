/**
 * Error handling utilities for consistent user feedback
 */

export interface ApiError {
  status?: number
  message?: string
  error?: string | string[]
}

export function getErrorMessage(error: any, defaultMessage: string = "Error al cargar datos"): string {
  // If error is already a string, return it
  if (typeof error === 'string') {
    return error
  }

  // If error has a message property
  if (error?.message) {
    return error.message
  }

  // If error has an error property (could be string or array)
  if (error?.error) {
    if (Array.isArray(error.error)) {
      return error.error.join(', ')
    }
    return error.error
  }

  // If we have a status code, provide specific feedback
  if (error?.status) {
    return getErrorMessageByStatus(error.status, defaultMessage)
  }

  // Fallback to default message
  return defaultMessage
}

function getErrorMessageByStatus(status: number, defaultMessage: string): string {
  switch (status) {
    case 400:
      return "La solicitud contiene datos inválidos. Por favor revisa la información e intenta nuevamente."
    case 401:
      return "Tu sesión expiró. Por favor inicia sesión nuevamente."
    case 403:
      return "No tienes permiso para realizar esta acción."
    case 404:
      return "El recurso solicitado no fue encontrado."
    case 429:
      return "Demasiadas solicitudes. Por favor espera unos minutos e intenta nuevamente."
    case 500:
      return "Error en el servidor. Por favor intenta más tarde."
    case 502:
      return "Servicio temporalmente no disponible. Por favor intenta más tarde."
    case 503:
      return "Servicio no disponible en este momento. Por favor intenta más tarde."
    default:
      if (status >= 500) {
        return "No se pudo conectar. Verifica tu conexión e intenta de nuevo."
      }
      return defaultMessage
  }
}

export function handleApiError(response: Response, defaultMessage?: string): string {
  if (response.ok) return ""
  
  const status = response.status
  return getErrorMessageByStatus(status, defaultMessage || "Error al cargar datos")
}
