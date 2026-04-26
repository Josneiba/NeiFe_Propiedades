import type { DefaultSession } from 'next-auth'
import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      rut?: string | null
      documentCountry?: string | null
      documentType?: string | null
      documentNumber?: string | null
      documentNumberNormalized?: string | null
      phone?: string | null
      company?: string | null
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    rut?: string | null
    documentCountry?: string | null
    documentType?: string | null
    documentNumber?: string | null
    documentNumberNormalized?: string | null
    phone?: string | null
    company?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: Role
    name?: string | null
    rut?: string | null
    documentCountry?: string | null
    documentType?: string | null
    documentNumber?: string | null
    documentNumberNormalized?: string | null
    phone?: string | null
    company?: string | null
  }
}
