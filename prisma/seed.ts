import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('demo1234', 12)

    // OWNER / LANDLORD demo
    const owner = await prisma.user.upsert({
      where: { email: 'owner@neife.cl' },
      update: {},
      create: {
        email: 'owner@neife.cl',
        name: 'Carlos Mendoza',
        password: hashedPassword,
        role: 'OWNER',
        rut: '12345678-5',
        documentCountry: 'CL',
        documentType: 'RUT',
        documentNumber: '12.345.678-5',
        documentNumberNormalized: '12345678-5',
        phone: '+56 9 8765 4321',
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
        onboardingDone: false,
      },
    })

    // TENANT 1
    const tenant1 = await prisma.user.upsert({
      where: { email: 'tenant1@neife.cl' },
      update: {},
      create: {
        email: 'tenant1@neife.cl',
        name: 'María González',
        password: hashedPassword,
        role: 'TENANT',
        rut: '15678901-1',
        documentCountry: 'CL',
        documentType: 'RUT',
        documentNumber: '15.678.901-1',
        documentNumberNormalized: '15678901-1',
        phone: '+56 9 1234 5678',
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
      },
    })

    // TENANT 2
    const tenant2 = await prisma.user.upsert({
      where: { email: 'tenant2@neife.cl' },
      update: {},
      create: {
        email: 'tenant2@neife.cl',
        name: 'Pedro Soto',
        password: hashedPassword,
        role: 'TENANT',
        rut: '16789012-1',
        documentCountry: 'CL',
        documentType: 'RUT',
        documentNumber: '16.789.012-1',
        documentNumberNormalized: '16789012-1',
        phone: '+56 9 9876 5432',
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
      },
    })

    // PROPIEDAD 1 — Providencia
    const prop1 = await prisma.property.upsert({
      where: { tenantId: tenant1.id },
      update: {},
      create: {
        name: 'Depto Providencia',
        address: 'Av. Providencia 1234, Depto 501',
        commune: 'Providencia',
        bedrooms: 2,
        bathrooms: 1,
        squareMeters: 65,
        lat: -33.43,
        lng: -70.6150,
        landlordId: owner.id,
        tenantId: tenant1.id,
        contractStart: new Date('2024-01-15'),
        contractEnd: new Date('2025-12-15'),
        monthlyRentUF: 12.5,
        monthlyRentCLP: 450000,
      },
    })

    // PROPIEDAD 2 — Ñuñoa
    const prop2 = await prisma.property.upsert({
      where: { tenantId: tenant2.id },
      update: {},
      create: {
        name: 'Casa Ñuñoa',
        address: 'Los Leones 567, Casa 12',
        commune: 'Ñuñoa',
        bedrooms: 3,
        bathrooms: 2,
        squareMeters: 90,
        lat: -33.4569,
        lng: -70.5990,
        landlordId: owner.id,
        tenantId: tenant2.id,
        contractStart: new Date('2024-03-01'),
        contractEnd: new Date('2025-09-01'),
        monthlyRentUF: 18.0,
        monthlyRentCLP: 650000,
      },
    })

    // PAGOS — últimos 6 meses prop1
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    for (let i = 5; i >= 1; i--) {
      let month = currentMonth - i
      let year = currentYear
      if (month <= 0) {
        month += 12
        year -= 1
      }

      await prisma.payment.upsert({
        where: {
          propertyId_month_year: { propertyId: prop1.id, month, year },
        },
        update: {},
        create: {
          propertyId: prop1.id,
          month,
          year,
          amountUF: 12.5,
          amountCLP: 450000,
          status: 'PAID',
          method: 'transfer',
          paidAt: new Date(year, month - 1, 5),
        },
      })
    }

    // Pago del mes actual — pendiente
    await prisma.payment.upsert({
      where: {
        propertyId_month_year: {
          propertyId: prop1.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {},
      create: {
        propertyId: prop1.id,
        month: currentMonth,
        year: currentYear,
        amountUF: 12.5,
        amountCLP: 450000,
        status: 'PENDING',
      },
    })

    // SERVICIOS — últimos 3 meses
    for (let i = 3; i >= 1; i--) {
      let month = currentMonth - i
      let year = currentYear
      if (month <= 0) {
        month += 12
        year -= 1
      }

      await prisma.monthlyService.upsert({
        where: {
          propertyId_month_year: { propertyId: prop1.id, month, year },
        },
        update: {},
        create: {
          propertyId: prop1.id,
          month,
          year,
          water: 13000 + Math.floor(Math.random() * 4000),
          electricity: 18000 + Math.floor(Math.random() * 8000),
        },
      })
    }

    // MANTENCIÓN activa
    const maintenance = await prisma.maintenanceRequest.create({
      data: {
        propertyId: prop1.id,
        requesterId: tenant1.id,
        category: 'PLUMBING',
        description: 'Fuga de agua en la cocina bajo el lavaplatos',
        photos: [],
        isLandlordResp: true,
        legalReference: 'Art. 1924 Código Civil — Obligaciones del arrendador',
        status: 'APPROVED',
        timeline: {
          create: [
            {
              status: 'REQUESTED',
              note: 'Solicitud recibida',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
            {
              status: 'REVIEWING',
              note: 'En revisión por el arrendador',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              status: 'APPROVED',
              note: 'Aprobada. Se asignará plomero.',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      },
    })

    // PROVEEDOR
    await prisma.provider.create({
      data: {
        name: 'Juan Herrera',
        specialty: 'PLUMBER',
        phone: '+56 9 5555 1234',
        email: 'juan.herrera@gmail.com',
        description: 'Plomero certificado con 15 años de experiencia',
        rating: 4.8,
        landlordId: owner.id,
      },
    })

    // Usuario corredor demo
    const corredor = await prisma.user.upsert({
      where: { email: 'corredor@neife.cl' },
      update: {},
      create: {
        email: 'corredor@neife.cl',
        name: 'Rodrigo Campos',
        password: hashedPassword,  // mismo hash que los otros: demo1234
        role: 'BROKER',
        rut: '18234567-9',
        documentCountry: 'CL',
        documentType: 'RUT',
        documentNumber: '18.234.567-9',
        documentNumberNormalized: '18234567-9',
        phone: '+56 9 7654 3210',
        company: 'Campos Propiedades',
        privacyAccepted: true,
        privacyAcceptedAt: new Date(),
        onboardingDone: true,
      },
    })

    // Mandato de prueba: corredor gestiona prop1 (Providencia)
    // Solo crear si prop1 existe y no tiene mandato activo
    const existingMandate = await prisma.mandate.findFirst({
      where: { propertyId: prop1.id, status: 'ACTIVE' }
    })

    if (!existingMandate) {
      await prisma.mandate.create({
        data: {
          propertyId: prop1.id,
          ownerId: owner.id,
          brokerId: corredor.id,
          status: 'ACTIVE',
          signedByOwner: true,
          signedByBroker: true,
          ownerSignedAt: new Date(),
          brokerSignedAt: new Date(),
          startsAt: new Date(),
        },
      })

      // Actualizar managedBy en la propiedad
      await prisma.property.update({
        where: { id: prop1.id },
        data: { managedBy: corredor.id }
      })
    }

    // NOTIFICACIONES de ejemplo
    await prisma.notification.createMany({
      data: [
        {
          userId: owner.id,
          type: 'PAYMENT_DUE',
          title: 'Pago próximo a vencer',
          message: 'María González tiene un pago pendiente para este mes',
          link: '/dashboard/pagos',
          isRead: false,
        },
        {
          userId: owner.id,
          type: 'MAINTENANCE_NEW',
          title: 'Nueva solicitud de mantención',
          message: 'Fuga de agua reportada en Depto Providencia',
          link: '/dashboard/mantenciones',
          isRead: true,
        },
      ],
    })

    console.log('✅ Seed completado — NeiFe lista para usar')
    console.log('📧 Cuentas demo:')
    console.log('   owner@neife.cl   / demo1234  → Arrendador')
    console.log('   tenant1@neife.cl / demo1234  → Arrendatario Providencia')
    console.log('   tenant2@neife.cl / demo1234  → Arrendatario Ñuñoa')
    console.log('   corredor@neife.cl / demo1234  → /broker    (corredor)')

  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(console.error)
