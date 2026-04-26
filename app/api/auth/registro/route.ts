import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { z } from 'zod'
import {
  buildIdentityFields,
  DOCUMENT_COUNTRY_VALUES,
  DOCUMENT_TYPE_VALUES,
  type DocumentCountryCode,
  type DocumentTypeCode,
  validateDocument,
} from '@/lib/identity-documents'
import { getResendFrom } from '@/lib/resend-from'

type PrismaErrorLike = {
  code?: string
  meta?: {
    target?: string | string[]
  }
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  rut: z.string().optional(),
  documentCountry: z.enum(DOCUMENT_COUNTRY_VALUES).optional(),
  documentType: z.enum(DOCUMENT_TYPE_VALUES).optional(),
  documentNumber: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['LANDLORD', 'TENANT', 'BROKER']),
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Debes aceptar los terminos',
  }),
  company: z.string().trim().optional(),
})

function resolveIdentityInput(data: z.infer<typeof schema>) {
  if (data.documentCountry && data.documentType && data.documentNumber) {
    return {
      country: data.documentCountry as DocumentCountryCode,
      type: data.documentType as DocumentTypeCode,
      number: data.documentNumber,
    }
  }

  if (data.rut) {
    return {
      country: 'CL' as const,
      type: 'RUT' as const,
      number: data.rut,
    }
  }

  throw new z.ZodError([
    {
      code: z.ZodIssueCode.custom,
      path: ['documentNumber'],
      message: 'Debes ingresar un documento de identificacion',
    },
  ])
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const identityInput = resolveIdentityInput(data)
    const identityValidation = validateDocument({
      country: identityInput.country,
      type: identityInput.type,
      value: identityInput.number,
    })

    if (!identityValidation.isValid) {
      return NextResponse.json(
        { error: identityValidation.message ?? 'Documento invalido' },
        { status: 400 }
      )
    }

    const identityFields = buildIdentityFields(identityInput)

    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (exists) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    const identityExists = await prisma.user.findFirst({
      where: {
        documentCountry: identityFields.documentCountry,
        documentType: identityFields.documentType,
        documentNumberNormalized: identityFields.documentNumberNormalized,
      },
      select: { id: true },
    })

    if (identityExists) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este documento' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        ...identityFields,
        phone: data.phone,
        company: data.role === 'BROKER' ? data.company || null : null,
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
      },
      select: { id: true, email: true, name: true, role: true },
    })

    await prisma.verificationToken.deleteMany({
      where: { identifier: data.email },
    })

    const verifyToken = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.verificationToken.create({
      data: {
        identifier: data.email,
        token: verifyToken,
        expires,
      },
    })

    if (resend) {
      const emailResult = await resend.emails.send({
        from: getResendFrom(),
        to: data.email,
        subject: `${verifyToken} - Codigo de verificacion NeiFe`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#1C1917;padding:32px;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-size:20px;font-weight:700;color:#D5C3B6;letter-spacing:0.05em;">NeiFe</span>
            </div>
            <h2 style="color:#FAF6F2;margin:0 0 8px;font-size:20px;">Verifica tu cuenta</h2>
            <p style="color:#9C8578;margin:0 0 28px;font-size:14px;">Hola ${data.name}, usa este codigo para activar tu cuenta:</p>
            <div style="background:#2D3C3C;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;border:1px solid rgba(213,195,182,0.15);">
              <span style="font-size:40px;font-weight:700;color:#5E8B8C;letter-spacing:0.3em;">${verifyToken}</span>
              <p style="color:#9C8578;font-size:12px;margin:8px 0 0;">Valido por 24 horas</p>
            </div>
            <p style="color:#9C8578;font-size:12px;text-align:center;">Si no creaste esta cuenta, ignora este email.</p>
          </div>
        `,
      })

      if (emailResult.error) {
        console.error('Email send error:', emailResult.error)

        await prisma.verificationToken.deleteMany({
          where: { identifier: data.email },
        })

        await prisma.user.delete({
          where: { id: user.id },
        })

        return NextResponse.json(
          {
            error:
              'No se pudo enviar el correo de verificacion. Revisa RESEND_FROM, el dominio verificado en Resend y vuelve a intentarlo.',
          },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { user, requiresVerification: !!resend },
      { status: 201 }
    )
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

    if (prismaError?.code === 'P2002') {
      if (duplicateFields.includes('email')) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 409 }
        )
      }

      if (duplicateFields.includes('rut')) {
        return NextResponse.json(
          { error: 'Ya existe una cuenta registrada con este documento' },
          { status: 409 }
        )
      }

      if (
        duplicateFields.includes('documentCountry') ||
        duplicateFields.includes('documentType') ||
        duplicateFields.includes('documentNumberNormalized')
      ) {
        return NextResponse.json(
          { error: 'Ya existe una cuenta registrada con este documento' },
          { status: 409 }
        )
      }
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta' },
      { status: 500 }
    )
  }
}
