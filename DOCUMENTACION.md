# Neife - Plataforma de Gestión de Arriendos

## Descripción General

Neife es una plataforma SaaS completa para la gestión integral de arriendos en Chile. Elimina intermediarios y digitaliza todo el proceso entre arrendadores y arrendatarios, cumpliendo con la legislación chilena vigente (Ley 18.101 y Ley 21.461).

---

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui
- **Fuentes**: DM Sans (body) + Playfair Display (headings)
- **Gráficos**: Recharts

---

## Estructura de Archivos

```
/app
├── page.tsx                          # Landing page
├── layout.tsx                        # Layout principal con fuentes
├── globals.css                       # Design system y tokens CSS
├── login/page.tsx                    # Página de inicio de sesión
├── registro/page.tsx                 # Página de registro con selección de rol
├── dashboard/                        # Panel del Arrendador
│   ├── layout.tsx
│   ├── page.tsx                      # Dashboard principal
│   ├── propiedades/
│   │   ├── page.tsx                  # Lista de propiedades
│   │   └── [id]/page.tsx             # Detalle de propiedad
│   ├── pagos/page.tsx                # Gestión de pagos
│   ├── mantenciones/page.tsx         # Gestión de mantenciones
│   ├── contratos/page.tsx            # Gestión de contratos
│   ├── proveedores/page.tsx          # Red de proveedores
│   └── configuracion/page.tsx        # Configuración de cuenta
└── mi-arriendo/                      # Panel del Arrendatario
    ├── layout.tsx
    ├── page.tsx                      # Resumen del arriendo
    ├── pagos/page.tsx                # Historial y pago
    ├── servicios/page.tsx            # Servicios básicos
    ├── mantenciones/page.tsx         # Reportar y seguir mantenciones
    ├── contrato/page.tsx             # Ver contrato digital
    └── contactos/page.tsx            # Contactos importantes

/components
├── layout/
│   └── sidebar.tsx                   # Sidebar adaptable por rol
├── charts/
│   └── contract-progress.tsx         # Gráfico de progreso de contrato
└── payment/
    └── payment-modal.tsx             # Modal de pago con opciones
```

---

## Design System

### Paleta de Colores

| Token | Color | Uso |
|-------|-------|-----|
| `--neif-brown` | #75524C | Color primario (Arrendador) |
| `--neif-beige` | #D5C3B6 | Texto sobre colores oscuros |
| `--neif-teal` | #5E8B8C | Color de acento (Arrendatario) |
| `--neif-rose` | #C27F79 | Estados de alerta/pendiente |
| `--neif-yellow` | #F2C94C | Estados en proceso |
| `--neif-green` | #2D3C3C | Backgrounds oscuros |

### Tipografía

- **Headings**: Playfair Display (serif elegante)
- **Body**: DM Sans (sans-serif moderna y legible)

---

## Módulos Implementados

### 1. Landing Page (`/`)
- Hero con propuesta de valor
- Grid de características (6 features)
- Sección de roles con beneficios
- Call-to-action final
- Footer con información legal

### 2. Autenticación
- **Login** (`/login`): Formulario con demo mode
- **Registro** (`/registro`): Selección de rol + formulario

### 3. Panel Arrendador (`/dashboard/*`)

| Página | Funcionalidades |
|--------|-----------------|
| Dashboard | KPIs, grid de propiedades, progreso de contratos |
| Propiedades | Lista con filtros, cards con estado de pago |
| Propiedad [id] | Detalle completo, acciones rápidas, historial |
| Pagos | Tabla de pagos, filtros por estado/propiedad |
| Mantenciones | Lista de tickets, estados (pendiente/en ejecución/completado) |
| Contratos | Lista con barra de progreso, estados, acciones |
| Proveedores | Red de proveedores con especialidades y ratings |
| Configuración | Perfil, notificaciones, seguridad |

### 4. Panel Arrendatario (`/mi-arriendo/*`)

| Página | Funcionalidades |
|--------|-----------------|
| Resumen | Alertas, estado del mes, acciones rápidas |
| Pagos | Historial, modal de pago con opciones |
| Servicios | Consumo de agua, luz, gas con gráficos |
| Mantenciones | Reportar fallas, seguimiento de tickets |
| Contrato | Visualización del contrato, descarga PDF |
| Contactos | Arrendador, administración, emergencias |

---

## Componentes Reutilizables

### Sidebar (`components/layout/sidebar.tsx`)
- Adaptable por rol (arrendador/arrendatario)
- Responsive con menú hamburguesa en mobile
- Indicador de página activa
- Sección de usuario con rol badge

### ContractProgressChart (`components/charts/contract-progress.tsx`)
- Visualización circular del progreso del contrato
- Dos tamaños: small (para cards) y large (detalle)
- Cálculo automático de porcentaje transcurrido
- Muestra meses restantes

### PaymentModal (`components/payment/payment-modal.tsx`)
- Métodos de pago: Transferencia, Khipu, MercadoPago
- Desglose de montos (arriendo, servicios, total)
- Confirmación con estado de procesamiento

---

## Cumplimiento Legal

La plataforma está diseñada siguiendo:

1. **Ley 18.101**: Normas sobre arrendamiento de predios urbanos
2. **Ley 21.461 "Devuélveme mi casa"**: Procedimientos de restitución

---

## Próximos Pasos (No Implementados)

- [ ] Integración con base de datos (Supabase/Neon)
- [ ] Autenticación real con NextAuth
- [ ] Integración de pagos (Khipu, MercadoPago)
- [ ] Firma electrónica de contratos
- [ ] Notificaciones por email/SMS
- [ ] Reportes exportables (PDF, Excel)
- [ ] Sistema de mensajería interna

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo local
pnpm dev

# Build de producción
pnpm build

# Iniciar producción
pnpm start
```

---

## Demo

Para probar la plataforma:

1. Ir a `/login`
2. Usar `arrendador@demo.cl` para ver el panel de arrendador
3. Usar cualquier otro email para ver el panel de arrendatario

---

**Versión**: 1.0.0  
**Fecha**: Marzo 2025  
**Autor**: v0 by Vercel
