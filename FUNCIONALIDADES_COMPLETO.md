# 📋 FUNCIONALIDADES COMPLETAS - NeiFe Propiedades

**Documento de Análisis Técnico Profesional**  
_Última actualización: Abril 2026_

---

## 📑 Tabla de Contenidos

1. [Home Page](#-home-page)
2. [Dashboard del Arrendador](#-dashboard-del-arrendador-landlord)
3. [Dashboard del Arrendatario](#-dashboard-del-arrendatario-tenant)
4. [Dashboard del Corredor](#-dashboard-del-corredor-broker)
5. [Funcionalidades Globales](#-funcionalidades-globales)
6. [Resumen Ejecutivo](#-resumen-ejecutivo)

---

## 🏠 Home Page

### Descripción General

Landing page pública que presenta la plataforma NeiFe para gestión de arriendos sin intermediarios. Utiliza componentes reutilizables con tema oscuro personalizado y responsive design.

**Ruta**: `/`  
**Archivo**: `app/page.tsx`  
**Acceso**: Público (sin autenticación)

### Elementos Visuales

| Componente                 | Descripción                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **Header Navegable**       | Logo NeiFe, links a secciones (Arriendos, Características, Para quién, Mapa, Privacidad) |
| **CTA Principal**          | Botones "Iniciar Sesión" y "Registrarse" con rutas protegidas                            |
| **Hero Section**           | Descripción de propuesta de valor de la plataforma                                       |
| **Listado de Propiedades** | 6 propiedades destacadas con información básica                                          |

### Funcionalidades Principales

#### 1. **Presentación de Características (6 Features)**

- ✅ **Pagos Digitales** - Sistema de pagos automatizado y seguro
- ✅ **Contratos Digitales** - Contratos con firma electrónica válida legalmente
- ✅ **Mantenciones** - Reporte, asignación y seguimiento en tiempo real
- ✅ **Cumplimiento Legal** - Cumple Ley 18.101, 21.461, 19.628
- ✅ **Reportes y Gráficos** - Datos exportables a PDF/Excel
- ✅ **Proveedores de Confianza** - Red verificada de servicios

#### 2. **Badges de Compliance y Confianza**

```
Ley 18.101 (Contratos) | Ley 21.461 (Desalojo) | Ley 19.628 (Datos)
Firma Electrónica | Datos Seguros | Privacidad Garantizada
```

#### 3. **Secciones de Beneficios por Rol**

**Para Arrendadores:**

- Dashboard con KPIs en tiempo real
- Mapa interactivo de propiedades
- Gestión centralizada de proveedores
- Control de contratos digitales
- Reportes detallados de ingresos

**Para Arrendatarios:**

- Vista clara de pagos mensuales
- Acceso a servicios e historial
- Reporte fácil de mantenciones
- Acceso a contrato digital
- Historial de pagos y documentos

**Para Corredores:**

- Gestión de mandatos y seguimiento
- Acceso a propiedades de clientes
- Panel centralizado de contratos
- Control automático de comisiones
- Rendiciones mensuales

---

## 👨‍💼 Dashboard del Arrendador (LANDLORD)

### Descripción General

Centro de control centralizado para administración de propiedades en arriendo. Proporciona visibilidad total sobre arrendatarios, pagos, mantenciones y documentación legal.

**Ruta Base**: `/dashboard`  
**Acceso**: Solo usuarios con rol `LANDLORD` u `OWNER`  
**Validación**: Middleware de autenticación y autorización

### 📊 Página Principal (`/dashboard/page.tsx`)

#### KPIs en Tiempo Real

| KPI                           | Descripción                         | Datos Consultados                                    |
| ----------------------------- | ----------------------------------- | ---------------------------------------------------- |
| **Total Propiedades Activas** | Cantidad de propiedades en arriendo | Conteo de propiedades con tenant                     |
| **Total Recaudado Mes**       | Suma de pagos realizados (CLP + UF) | Pagos con estado PAID del mes actual                 |
| **Pagos Pendientes**          | Montos no pagados                   | Pagos con estado PENDING                             |
| **Mantenciones Activas**      | Solicitudes en proceso              | Estados: REQUESTED, REVIEWING, APPROVED, IN_PROGRESS |
| **Pagos Vencidos**            | Pagos atrasados                     | Estado OVERDUE                                       |

#### Visualizaciones

- **Gráfico de Tendencias Mensual** - Ingresos año completo con línea de tendencia
- **Saludo Contextual** - Buenos días/tardes/noches según hora
- **Listado de Propiedades Recientes** - Top 10 propiedades con información resumida

---

### 📍 Sección: Propiedades (`/dashboard/propiedades`)

#### Funcionalidades

**Listado Principal:**

- Vista de grid o tabla de todas las propiedades activas
- Estado dinámico de información
- Búsqueda integrada en tiempo real

**Campos de Búsqueda:**

- Dirección de propiedad
- Comuna/Región
- Nombre de propiedad
- Nombre de arrendatario
- Estado de pago

**Información Mostrada por Propiedad:**

```
┌─────────────────────────────────────────┐
│ Nombre Propiedad                        │
│ Dirección | Comuna                      │
│ Arrendatario: [Nombre]                  │
│ Arriendo Mensual: $[CLP]                │
│ Contrato: [Inicio] - [Fin]              │
│ Estado Pago Mes: [PAID/PENDING/OVERDUE] │
│ Progreso Contrato: [Gráfico %]          │
│ Mandatos: X corredor(es) asignado(s)    │
└─────────────────────────────────────────┘
```

**Acciones Disponibles:**
| Acción | Descripción |
|--------|-----------|
| **Nueva Propiedad** | Crear propiedad → `/dashboard/propiedades/nueva` |
| **Ver Detalles** | Editar información → `/dashboard/propiedades/[id]` |
| **Editar** | Modificar datos de propiedad |
| **Invitar Arrendatario** | Enviar invitación por email |
| **Solicitar Corredor** | Pedir acceso para corredores |

---

### 💳 Sección: Contratos (`/dashboard/contratos`)

#### Descripción

Gestión integral de contratos digitales cumpliendo con la legislación chilena. Incluye generación automática, firma electrónica y almacenamiento seguro.

#### Funcionalidades

| Función                    | Detalles                                                      |
| -------------------------- | ------------------------------------------------------------- |
| **Gestión de Contratos**   | Crear, ver, editar, eliminar contratos                        |
| **Filtrado por Propiedad** | Vista específica de contratos por inmueble                    |
| **Estados de Contrato**    | DRAFT, PENDING_SIGNATURE, SIGNED, ACTIVE, EXPIRED, TERMINATED |
| **Firma Electrónica**      | Generación y validación de firmas digitales                   |
| **Descarga PDF**           | Generación de documento PDF del contrato                      |
| **Historial de Versiones** | Rastreo de cambios y versiones anteriores                     |
| **Cumplimiento Legal**     | Validación automática según Ley 18.101                        |

#### Estructura de Contrato

```
Información del Contrato:
├── Datos del Arrendador
├── Datos del Arrendatario
├── Información de Propiedad
├── Fechas (Inicio, Fin)
├── Monto de Arriendo (CLP)
├── Términos y Condiciones
├── Firmas Digitales
│   ├── Firma Arrendador (sí/no, fecha)
│   └── Firma Arrendatario (sí/no, fecha)
└── Documento PDF
```

**Componente**: `ContractWorkspace` (compartido con BROKER)

---

### 💰 Sección: Pagos (`/dashboard/pagos`)

#### Funcionalidades

**Listado Completo de Pagos:**

- Visualización de todos los pagos de arrendatarios
- Tabla con scroll horizontal en móvil

**Filtros Avanzados:**

| Filtro                 | Opciones                                  |
| ---------------------- | ----------------------------------------- |
| **Por Propiedad**      | Todas / Seleccionar propiedad específica  |
| **Por Estado**         | ALL, PAID, PENDING, OVERDUE               |
| **Por Comportamiento** | Pagadores puntuales, ocasionales, morosos |

**Información de Pago por Fila:**

```
Mes/Año | Propiedad | Monto CLP | Monto UF | Estado | Método | Fecha Pago | Recibo
```

**Estados Posibles:**

- 🟢 **PAID** - Pagado correctamente
- 🟡 **PENDING** - Esperando pago
- 🔴 **OVERDUE** - Vencido, no pagado
- 🔵 **PROCESSING** - En revisión

**Acciones por Pago:**
| Acción | Descripción |
|--------|-----------|
| **Ver Detalles** | Información completa del pago |
| **Descargar Recibo** | Recibo en PDF (si está pagado) |
| **Marcar como Pagado** | Cambiar estado manualmente |
| **Ver Historial** | Intentos de pago y movimientos |
| **Registrar Pago Manual** | Agregar pago fuera del sistema |

---

### 🔧 Sección: Mantenciones (`/dashboard/mantenciones`)

#### Descripción

Gestión integral de solicitudes de mantenimiento con responsabilidades definidas por ley y asignación automática de proveedores.

#### Estados de Mantención

```
REQUESTED → REVIEWING → APPROVED → IN_PROGRESS → COMPLETED
                ↓
            REQUESTED_INFO (solicitar más datos)
                ↓
            REJECTED (rechazado)
```

#### Información de Solicitud

**Detalles Técnicos:**

- Categoría de mantención
- Propiedad afectada
- Arrendatario que reportó
- Proveedor asignado
- Fechas (creación, actualización, completación)
- Fotos y documentación (URL de Cloudinary)
- Responsabilidad legal según Ley 18.101

**Categorías Legales:**
| Categoría | Responsable | Descripción |
|-----------|-----------|-----------|
| 🔧 **Plomería** | Arrendador | Tuberías, grifos, desagües |
| ⚡ **Electricidad** | Arrendador | Circuitos, tomacorrientes, iluminación |
| 🏗️ **Estructura** | Arrendador | Paredes, techos, puertas |
| 📋 **Otro** | Caso a caso | Evaluar responsabilidad |

#### Acciones del Arrendador

| Acción                  | Descripción                      |
| ----------------------- | -------------------------------- |
| **Revisar Solicitudes** | Ver nuevas solicitudes con fotos |
| **Aprobar/Rechazar**    | Autorizar o denegar mantención   |
| **Asignar Proveedor**   | Seleccionar de red de confianza  |
| **Hacer Seguimiento**   | Ver estado en tiempo real        |
| **Agregar Comentarios** | Notas y comunicación             |
| **Marcar Completada**   | Confirmar finalización           |

---

### 📅 Sección: Calendario (`/dashboard/calendario`)

#### Funcionalidades

**Vista Interactiva de Eventos:**

- Calendario mes/semana/día
- Colores codificados por tipo de evento
- Información al pasar mouse

**Tipos de Eventos:**

| Tipo de Evento          | Código          | Descripción                   |
| ----------------------- | --------------- | ----------------------------- |
| 🔍 **INSPECTION**       | Inspección      | Visita programada a propiedad |
| 📈 **IPC**              | Ajuste IPC      | Revisión de índice de precios |
| 📊 **IPC_ADJUSTMENT**   | Ajuste Aplicado | IPC aplicado al arriendo      |
| 📋 **CONTRACT**         | Contrato        | Vencimiento de contrato       |
| 🔄 **CONTRACT_RENEWAL** | Renovación      | Renovación de contrato        |
| 💰 **PAYMENT**          | Pago Próximo    | Fecha de pago esperada        |
| ⏰ **PAYMENT_DUE**      | Pago Próximo    | Recordatorio de pago          |
| 🚨 **PAYMENT_OVERDUE**  | Pago Vencido    | Pago atrasado                 |
| 🔧 **MAINTENANCE**      | Mantención      | Trabajo de mantenimiento      |

**Acciones:**

- ✏️ Crear evento manual
- 🖊️ Editar evento
- 🗑️ Eliminar evento
- 📌 Ver detalles completos

---

### 🗺️ Sección: Mapa (`/dashboard/mapa`)

#### Funcionalidades

**Visualización Geográfica:**

- Mapa interactivo con todas las propiedades
- Marcadores georreferenciados
- Información emergente al hacer clic

**Información en Marcador:**

```
Nombre Propiedad
Dirección
Arriendo Mensual: $[CLP]
Estado Pago: [PAID/PENDING/OVERDUE]
Arrendatario: [Nombre]
```

**Estadísticas Superpuestas:**

- 📍 Total de propiedades: X
- 🟢 Propiedades pagadas este mes: X
- 🟡 Propiedades pendientes: X

**Tecnología**: Integración con servicio de geocoding

---

### 📊 Sección: Servicios Básicos (`/dashboard/servicios`)

#### Funcionalidades

**Registro de Consumo Mensual:**

| Servicio            | Unidad | Descripción                    |
| ------------------- | ------ | ------------------------------ |
| 💧 **Agua**         | m³     | Consumo de agua potable        |
| ⚡ **Electricidad** | kWh    | Consumo de energía eléctrica   |
| 🔥 **Gas**          | m³     | Consumo de gas natural/licuado |

**Acciones:**
| Acción | Descripción |
|--------|-----------|
| **Ver por Propiedad** | Servicios de propiedad específica |
| **Filtrar Período** | Mes/año específico |
| **Ver Tendencias** | Gráfico de consumo histórico |
| **Exportar Datos** | Descargar en CSV/Excel |
| **Subir Boletas** | Cargar comprobantes a Cloudinary |

**Visualización:**

- Tendencias de consumo mensual
- Comparación con períodos anteriores
- Alertas de consumo anómalo

---

### 👥 Sección: Proveedores (`/dashboard/proveedores`)

#### Descripción

Gestión de red de proveedores de servicios de confianza para mantenciones y servicios especializados.

#### Información de Proveedor

```
┌──────────────────────────────┐
│ Nombre Proveedor             │
│ Especialidad: [Categoría]    │
│ Teléfono: [Contacto]         │
│ Email: [Correo]              │
│ Descripción: [Info adicional]│
│ ⭐ Rating: [4.5/5]           │
│ 📊 Trabajos realizados: X    │
└──────────────────────────────┘
```

**Especialidades Disponibles:**

- 🔧 Plomería
- ⚡ Electricidad
- 🏗️ Estructura
- 🔐 Cerrajería
- 🪟 Vidriería
- 🎨 Pintura
- 👨‍🔧 Otros oficios

**Acciones:**

| Acción                       | Ruta                                  |
| ---------------------------- | ------------------------------------- |
| **Crear Proveedor**          | POST `/dashboard/proveedores/agregar` |
| **Ver Detalles**             | GET `/dashboard/proveedores/[id]`     |
| **Editar**                   | PUT `/dashboard/proveedores/[id]`     |
| **Eliminar**                 | DELETE `/dashboard/proveedores/[id]`  |
| **Ver Historial**            | GET historial de trabajos             |
| **Gestionar Especialidades** | Agregar/quitar especialidades         |

---

### ⚙️ Sección: Configuración (`/dashboard/configuracion`)

#### 👤 Perfil Personal

**Información Básica:**

```
Nombre Completo
Email (verificado)
Teléfono
Documento de Identidad
├── País
├── Tipo (Cédula, Pasaporte, RUT)
└── Número
RUT Chileno (validado)
```

**Información Bancaria:**

```
Nombre del Banco
Tipo de Cuenta (Corriente, Ahorro, etc.)
Número de Cuenta
Email Bancario
```

**Acciones:**

- ✏️ Editar información
- 📸 Actualizar foto de perfil
- ✅ Verificar email
- 🔄 Sincronizar datos

#### 🔒 Seguridad

**Opciones:**
| Opción | Descripción |
|--------|-----------|
| **Cambio de Contraseña** | Actualizar contraseña con verificación |
| **Verificación de Identidad** | Requiere contraseña actual |
| **Sesiones Activas** | Ver y cerrar sesiones remotas |
| **Autenticación de Dos Factores** | Activar (si implementado) |

---

### 🤝 Sección: Solicitudes de Acceso a Propiedades (`/dashboard/solicitudes-acceso-propiedades`)

#### Funcionalidades

**Descripción**: Recibir y gestionar solicitudes de corredores que desean acceder a propiedades para gestionar mandatos.

**Estado de Solicitud:**

- ⏳ **PENDING** - Esperando decisión del arrendador
- ✅ **APPROVED** - Acceso otorgado
- ❌ **REJECTED** - Acceso denegado

**Información de Solicitud:**

| Campo               | Descripción                           |
| ------------------- | ------------------------------------- |
| **Corredor**        | Nombre del broker solicitante         |
| **Email**           | Email de contacto del corredor        |
| **Empresa**         | Nombre de empresa (opcional)          |
| **Propiedad**       | Inmueble para el cual solicita acceso |
| **Fecha Solicitud** | Cuándo fue enviada                    |
| **Mensaje**         | Descripción de intención              |

**Acciones:**

- 👁️ Ver detalles completos
- ✅ Aprobar acceso
- ❌ Rechazar solicitud
- 📝 Agregar comentario

**Consecuencias:**

- **Aprobar**: Corredor obtiene permisos de lectura sobre propiedad y arrendatario
- **Rechazar**: Solicitud archivada, corredor notificado

---

### 📋 Sección: Solicitudes de Corredores (`/dashboard/solicitudes-corredores`)

#### Estructura de Dos Tabs

##### **Tab 1: Corredores (Broker Permissions)**

**Funcionalidades:**

- Gestionar permisos de brokers en el sistema
- Vista de solicitudes de partnership

**Información:**
| Campo | Descripción |
|-------|-----------|
| **Corredor** | Nombre del broker |
| **Estado** | PENDING, APPROVED, REJECTED |
| **Fecha Solicitud** | Cuándo se envió |
| **Propiedades Asignadas** | X propiedades |

**Acciones:**

- ✅ Crear nuevo permiso
- 📊 Ver estadísticas del broker
- 🗑️ Revocar acceso

##### **Tab 2: Propiedades (Property Access Requests)**

**Funcionalidades:**

- Vista agrupada por propiedad
- Todas las solicitudes de acceso a propiedad
- Filtrado por estado

**Información Agrupada:**

```
Propiedad A
├── Corredor 1 - Estado: PENDING
├── Corredor 2 - Estado: APPROVED
└── Corredor 3 - Estado: REJECTED

Propiedad B
├── Corredor 4 - Estado: PENDING
...
```

---

## 🏠 Dashboard del Arrendatario (TENANT)

### Descripción General

Interfaz simplificada para arrendatarios con acceso a información crítica sobre su arriendo, pagos, contrato y mantenciones.

**Ruta Base**: `/mi-arriendo`  
**Acceso**: Solo usuarios con rol `TENANT`  
**Validación**: Middleware de autenticación y autorización

### 📊 Página Principal (`/mi-arriendo/page.tsx`)

#### Información Central de Arriendo

```
┌────────────────────────────────────────┐
│ INFORMACIÓN DE MI ARRIENDO             │
├────────────────────────────────────────┤
│ Propiedad: [Dirección completa]        │
│ Arrendador: [Nombre]                   │
│ Arriendo Mensual: $[CLP] | [UF]        │
│ Fechas: [Inicio] - [Fin contrato]      │
└────────────────────────────────────────┘
```

#### Cards de Estado

**1. Pago Actual del Mes**

```
Estado: [PAID/PENDING/OVERDUE]
Monto a Pagar: $[CLP]
UF Equivalente: [X UF]
Fecha de Vencimiento: [DD/MM/YYYY]
```

Color dinámico según estado:

- 🟢 Verde si PAID
- 🟡 Amarillo si PENDING
- 🔴 Rojo si OVERDUE

**2. Servicios Básicos del Mes**

```
💧 Agua: $[CLP]
⚡ Electricidad: $[CLP]
🔥 Gas: $[CLP]
───────────────
Total: $[CLP]
```

**3. Últimos 3 Pagos Realizados**

```
[Mes/Año] | $[CLP] | [Fecha Pago]
[Mes/Año] | $[CLP] | [Fecha Pago]
[Mes/Año] | $[CLP] | [Fecha Pago]
```

**4. Últimas 3 Mantenciones Reportadas**

```
[Categoría] | Estado: [Estado] | [Fecha]
[Categoría] | Estado: [Estado] | [Fecha]
[Categoría] | Estado: [Estado] | [Fecha]
```

#### Acciones Rápidas (Botones de Navegación)

- 💰 Ir a Pagos
- 📋 Ver Contrato
- 🔧 Reportar Mantención

---

### 💰 Sección: Pagos (`/mi-arriendo/pagos`)

#### Funcionalidades

**Visualización Completa de Pagos:**

- Tabla de todos los pagos del arrendatario
- Filtros por período de tiempo
- Búsqueda

**Información por Pago:**

| Campo              | Descripción                        |
| ------------------ | ---------------------------------- |
| **Mes/Año**        | Período del pago                   |
| **Monto CLP**      | Cantidad en pesos chilenos         |
| **Monto UF**       | Equivalente en Unidades de Fomento |
| **Estado**         | PAID, PENDING, OVERDUE             |
| **Fecha de Pago**  | Cuándo se realizó (si pagado)      |
| **Método de Pago** | Transferencia, Débito, Otro        |
| **Comprobante**    | Link descargable (PDF/imagen)      |

**Estados Posibles:**

- 🟢 **PAID** - Pago realizado y verificado
- 🟡 **PENDING** - Pendiente de pago
- 🔴 **OVERDUE** - Vencido sin pagar
- 🔵 **PROCESSING** - En revisión

**Acciones:**

| Acción                    | Descripción                   |
| ------------------------- | ----------------------------- |
| **Ver Detalle**           | Expandir información completa |
| **Descargar Comprobante** | PDF/Imagen del recibo         |
| **Ver Historial**         | Todos los intentos de pago    |

---

### 📋 Sección: Contrato (`/mi-arriendo/contrato`)

#### Funcionalidades

**Información del Contrato:**

```
┌──────────────────────────────────┐
│ DATOS DEL CONTRATO               │
├──────────────────────────────────┤
│ Vigencia: [Inicio] - [Fin]       │
│ Propiedad: [Dirección]           │
│ Arriendo Mensual: $[CLP]         │
│ UF Equivalente: [X UF]           │
│                                  │
│ Información Arrendador:          │
│ ├── Nombre: [Nombre]             │
│ ├── Email: [correo@email.com]    │
│ ├── Teléfono: [+56 9 XXXX XXXX] │
│ └── RUT: [XX.XXX.XXX-X]          │
│                                  │
│ Información Corredor (si aplica):│
│ ├── Nombre: [Nombre]             │
│ ├── Empresa: [Empresa]           │
│ └── Contacto: [Teléfono/Email]   │
└──────────────────────────────────┘
```

**Documento del Contrato:**

| Propiedad              | Descripción                         |
| ---------------------- | ----------------------------------- |
| **URL PDF**            | Link descargable del contrato       |
| **Estado Firma**       | FIRMADO / PENDIENTE                 |
| **Firma Arrendador**   | Sí ✅ / No ❌ - Fecha: [DD/MM/YYYY] |
| **Firma Arrendatario** | Sí ✅ / No ❌ - Fecha: [DD/MM/YYYY] |
| **Fecha Firma Final**  | [DD/MM/YYYY] (si ambos firmaron)    |

**Fotodocumentación Adjunta:**

- Fotos iniciales de propiedad
- Documento de identidad
- Otros documentos relevantes

**Acciones:**

| Acción                  | Descripción                                                   |
| ----------------------- | ------------------------------------------------------------- |
| **Descargar Contrato**  | PDF de contrato completo                                      |
| **Firmar Digitalmente** | Si contrato pendiente (Componente: TenantContractSignActions) |
| **Ver Historial**       | Versiones anteriores del contrato                             |
| **Cargar Fotos**        | Agregar documentación                                         |

---

### 🔧 Sección: Mantenciones (`/mi-arriendo/mantenciones`)

#### Funcionalidades

**Crear Reporte de Mantención:**

```
Formulario de Reporte:
├── Categoría: [Seleccionar]
├── Descripción: [Texto libre]
├── Fotos: [Upload múltiple]
├── Contacto preferente: [Teléfono]
└── [Enviar Reporte]
```

**Categorías Disponibles:**

- 🔧 Plomería (tuberías, grifos, desagües)
- ⚡ Electricidad (circuitos, tomas, iluminación)
- 🏗️ Estructura (paredes, techos, puertas)
- 📋 Otro (describir en detalle)

**Información Legal:**

> Según Ley 18.101, estas reparaciones son responsabilidad del arrendador. El reporte será enviado y debe ser atendido en plazo legal.

**Información de Reporte:**

| Campo                  | Descripción                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| **Categoría**          | Tipo de mantención                                               |
| **Descripción**        | Detalles del problema                                            |
| **Fotos**              | Evidencia del problema (Cloudinary URLs)                         |
| **Estado**             | REQUESTED, REVIEWING, APPROVED, IN_PROGRESS, COMPLETED, REJECTED |
| **Fecha Reporte**      | Cuándo se creó                                                   |
| **Proveedor Asignado** | Especialista que lo hace                                         |
| **Fecha Completación** | Cuándo se resolvió                                               |
| **Comentarios**        | Comunicación arrendador-arrendatario                             |

**Estados de Mantención:**

```
REQUESTED (Reportado)
    ↓
REVIEWING (En revisión por arrendador)
    ↓
    ├─→ REQUESTED_INFO (Se solicita más información)
    │
APPROVED (Aprobado)
    ↓
IN_PROGRESS (Trabajando en it)
    ↓
COMPLETED (Resuelto)

(Alternativa)
REJECTED (Rechazado - no es responsabilidad arrendador)
```

**Acciones:**

| Acción                 | Descripción                           |
| ---------------------- | ------------------------------------- |
| **Crear Reporte**      | Nuevo formulario de mantención        |
| **Ver Estado**         | Seguimiento en tiempo real            |
| **Subir Fotos**        | Agregar evidencia                     |
| **Agregar Comentario** | Comunicación con arrendador/proveedor |
| **Ver Proveedor**      | Contacto del especialista asignado    |

---

### 📊 Sección: Servicios (`/mi-arriendo/servicios`)

#### Funcionalidades

**Visualización de Consumo:**

Tabla/Gráfico mensual de consumo de servicios básicos:

| Servicio        | Mes Actual | Mes Anterior | Promedio |
| --------------- | ---------- | ------------ | -------- |
| 💧 Agua         | [m³]       | [m³]         | [m³]     |
| ⚡ Electricidad | [kWh]      | [kWh]        | [kWh]    |
| 🔥 Gas          | [m³]       | [m³]         | [m³]     |

**Visualización Gráfica:**

- Tendencias de consumo (últimos 12 meses)
- Comparativas mes a mes
- Alertas de consumo anómalo

**Información Adicional:**

- Comprobantes/boletas de servicios
- Montos de pago en URLs Cloudinary
- Información de contacto de servicios

---

### 👥 Sección: Contactos (`/mi-arriendo/contactos`)

#### Información del Arrendador

```
┌─────────────────────────────┐
│ CONTACTO DEL ARRENDADOR     │
├─────────────────────────────┤
│ Nombre: [Nombre completo]   │
│ Email: [correo@email.com]   │
│ Teléfono: [+56 9 XXXX XXXX] │
└─────────────────────────────┘
```

#### Red de Proveedores de Confianza

**Listado de Proveedores Disponibles:**

Para cada proveedor:

```
┌──────────────────────────────┐
│ [Nombre Proveedor]           │
│ 🔧 [Especialidad]            │
│ ⭐ Rating: [4.5/5]           │
│ 📞 [Teléfono contacto]       │
│ 📧 [Email]                   │
│ ℹ️ [Descripción breve]        │
└──────────────────────────────┘
```

**Información Legal:**

> ⚠️ **Responsabilidades según Ley 18.101:**
>
> El arrendador es responsable de mantener la propiedad en condiciones de habitabilidad. Los proveedores disponibles son de confianza verificada. En caso de emergencia fuera de horario, contactar directamente al arrendador.

---

## 💼 Dashboard del Corredor (BROKER)

### Descripción General

Panel especializado para gestionar propiedades bajo mandato, arrendadores clientes, y administración de comisiones y rendiciones.

**Ruta Base**: `/broker`  
**Acceso**: Solo usuarios con rol `BROKER` u `OWNER`  
**Validación**: Middleware de autenticación y autorización

### 📊 Página Principal (`/broker/page.tsx`)

#### KPIs Específicos del Corredor

| KPI                           | Cálculo                    | Formato                                                |
| ----------------------------- | -------------------------- | ------------------------------------------------------ |
| **Propiedades Administradas** | Conteo de mandatos ACTIVE  | "12 propiedades" con subtítulo "8/12 pagadas este mes" |
| **Total Recaudado**           | Suma de pagos PAID del mes | En millones "$ 2.5M"                                   |
| **Pagos Pendientes**          | Conteo + monto PENDING     | "3 pendientes • $450.000"                              |
| **Mantenciones Activas**      | Conteo de estados activos  | "5 mantenciones en progreso"                           |

#### Listado de Mandatos (Propiedades Administradas)

**Información por Mandato:**

```
┌───────────────────────────────────────────┐
│ Nombre Propiedad                          │
│ [Dirección] | [Comuna]                    │
│ 👤 Arrendador: [Nombre]                   │
│ 👥 Arrendatario: [Nombre]                 │
│ 💰 Arriendo: $[CLP]                       │
│ 📊 Estado Pago Mes: [PAID/PENDING/OVERDUE]│
│ 🔧 Mantenciones Activas: X                │
└───────────────────────────────────────────┘
```

#### Últimas Rendiciones (Bottom 5)

Tabla de última actividad:
| Mes | Propiedad | Arrendador | Monto |
|-----|-----------|-----------|-------|
| ABR 2026 | [Propiedad] | [Arrendador] | $[CLP] |
| ... | ... | ... | ... |

#### Últimos Mensajes (Bottom 5)

| Para Propiedad | A Arrendatario | Contenido (preview)   |
| -------------- | -------------- | --------------------- |
| [Propiedad]    | [Nombre]       | "Recordar pago de..." |
| ...            | ...            | ...                   |

---

### 📋 Sección: Contratos (`/broker/contratos`)

#### Funcionalidades

Utiliza el mismo componente `ContractWorkspace` que el arrendador con funcionalidades:

- Gestión de contratos de propiedades bajo mandato
- Filtrado por propiedad mandatada
- Visualización de estado de firmas
- Generación de PDFs
- Historial de versiones

**Acciones:**

- Crear contrato nueva temporada
- Ver contrato vigente
- Generar PDF
- Ver historial

**Base Path:** `/broker/contratos`

---

### 📍 Sección: Propiedades (`/broker/propiedades`)

#### Funcionalidades

**Listado de Propiedades Mandatadas:**

Solo muestra propiedades donde el corredor tiene mandato ACTIVE.

**Búsqueda Avanzada:**

- Por dirección
- Por comuna/región
- Por nombre de propiedad
- Por arrendador
- Por arrendatario
- Por estado de pago

**Información por Propiedad:**

```
┌──────────────────────────────────────┐
│ [Nombre Propiedad]                   │
│ [Dirección completa]                 │
│ Arrendador: [Nombre] - [Contacto]    │
│ Arrendatario: [Nombre] - [Contacto]  │
│ Arriendo Mensual: $[CLP]              │
│ Fechas: [Inicio] - [Fin Contrato]    │
│ Estado Pago Mes: [PAID/PENDING]      │
│ Progreso Contrato: [Gráfico %]        │
└──────────────────────────────────────┘
```

**Acciones:**

| Acción                      | Descripción                       |
| --------------------------- | --------------------------------- |
| **Ver Detalles**            | Información completa de propiedad |
| **Acceder a Pagos**         | Ver estado de pagos mensuales     |
| **Ver Mantenciones**        | Solicitudes activas               |
| **Gestionar Documentación** | Contrato, fotos, etc              |
| **Enviar Aviso**            | Comunicación con arrendatario     |

---

### 🤝 Sección: Mandatos (`/broker/mandatos`)

#### Descripción

Gestión integral de mandatos (contratos con arrendadores para administrar propiedades).

#### Estados de Mandato

```
PENDING → ACTIVE → REVOKED
              ↓
           EXPIRED
```

| Estado         | Descripción                            |
| -------------- | -------------------------------------- |
| ⏳ **PENDING** | Awaiting acceptance from landlord      |
| ✅ **ACTIVE**  | Mandato vigente, corredor puede operar |
| ❌ **REVOKED** | Terminado por el arrendador            |
| ⏱️ **EXPIRED** | Vencido por fecha                      |

#### Información de Mandato

```
┌────────────────────────────┐
│ Propiedad: [Nombre]        │
│ Arrendador: [Nombre]       │
│ Estado: [ACTIVE/PENDING]   │
│ Creado: [Fecha]            │
│ Vigencia: [Inicio - Fin]   │
│ Comisión: [%]              │
│ Total Recaudado: $[CLP]    │
└────────────────────────────┘
```

**Acciones:**

| Acción            | Descripción                          |
| ----------------- | ------------------------------------ |
| **Crear Mandato** | Solicitar nuevo mandato a arrendador |
| **Ver Detalles**  | Información completa del mandato     |
| **Revocar**       | Terminar mandato (si es arrendador)  |
| **Renovar**       | Extender vigencia                    |
| **Ver Ingresos**  | Desglose de comisiones               |

---

### 📢 Sección: Avisos al Arrendatario (`/broker/avisos`)

#### Descripción

Centro centralizado de mensajería para enviar recordatorios y avisos a arrendatarios.

**Componente:** `BrokerMessageCenter`

#### Funcionalidades

**Crear Nuevo Aviso:**

```
Formulario:
├── Propiedad: [Seleccionar]
├── Arrendatario: [Auto-completa según propiedad]
├── Asunto: [Ej: "Recordatorio de pago"]
├── Mensaje: [Texto libre, máx 500 caracteres]
└── [Enviar]
```

**Tipos de Avisos Comunes:**

- 💰 Recordatorio de pago pendiente
- 📋 Información sobre mantenimiento
- 🔧 Solicitud información adicional
- 📅 Información sobre renovación de contrato
- ⚠️ Notificación de atraso

#### Historial de Mensajes

**Tabla de Últimos 50 Mensajes:**

| Propiedad | Arrendatario | Contenido (Preview)          | Fecha   | Estado  |
| --------- | ------------ | ---------------------------- | ------- | ------- |
| [Prop]    | [Nombre]     | "Recordar que pago vence..." | [Fecha] | Enviado |
| ...       | ...          | ...                          | ...     | ...     |

**Información por Mensaje:**

- Fecha de envío
- Hora exacta
- Estado: Enviado / Entregado / Leído
- Respuesta (si aplica)

---

### 📊 Sección: Rendiciones (`/broker/rendiciones`)

#### Descripción

Generación de documentos mensuales detallados para arrendadores con desglose de recaudación, comisiones y gastos.

**Componente:** `BrokerStatementManager`

#### Funcionalidades

**Crear Rendición:**

```
Formulario:
├── Mes: [Mes/Año]
├── Arrendador: [Seleccionar]
├── Propiedades: [Seleccionar propiedades a incluir]
├── Generar PDF
└── [Crear Rendición]
```

#### Contenido de Rendición

**Estructura del Documento PDF:**

```
┌─────────────────────────────────────┐
│ RENDICIÓN DE CUENTAS                │
│ Período: [MES AÑO]                  │
│ Arrendador: [Nombre]                │
│ Corredor: [Nombre Empresa]          │
├─────────────────────────────────────┤
│ DETALLE DE PROPIEDADES              │
│                                     │
│ Propiedad 1:                        │
│ ├─ Arriendo Mensual: $[CLP]        │
│ ├─ Pagos Recibidos: $[CLP]         │
│ ├─ Pagos Pendientes: $[CLP]        │
│ └─ Comisión Corredor: $[CLP]       │
│                                     │
│ RESUMEN FINANCIERO                  │
│ ├─ Total Recaudado: $[CLP]         │
│ ├─ Total Comisiones: $[CLP]        │
│ ├─ Total Gastos: $[CLP]            │
│ └─ NETO A TRANSFERIR: $[CLP]       │
│                                     │
│ Detalle de Gastos:                  │
│ ├─ Mantenimiento: $[CLP]           │
│ ├─ Servicios: $[CLP]               │
│ └─ Otros: $[CLP]                   │
└─────────────────────────────────────┘
```

#### Items de Rendición

**Cada línea contiene:**
| Campo | Descripción |
|-------|-----------|
| **Concepto** | Tipo de ingreso/gasto |
| **Descripción** | Detalles |
| **Monto CLP** | Cantidad en pesos |
| **Monto UF** | Equivalente en UF |

**Acciones:**

| Acción              | Descripción                   |
| ------------------- | ----------------------------- |
| **Crear Rendición** | Nueva rendición mensual       |
| **Generar PDF**     | Descargar documento           |
| **Ver Historial**   | Rendiciones anteriores        |
| **Exportar Excel**  | Descargar datos para análisis |

---

### 📅 Sección: Calendario (`/broker/calendario`)

#### Funcionalidades

Similar al calendario del arrendador pero mostrando solo eventos de propiedades mandatadas.

**Eventos Visibles:**

- Fechas de pago de arrendamientos
- Renovaciones de contrato
- Mantenciones en progreso
- Inspecciones programadas
- Ajustes por IPC

---

### ⚙️ Sección: Configuración (`/broker/configuracion`)

#### Funcionalidades

**Información de Empresa:**

```
Nombre de Empresa
RUT de Empresa (validado)
Descripción de Servicios
Teléfono Principal
Email Principal
Página Web (opcional)
```

**Información Bancaria (Comisiones):**

```
Banco: [Seleccionar]
Tipo de Cuenta: [Corriente/Ahorro]
Número de Cuenta: [XXXXXXXXXXXX]
Email Bancario: [Para confirmaciones]
```

**Información Personal del Broker:**

```
Nombre Completo
Email (verificado)
Teléfono Personal
Documento de Identidad
```

**Seguridad:** Similar a arrendador (cambio de contraseña, verificación)

---

## 🌐 Funcionalidades Globales

### 🔐 Sistema de Autenticación

#### Descripción

Autenticación robusta usando NextAuth v5 con JWT y validación de email.

**Tecnología:** NextAuth v5 + JWT + bcrypt

#### Rutas de API

| Ruta                            | Método | Descripción                               |
| ------------------------------- | ------ | ----------------------------------------- |
| `/api/auth/[...nextauth]`       | -      | NextAuth handler (login, logout, session) |
| `/api/auth/registro`            | POST   | Crear cuenta nueva con validación         |
| `/api/auth/resend-verification` | POST   | Reenviar email de verificación            |
| `/api/auth/verify-email`        | POST   | Confirmar email con token                 |
| `/api/auth/verification-status` | GET    | Verificar estado de email                 |

#### Proceso de Login

```
1. Usuario ingresa email + contraseña
2. Validación contra BD (bcrypt)
3. Generación de JWT
4. Sesión almacenada en cookie segura
5. Redireccionamiento a dashboard según rol
```

#### Proceso de Registro

```
1. Validación de datos (email, contraseña, RUT)
2. Email no debe existir
3. RUT validado (algoritmo Dígito Verificador)
4. Contraseña hasheada con bcrypt (10 rounds)
5. Usuario creado sin verificación
6. Email de verificación enviado
7. Usuario puede login pero con acceso limitado
```

#### Roles Soportados

| Rol          | Acceso                                    |
| ------------ | ----------------------------------------- |
| **TENANT**   | Mi Arriendo - Dashboard arrendatario      |
| **LANDLORD** | Dashboard - Administración de propiedades |
| **BROKER**   | Broker - Gestión de mandatos              |
| **OWNER**    | Todos los accesos (Admin super usuario)   |

#### Protección de Rutas

```javascript
// Middleware valida:
1. Existencia de sesión activa
2. Rol del usuario
3. Permisos específicos
4. Redirige a login si no autorizado
```

---

### 🔔 Sistema de Notificaciones

#### Descripción

Sistema de notificaciones en tiempo real con múltiples canales (UI, email, SSE).

#### Rutas API

| Ruta                        | Método | Descripción                       |
| --------------------------- | ------ | --------------------------------- |
| `/api/notifications`        | GET    | Listar notificaciones del usuario |
| `/api/notifications`        | PATCH  | Marcar notificaciones como leídas |
| `/api/notifications/stream` | GET    | Server-Sent Events (tiempo real)  |

#### Tipos de Notificaciones

| Tipo                         | Destinatario            | Disparador                        |
| ---------------------------- | ----------------------- | --------------------------------- |
| 💰 **Pago Pendiente**        | Arrendatario            | Cuando pago está near vencimiento |
| ✅ **Pago Realizado**        | Arrendador              | Cuando arrendatario paga          |
| 🔧 **Mantención Solicitada** | Arrendador              | Cuando arrendatario reporta       |
| 📋 **Mantención Aprobada**   | Arrendatario            | Cuando arrendador aprueba         |
| 💬 **Nuevo Mensaje**         | Arrendatario            | De parte del arrendador/corredor  |
| 📄 **Contrato Pendiente**    | Arrendatario/Arrendador | Cuando hay firma pendiente        |
| 🤝 **Solicitud Acceso**      | Arrendador              | Cuando corredor solicita acceso   |

#### Componente de Campana de Notificaciones

**Ubicación:** Header layout (shared)

**Funcionalidades:**

- Icono de campana con contador de no leídas
- Dropdown con últimas 5 notificaciones
- Click en notificación redirige a página relevante
- Conexión SSE para actualizaciones en tiempo real

---

### 💳 Sistema de Pagos

#### Descripción

Gestión integral de pagos de arrendamientos con seguimiento, recibos y estados.

#### Rutas API

| Ruta                 | Método | Descripción                        |
| -------------------- | ------ | ---------------------------------- |
| `/api/payments`      | GET    | Listar pagos del usuario/propiedad |
| `/api/payments`      | POST   | Crear registro de pago             |
| `/api/payments/[id]` | PATCH  | Actualizar estado de pago          |

#### Estructura de Pago

```
{
  id: UUID,
  propertyId: UUID,
  tenantId: UUID,
  month: "2026-04",
  amountCLP: 450000,
  amountUF: 2.5,
  status: "PAID | PENDING | OVERDUE | PROCESSING",
  method: "transfer | debit | other",
  paidDate: "2026-04-15",
  dueDate: "2026-04-30",
  receiptUrl: "cloudinary-url",
  notes: "Texto",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Estados de Pago

```
PENDING (Pendiente de pago)
  ↓ [se realiza pago]
PROCESSING (En revisión/validación)
  ↓ [se confirma]
PAID (Pagado correctamente)

OVERDUE (Vencido, no pagado)
  ↓ [se realiza pago]
PAID (Pagado pero atrasado)
```

#### Funcionamiento

**Flujo de Pago:**

1. Se crea registro PENDING automáticamente mes anterior a vencimiento
2. Arrendatario realiza transferencia
3. Arrendador verifica y marca como PAID
4. Sistema genera recibo automático
5. Notificación enviada a ambas partes

**Descarga de Recibos:**

- Generación dinámica de PDF con componente `generate-receipt-pdf.ts`
- Contiene: Comprobante, montos, fechas, firmas digitales
- Almacenado en Cloudinary

---

### 📄 Sistema de Contratos Digitales

#### Descripción

Gestión integral de contratos de arrendamiento con firma electrónica y cumplimiento legal.

#### Rutas API

| Ruta                  | Método | Descripción          |
| --------------------- | ------ | -------------------- |
| `/api/contracts`      | GET    | Listar contratos     |
| `/api/contracts`      | POST   | Crear nuevo contrato |
| `/api/contracts/[id]` | GET    | Obtener detalles     |
| `/api/contracts/[id]` | PATCH  | Actualizar contrato  |

#### Estados de Contrato

```
DRAFT
  ↓ [se envía a firmar]
PENDING_SIGNATURE
  ↓ [ambas partes firman]
SIGNED
  ↓ [se activa]
ACTIVE
  ↓ [vence fecha]
EXPIRED
  ↓ [se termina]
TERMINATED
```

#### Estructura de Contrato

```
{
  id: UUID,
  propertyId: UUID,
  landlordId: UUID,
  tenantId: UUID,
  brokerId?: UUID,

  // Fechas
  startDate: "2026-01-01",
  endDate: "2027-01-01",

  // Financiero
  monthlyRentCLP: 450000,
  monthlyRentUF: 2.5,

  // Estado
  status: "DRAFT | PENDING_SIGNATURE | SIGNED | ACTIVE | EXPIRED | TERMINATED",

  // Firmas
  landlordSignature: { signed: true, date: timestamp },
  tenantSignature: { signed: true, date: timestamp },

  // Documento
  documentUrl: "cloudinary-pdf-url",

  // Legal
  terms: "Términos específicos...",
  metadata: { ... }
}
```

#### Cumplimiento Legal

✅ **Ley 18.101** - Contrato incluye cláusulas obligatorias

- Identificación de partes
- Descripción de inmueble
- Plazo del arriendo
- Monto de renta
- Forma y época de pago

✅ **Firma Electrónica** - Válida legalmente según Ley 19.799

#### Generación de PDF

Componente `ContractPdfActions`:

- Genera PDF con todos los datos
- Incluye firmas digitales
- Incluye fecha y hora de generación
- Verificable y auditable

---

### 🔧 Sistema de Mantenciones

#### Descripción

Gestión de solicitudes de mantenimiento con responsabilidades legales y asignación de proveedores.

#### Rutas API

| Ruta                    | Método | Descripción           |
| ----------------------- | ------ | --------------------- |
| `/api/maintenance`      | GET    | Listar solicitudes    |
| `/api/maintenance`      | POST   | Crear nueva solicitud |
| `/api/maintenance/[id]` | PATCH  | Actualizar estado     |

#### Estructura de Solicitud

```
{
  id: UUID,
  propertyId: UUID,
  tenantId: UUID,
  providerId?: UUID,

  // Información
  category: "plumbing | electrical | structure | other",
  description: "Descripción del problema",
  photos: ["cloudinary-url-1", "cloudinary-url-2"],

  // Estado del proceso
  status: "REQUESTED | REVIEWING | REQUESTED_INFO | APPROVED | IN_PROGRESS | COMPLETED | REJECTED",

  // Responsabilidades legales
  legalResponsibility: "landlord | tenant | other",

  // Timeline
  requestedAt: timestamp,
  approvedAt?: timestamp,
  completedAt?: timestamp,

  // Comunicación
  comments: [{ author, text, date }, ...],

  // Documentación
  invoiceUrl?: "url",
  completionPhotoUrl?: "url"
}
```

#### Categorías y Responsabilidades (Ley 18.101)

| Categoría           | Responsable | Ejemplos                           |
| ------------------- | ----------- | ---------------------------------- |
| 🔧 **Plomería**     | Arrendador  | Tuberías, grifos, desagües, WC     |
| ⚡ **Electricidad** | Arrendador  | Circuitos, enchufes, iluminación   |
| 🏗️ **Estructura**   | Arrendador  | Paredes, techos, puertas, ventanas |
| 📋 **Otro**         | Caso a caso | Evaluar responsabilidad específica |

#### Flujo de Aprobación

```
Arrendatario reporta
        ↓
Email notificación a arrendador
        ↓
Arrendador revisa fotos + descripción
        ↓
Arrendador puede:
├─ APROBAR → Asignar proveedor → En progreso → Completado
├─ PEDIR INFO → Solicita más detalles al arrendatario
└─ RECHAZAR → No es responsabilidad (notifica al arrendatario)
```

---

### 🤝 Sistema de Mandatos de Corredor

#### Descripción

Gestión de acuerdos entre arrendadores y corredores para administrar propiedades.

#### Rutas API

| Ruta                   | Método | Descripción         |
| ---------------------- | ------ | ------------------- |
| `/api/mandates`        | GET    | Listar mandatos     |
| `/api/mandates`        | POST   | Crear nuevo mandato |
| `/api/mandates/[id]`   | PATCH  | Actualizar mandato  |
| `/api/mandates/revoke` | POST   | Revocar mandato     |

#### Estructura de Mandato

```
{
  id: UUID,
  landlordId: UUID,
  brokerId: UUID,
  propertyId: UUID,

  // Estado
  status: "PENDING | ACTIVE | REVOKED | EXPIRED",

  // Vigencia
  startDate: "2026-01-01",
  expiryDate: "2027-01-01",

  // Comisión
  commissionPercentage: 8.5,

  // Creación
  createdAt: timestamp,
  acceptedAt?: timestamp
}
```

#### Estados de Mandato

| Estado         | Descripción                  |
| -------------- | ---------------------------- |
| ⏳ **PENDING** | Awaiting landlord acceptance |
| ✅ **ACTIVE**  | Broker puede operar          |
| ❌ **REVOKED** | Terminado por landlord       |
| ⏱️ **EXPIRED** | Vencido por fecha            |

#### Permisos con Mandato

Corredor con mandato ACTIVE puede:

- ✅ Ver información de propiedad
- ✅ Ver información de arrendatario (limitada)
- ✅ Crear/ver contratos
- ✅ Registrar pagos
- ✅ Crear rendiciones
- ✅ Enviar avisos a arrendatario
- ❌ Editar información de arrendador
- ❌ Crear/eliminar propiedad

---

### 📧 Sistema de Invitaciones

#### Descripción

Proceso para invitar arrendatarios a registrarse vinculando directamente a propiedad.

#### Rutas API

| Ruta                       | Método | Descripción        |
| -------------------------- | ------ | ------------------ |
| `/api/invitations`         | POST   | Crear invitación   |
| `/api/invitations/[token]` | GET    | Verificar token    |
| `/api/invitations/[token]` | POST   | Aceptar invitación |

#### Flujo de Invitación

```
1. Arrendador invita arrendatario
   Input: Email, nombre, propiedad

2. Sistema genera token único (60 caracteres, expira 7 días)

3. Email enviado con link:
   www.neifeapp.com/invitacion/[token]

4. Arrendatario hace click en link
   - Si NO existe cuenta → Ir a registro
   - Si EXISTE cuenta → Ir a aceptación

5. Aceptar invitación:
   - Propiedad vinculada a usuario
   - Contrato vinculado
   - Email confirmación
   - Redirect a dashboard
```

#### Estructura de Invitación

```
{
  id: UUID,
  token: "unique-token-60-chars",
  tenantEmail: "tenant@email.com",
  tenantName: "Juan Pérez",
  propertyId: UUID,
  landlordId: UUID,

  status: "PENDING | ACCEPTED | REJECTED | EXPIRED",

  createdAt: timestamp,
  expiresAt: timestamp (7 días),
  acceptedAt?: timestamp
}
```

---

### 🎯 Sistema de Permisos de Broker

#### Descripción

Control granular de acceso de corredores a propiedades específicas.

#### Rutas API

| Ruta                      | Método | Descripción     |
| ------------------------- | ------ | --------------- |
| `/api/broker-permissions` | GET    | Listar permisos |
| `/api/broker-permissions` | POST   | Crear permiso   |

#### Estructura de Permiso

```
{
  id: UUID,
  propertyId: UUID,
  brokerId: UUID,
  landlordId: UUID,

  status: "PENDING | APPROVED | REJECTED",
  requestedAt: timestamp,
  respondedAt?: timestamp
}
```

---

### 📍 Sistema de Solicitudes de Acceso a Propiedad

#### Descripción

Corredores solicitan acceso a propiedades específicas para administrar.

#### Rutas API

| Ruta                                 | Método | Descripción         |
| ------------------------------------ | ------ | ------------------- |
| `/api/property-access-requests`      | GET    | Listar solicitudes  |
| `/api/property-access-requests`      | POST   | Crear solicitud     |
| `/api/property-access-requests/[id]` | PATCH  | Responder solicitud |

#### Estructura de Solicitud

```
{
  id: UUID,
  propertyId: UUID,
  brokerId: UUID,
  landlordId: UUID,

  message: "Razón de la solicitud",

  status: "PENDING | APPROVED | REJECTED",
  createdAt: timestamp,
  respondedAt?: timestamp
}
```

---

### 👥 Sistema de Proveedores

#### Descripción

Gestión de red de proveedores de servicios especializados.

#### Rutas API

| Ruta                  | Método | Descripción        |
| --------------------- | ------ | ------------------ |
| `/api/providers`      | GET    | Listar proveedores |
| `/api/providers`      | POST   | Crear proveedor    |
| `/api/providers/[id]` | GET    | Obtener detalles   |
| `/api/providers/[id]` | PUT    | Actualizar         |
| `/api/providers/[id]` | DELETE | Eliminar           |

#### Estructura de Proveedor

```
{
  id: UUID,
  landlordId: UUID,

  // Información
  name: "nombre proveedor",
  phone: "+56 9 XXXX XXXX",
  email: "email@provider.com",
  description: "descripción de servicios",

  // Especialidades
  specialties: ["plumbing", "electrical", ...],

  // Calificación
  rating: 4.5,
  reviewCount: 15,

  // Histórico
  jobsCompleted: 23,
  createdAt: timestamp
}
```

---

### 📊 Servicios Básicos

#### Descripción

Registro y seguimiento de consumo de servicios mensuales.

#### Rutas API

| Ruta                   | Método | Descripción                |
| ---------------------- | ------ | -------------------------- |
| `/api/services`        | GET    | Listar servicios mensuales |
| `/api/services`        | POST   | Crear registro mensual     |
| `/api/services/upload` | POST   | Subir boleta a Cloudinary  |

#### Estructura de Servicio Mensual

```
{
  id: UUID,
  propertyId: UUID,
  month: "2026-04",

  water: {
    consumption: 25.5,  // m³
    billUrl: "cloudinary-url"
  },
  electricity: {
    consumption: 180,   // kWh
    billUrl: "cloudinary-url"
  },
  gas: {
    consumption: 8.2,   // m³
    billUrl: "cloudinary-url"
  },

  createdAt: timestamp
}
```

---

### 📈 Analytics y Reportes

#### Rutas API

| Ruta                   | Método | Descripción    |
| ---------------------- | ------ | -------------- |
| `/api/dashboard/stats` | GET    | KPIs según rol |

#### Datos Disponibles

**Para Arrendador:**

- Ingresos totales (CLP, UF)
- Pagos pendientes
- Propiedades activas
- Mantenciones en progreso
- Tendencias 12 meses

**Para Corredor:**

- Propiedades administradas
- Total recaudado
- Comisiones ganadas
- Rendiciones mensuales

**Para Arrendatario:**

- Próximo pago
- Servicios del mes
- Historial últimos 3 pagos

---

### 📋 Modelos de Base de Datos (16 Modelos)

| Modelo                      | Descripción                                              |
| --------------------------- | -------------------------------------------------------- |
| **User**                    | Información de usuarios (email, contraseña, rol, perfil) |
| **Property**                | Propiedades en arriendo (dirección, datos bancarios)     |
| **Payment**                 | Pagos mensuales (monto, estado, fecha)                   |
| **MaintenanceRequest**      | Solicitudes de mantención                                |
| **Notification**            | Notificaciones para usuarios                             |
| **NotificationPreferences** | Preferencias de canales de notificación                  |
| **Invitation**              | Invitaciones de arrendatarios por email                  |
| **Mandate**                 | Mandatos de corredores                                   |
| **Contract**                | Contratos digitales                                      |
| **Provider**                | Proveedores de servicios                                 |
| **BrokerMessage**           | Mensajes de corredores a arrendatarios                   |
| **BrokerStatement**         | Rendiciones mensuales                                    |
| **BrokerStatementItem**     | Items detallados de rendiciones                          |
| **MonthlyService**          | Consumo de servicios básicos                             |
| **CalendarEvent**           | Eventos en calendario                                    |
| **ActivityLog**             | Log de actividades del sistema                           |

---

## 📊 Resumen Ejecutivo

### Matriz de Funcionalidades por Rol

| Funcionalidad             | Arrendador | Arrendatario | Corredor |
| ------------------------- | ---------- | ------------ | -------- |
| **Gestionar Propiedades** | ✅         | ❌           | ❌       |
| **Ver Pagos**             | ✅         | ✅           | ✅       |
| **Crear Contratos**       | ✅         | ❌           | ✅       |
| **Firmar Contrato**       | ✅         | ✅           | ❌       |
| **Reportar Mantención**   | ❌         | ✅           | ❌       |
| **Aprobar Mantención**    | ✅         | ❌           | ❌       |
| **Ver Servicios Básicos** | ✅         | ✅           | ❌       |
| **Gestionar Proveedores** | ✅         | ❌           | ❌       |
| **Ver Mandatos**          | ✅         | ❌           | ✅       |
| **Crear Rendición**       | ❌         | ❌           | ✅       |
| **Enviar Avisos**         | ✅         | ❌           | ✅       |
| **Acceso a Calendario**   | ✅         | ❌           | ✅       |

### Cumplimiento Legal

✅ **Ley 18.101** - Contrato de Arriendos  
✅ **Ley 21.461** - Procedimiento de Desalojo  
✅ **Ley 19.628** - Protección de Datos Personales  
✅ **Firma Electrónica** - Válida legalmente (Ley 19.799)

### Volumen de Funcionalidades

- **11 Secciones principales** en Dashboard Arrendador
- **5 Secciones principales** en Dashboard Arrendatario
- **7 Secciones principales** en Dashboard Corredor
- **16 Modelos de base de datos**
- **20+ Rutas de API específicas**
- **25+ Tipos de notificaciones**

### Tecnología Stack

**Frontend:**

- Next.js 15 (App Router)
- React Server Components
- TypeScript
- Tailwind CSS
- Responsive Design

**Backend:**

- Next.js API Routes
- Prisma ORM
- NextAuth v5 (JWT)
- Resend (Email)
- Cloudinary (Storage)

**Base de Datos:**

- PostgreSQL (via Prisma)
- 16 modelos relacionales

**Infraestructura:**

- Vercel (Deployment)
- Cloudinary CDN (Assets)

---

**Documento generado:** Abril 2026  
**Versión:** 1.0  
**Estado:** Análisis Completo
