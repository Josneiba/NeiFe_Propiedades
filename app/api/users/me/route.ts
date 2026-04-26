import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  buildIdentityFields,
  DOCUMENT_COUNTRY_VALUES,
  DOCUMENT_TYPE_VALUES,
  type DocumentCountryCode,
  type DocumentTypeCode,
  validateDocument,
} from '@/lib/identity-documents'

type PrismaErrorLike = {
  code?: string
  meta?: {
    target?: string | string[]
  }
}

type IdentityUpdatePayload = {
  documentCountry: DocumentCountryCode | null
  documentType: DocumentTypeCode | null
  documentNumber: string | null
  documentNumberNormalized: string | null
  rut: string | null
}

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  rut: z.string().trim().optional(),
  documentCountry: z.enum(DOCUMENT_COUNTRY_VALUES).optional(),
  documentType: z.enum(DOCUMENT_TYPE_VALUES).optional(),
  documentNumber: z.string().trim().optional(),
  company: z.string().max(100).optional(),
  bankName: z.string().max(100).optional(),
  bankAccountType: z.string().max(50).optional(),
  bankAccountNumber: z.string().max(50).optional(),
  bankEmail: z.string().email().optional(),
  onboardingDone: z.boolean().optional(),
})

function resolveIdentityUpdate(data: z.infer<typeof updateProfileSchema>) {
  if (
    data.documentCountry !== undefined ||
    data.documentType !== undefined ||
    data.documentNumber !== undefined
  ) {
    if (!data.documentCountry || !data.documentType || !data.documentNumber) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ['documentNumber'],
          message: 'Completa pais, tipo y numero de documento',
        },
      ])
    }

    return {
      country: data.documentCountry as DocumentCountryCode,
      type: data.documentType as DocumentTypeCode,
      number: data.documentNumber,
    }
  }

  if (data.rut !== undefined) {
    if (data.rut.trim() === '') return null

    return {
      country: 'CL' as const,
      type: 'RUT' as const,
      number: data.rut,
    }
  }

  return undefined
}

// GET — obtener datos del usuario actual
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        documentCountry: true,
        documentType: true,
        documentNumber: true,
        documentNumberNormalized: true,
        avatar: true,
        company: true,
        bankName: true,
        bankAccountType: true,
        bankAccountNumber: true,
        bankEmail: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos del usuario' },
      { status: 500 }
    )
  }
}

// PATCH — actualizar perfil e información bancaria
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateProfileSchema.parse(body)
    const identityUpdate = resolveIdentityUpdate(data)

    let identityFields: IdentityUpdatePayload | undefined

    if (identityUpdate !== undefined) {
      if (identityUpdate === null) {
        identityFields = {
          documentCountry: null,
          documentType: null,
          documentNumber: null,
          documentNumberNormalized: null,
          rut: null,
        }
      } else {
        const identityValidation = validateDocument({
          country: identityUpdate.country,
          type: identityUpdate.type,
          value: identityUpdate.number,
        })

        if (!identityValidation.isValid) {
          return NextResponse.json(
            { error: identityValidation.message ?? 'Documento invalido' },
            { status: 400 }
          )
        }

        identityFields = buildIdentityFields(identityUpdate)
      }
    }

    if (identityFields && identityFields.documentNumberNormalized) {
      const existingDocument = await prisma.user.findFirst({
        where: {
          documentCountry: identityFields.documentCountry,
          documentType: identityFields.documentType,
          documentNumberNormalized: identityFields.documentNumberNormalized,
          id: { not: session.user.id },
        },
        select: { id: true },
      })

      if (existingDocument) {
        return NextResponse.json(
          { error: 'Ya existe una cuenta registrada con este documento' },
          { status: 409 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phone: data.phone,
        company: data.company,
        bankName: data.bankName,
        bankAccountType: data.bankAccountType,
        bankAccountNumber: data.bankAccountNumber,
        bankEmail: data.bankEmail,
        onboardingDone: data.onboardingDone,
        ...(identityFields ?? {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        documentCountry: true,
        documentType: true,
        documentNumber: true,
        documentNumberNormalized: true,
        company: true,
        bankName: true,
        bankAccountType: true,
        bankAccountNumber: true,
        bankEmail: true,
      },
    })

    return NextResponse.json({ user, message: 'Perfil actualizado correctamente' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Datos invalidos' },
        { status: 400 }
      )
    }

    const prismaError = error as PrismaErrorLike | null
    const duplicateTarget = prismaError?.meta?.target
    const duplicateFields =
      typeof duplicateTarget === 'string'
        ? [duplicateTarget]
        : Array.isArray(duplicateTarget)
          ? duplicateTarget
          : []

    if (prismaError?.code === 'P2002' && duplicateFields.includes('rut')) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este documento' },
        { status: 409 }
      )
    }

    if (
      prismaError?.code === 'P2002' &&
      (
        duplicateFields.includes('documentCountry') ||
        duplicateFields.includes('documentType') ||
        duplicateFields.includes('documentNumberNormalized')
      )
    ) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este documento' },
        { status: 409 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    )
  }
}
