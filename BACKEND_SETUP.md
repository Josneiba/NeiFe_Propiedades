# 🎯 NeiFe Backend - Guía de Implementación Completa

**Estado:** Infraestructura 100% completada. Páginas de datos: 3/11 refactorizadas.

---

## ✅ LO QUE YA FUNCIONA

### Base de Datos & Auth

- ✅ **Schema Prisma** completo con 16 modelos (User, Property, Payment, Maintenance, Notification, etc.)
- ✅ **NextAuth v5** con JWT + Credentials provider
- ✅ **Middleware** protege rutas por rol (TENANT vs LANDLORD/OWNER)
- ✅ **Prisma Adapter** para tokens y sesiones

### API Routes (18 endpoints)

- ✅ `/api/auth/[...nextauth]` - NextAuth handler
- ✅ `/api/auth/registro` - Crear cuenta nueva con bcrypt
- ✅ `/api/properties` - GET/POST propiedades
- ✅ `/api/properties/[id]` - GET/PUT/DELETE propiedad
- ✅ `/api/payments` - GET/POST pagos con filtros
- ✅ `/api/payments/[id]` - PATCH actualizar estado + notificaciones
- ✅ `/api/services` - GET/POST servicios básicos mensuales
- ✅ `/api/services/upload` - POST subir boletas a Cloudinary
- ✅ `/api/maintenance` - GET/POST solicitudes con referencia legal
- ✅ `/api/maintenance/[id]` - PATCH con timeline + asignación provider
- ✅ `/api/invitations` - POST crear + **enviar email Resend** ✅ (IMPLEMENTADO)
- ✅ `/api/invitations/[token]` - GET verify + POST aceptar
- ✅ `/api/notifications` - GET lista + PATCH marcar leídas
- ✅ `/api/notifications/stream` - GET SSE tiempo real
- ✅ `/api/providers` - GET/POST listar/crear
- ✅ `/api/providers/[id]` - GET/PUT/DELETE ✅ (COMPLETADO)
- ✅ `/api/upload` - POST general upload a Cloudinary
- ✅ `/api/dashboard/stats` - GET KPIs reales del mes

### Páginas Refactorizadas

- ✅ **app/login/page.tsx** - Con signIn de NextAuth + demo buttons
- ✅ **app/registro/page.tsx** - Crea cuenta + auto-login
- ✅ **app/dashboard/page.tsx** - Server Component con datos Prisma reales, sin mock data

### Frontend

- ✅ **SessionProvider** en app/providers.tsx + Toaster + ThemeProvider
- ✅ **Middleware.ts** redirige según rol automáticamente
- ✅ **Variables de entorno** listas en .env.local

### Data Seed

- ✅ **prisma/seed.ts** con usuarios demo + propiedades + pagos + mantención
- ✅ Cuentas para testear:
  - `owner@neife.cl` / `demo1234` → Dashboard (OWNER role)
  - `tenant1@neife.cl` / `demo1234` → Mi Arriendo (TENANT role)
  - `tenant2@neife.cl` / `demo1234` → Mi Arriendo (TENANT role)

---

## 🔧 SETUP INICIAL (PRIMERO)

### 1. Base de Datos (Neon PostgreSQL)

```bash
# 1. Crea DB en https://neon.tech
# 2. Copia el connection string
# 3. Actualiza en .env.local:
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# 4. Corre la migración
npx prisma migrate dev --name init

# 5. Seed con datos demo
npx prisma db seed
```

### 2. Claves de APIs (Opcionales para emails/uploads)

```env
# Resend (para invitaciones por email)
RESEND_API_KEY="re_xxx"

# Cloudinary (para upload de boletas/fotos)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Correr la aplicación

```bash
pnpm dev
# Abre http://localhost:3000
# Login: owner@neife.cl / demo1234
```

---

## 📋 REFACTORIZAR PÁGINAS RESTANTES

### Patrón Simple (Copy & Paste)

❌ **ANTES** (Client Component con mock data):

```typescript
"use client"
const mockData = [...]

export default function Page() {
  return <div>{mockData.map(...)}</div>
}
```

✅ **DESPUÉS** (Server Component con datos reales):

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Fetch datos reales
  const data = await prisma.model.findMany({
    where: { landlordId: session.user.id },
    include: { /* relaciones */ }
  })

  return <div>{data.map(...)}</div>
}
```

### Lista de Páginas - Refactorizar en Este Orden

#### 1. Dashboard Pages

- [ ] **dashboard/pagos/page.tsx**

  ```
  Remove: const properties = [...], const paymentHistory = [...]
  Add: await prisma.payment.findMany({ where: {...}, include: {property} })
  Query filters from searchParams: propertyId, status, month, year
  ```

- [ ] **dashboard/propiedades/page.tsx**

  ```
  Remove: const properties = [...internal mock data...]
  Add: await prisma.property.findMany({
    where: { landlordId: session.user.id },
    include: { tenant, payments, _count: { maintenance } }
  })
  ```

- [ ] **dashboard/mantenciones/page.tsx**

  ```
  Remove: const maintenanceRequests = [...]
  Add: await prisma.maintenanceRequest.findMany({
    where: { property: { landlordId: session.user.id } },
    include: { timeline, provider, property }
  })
  Modal para asignar provider desde /api/providers
  ```

- [ ] **dashboard/proveedores/page.tsx**
  ```
  Remove: const providers = [...]
  Add: await prisma.provider.findMany({
    where: { landlordId: session.user.id, isActive: true }
  })
  Botón "Agregar" → fetch POST /api/providers
  ```

#### 2. Tenant Pages (Mi Arriendo)

- [ ] **mi-arriendo/page.tsx**

  ```
  Remove: const propertyInfo = {...}, const currentMonthPayment = {...}
  Add:
    const property = await prisma.property.findFirst({
      where: { tenantId: session.user.id },
      include: { landlord, services, maintenance }
    })
  ```

- [ ] **mi-arriendo/pagos/page.tsx**

  ```
  Remove: const paymentHistory = [...]
  Add: await prisma.payment.findMany({
    where: { property: { tenantId: session.user.id } },
    orderBy: { year: 'desc', month: 'desc' }
  })
  Botón "Pagar" → fetch PATCH /api/payments/[id] con status PAID
  ```

- [ ] **mi-arriendo/servicios/page.tsx**

  ```
  Remove: const consumptionData = [...], const servicesHistory = [...]
  Add: await prisma.monthlyService.findMany({
    where: { property: { tenantId: session.user.id } },
    orderBy: { year: 'desc', month: 'desc' },
    take: 12
  })
  Las URLs de boletas (waterBillUrl, lightBillUrl) solo mostrar si existen
  ```

- [ ] **mi-arriendo/mantenciones/page.tsx**
  ```
  Remove: const maintenanceHistory = [...]
  Add: await prisma.maintenanceRequest.findMany({
    where: { property: { tenantId: session.user.id } },
    include: { timeline, provider }
  })
  Form → fetch POST /api/maintenance con fotos
  ```

---

## 🎨 COMPONENTES QUE NECESITAN ISLOADING

Algunos componentes ya tienen handlers que esperan una respuesta:

- ✅ `payment-modal.tsx` - onChange de "Pagar"
- ✅ `responsive-table.tsx` - botones de acción
- ✅ `sidebar.tsx` - notificaciones SSE

Agregar estados loading/error en los formularios:

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async (id: string) => {
  setIsLoading(true);
  try {
    const res = await fetch(`/api/endpoint/${id}`, { method: "PATCH" });
    if (res.ok) toast.success("Actualizado");
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🧪 TESTING - Casos Clave

### 1. Login & Auth

```
✓ owner@neife.cl/demo1234 → /dashboard
✓ tenant1@neife.cl/demo1234 → /mi-arriendo
✓ Acceso cruzado bloqueado (TENANT intenta /dashboard → redirige a /mi-arriendo)
```

### 2. Propiedades

```
✓ Arrendador ve sus 2 propiedades (prop1, prop2)
✓ Pagos muestran estado real (PAID, PENDING)
✓ Mantenciones muestran con legal reference
```

### 3. Pagos

```
✓ Listar con filtros: propertyId, status, month, year
✓ Marcar como PAID crea Notification al arrendador
✓ createNotification(landlordId, 'PAYMENT_RECEIVED', ...) funciona
```

### 4. Invitaciones

```
✓ POST /api/invitations envía email vía Resend ✅
✓ Token expira en 7 días
✓ GET /invitacion/[token] verifica y puede ser aceptada
✓ POST /api/invitations/[token] actualiza tenantId de property
```

---

## 📚 Referencias Rápidas

### Zod (Validación)

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["LANDLORD", "TENANT"]),
});
const data = schema.parse(body); // Lanza error si no válido
```

### Prisma Query Patterns

```typescript
// Criar con relación
await prisma.maintenanceRequest.create({
  data: {
    requesterId: session.user.id,
    propertyId,
    category: "PLUMBING",
    timeline: { create: [{ status: "REQUESTED", note: "..." }] },
  },
  include: { timeline: true },
});

// Actualizar e incluir datos relacionados
await prisma.property.update({
  where: { id: propertyId },
  data: { tenantId: receiverId },
  include: { tenant: true },
});
```

### NextAuth (Session)

```typescript
const session = await auth();
const userId = session.user.id;
const role = session.user.role; // OWNER, LANDLORD, TENANT
```

### Notificaciones (Helper)

```typescript
import { createNotification } from "@/lib/notifications";

await createNotification(
  userId,
  "PAYMENT_RECEIVED",
  "Pago procesado",
  `María González pagó su arriendo`,
  "/dashboard/pagos",
);
```

---

## ⚠️ ERRORES COMUNES

| Error                                 | Solución                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| "session is null"                     | Verificar que la página redirige a /login si no hay session                                       |
| "Cannot access property of undefined" | Usar `?.` optional chaining: `user?.name`                                                         |
| "Prisma client not initialized"       | Importar `import { prisma } from '@/lib/prisma'`                                                  |
| "Unauthorized"                        | Verificar que la condición de propiedad es correcta: `where: { id, landlordId: session.user.id }` |
| "Column not found in database"        | Correr `npx prisma migrate dev` después de cambios al schema                                      |

---

## 🚀 CHECKLIST ANTES DE SHIP

- [ ] Todas las páginas de dashboard refactorizadas
- [ ] Todas las páginas de mi-arriendo refactorizadas
- [ ] DATABASE_URL + DIRECT_URL en .env.local con Neon real
- [ ] RESEND_API_KEY en .env.local (para emails reales)
- [ ] CLOUDINARY credentials en .env.local (para uploads reales)
- [ ] `npx prisma db seed` ejecutado con datos reales
- [ ] Login con demo accounts funciona → dashboard/mi-arriendo
- [ ] Pagos se pueden crear/actualizar
- [ ] Mantenciones se pueden solicitar
- [ ] Invitaciones se pueden enviar (y email llega)
- [ ] Sidebar muestra notificaciones reales

---

**Próximos pasos:** Refactorizar siguiendo el patrón las 8 páginas restantes.  
**Contacto:** Si algo no compila, revisar imports de prisma y auth.
