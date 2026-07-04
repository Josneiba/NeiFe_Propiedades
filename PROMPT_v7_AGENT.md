# Prompt v7 — NeiFe: Centro de Planificación Comercial

### (Cierre de brechas del v6 + Pipeline + Estrategias + KPIs con desglose estilo PMG)

Copia y pega TODO este bloque en tu agente, dentro del repo `NeiFe_Propiedades-master`.

---

## REGLA #0 — ANTI-OMISIÓN (obligatoria, sin excepciones)

1. Tabla de trazabilidad obligatoria por etapa: `| Requisito | ¿Implementado? | Archivo:línea | Evidencia |`. La evidencia es el fragmento real pegado con `view`/`cat`, nunca una descripción de memoria.
2. Ningún recorte de alcance sin decirlo explícitamente ANTES de seguir (`RECORTE: ...`), y sin que yo lo apruebe en un prompt futuro.
3. **Auditoría previa obligatoria de este mismo prompt (v7) antes de cerrar**: relee cada checklist de aceptación y confirma con una fila en la tabla, incluso los puntos que decidiste no hacer.
4. **Lección aprendida del v6 (no repetir)**: en la iteración anterior se reportó como "hecho" un motor de predicción (`getBrokerGoalInsights` en `lib/goal-engine.ts`) que en realidad **no estaba conectado a ningún API route ni componente** — código muerto que nunca llega al usuario. Esto NO se detectó porque el reporte solo confirmó que la función existía, no que se usara. A partir de ahora, para cualquier función/servicio nuevo debes verificar y documentar la cadena completa: **modelo → función en `lib/` → API route que la llama → componente que hace `fetch` a ese route → el usuario puede verla y hacer clic**. Si un eslabón de esa cadena falta, la etapa NO está completa, sin importar que el código "exista".
5. `pnpm build` / `npx tsc --noEmit` en verde NO certifica nada funcional. Verifica con `grep`/`find` que cada función nueva tiene al least un `grep -rl "nombreDeLaFuncion"` fuera del archivo donde se definió.

## REGLA #1 — TODO DEBE SER ACCIONABLE (vigente, sin cambios)

Ningún dato, contador o botón puede ser decorativo. Cada KPI, cada fila de pipeline, cada desglose debe poder clickearse y llevar a un listado real y filtrado (reutilizando el motor de Vistas Guardadas).

---

## CONTEXTO — Resultado real de la auditoría del Prompt v6

Antes de escribir una sola línea de código, lee esto. Es el estado **real** verificado del repo (no lo que decía el reporte anterior):

Ítem del v6
Estado real verificado

Modelos `CrmWorkflow`, `CrmWorkflowStage`, `CrmWorkflowInstance`, `CrmWorkflowInstanceStage`
✅ Existen en `prisma/schema.prisma`, migrados en `prisma/migrations/20260704145406_add_crm_workflows/`

Seed con 3 workflows globales (Arriendo, Venta, Administración)
✅ Existen en `prisma/seed.ts` (líneas ~283-350), con las etapas correctas

Pantalla admin `app/broker/crm/workflows/page.tsx` + APIs CRUD/reorder
✅ Funcional

Auto-creación de `CrmWorkflowInstance` al crear un `CrmDeal`
✅ Implementado en `app/api/crm/deals/route.ts` (línea ~147)

**Checklist configurable visible en el detalle del Deal**
❌ **NO existe.** `components/broker/crm/deal-drawer.tsx` (línea 428) solo renderiza `<StageChecklist dealId={deal.id} .../>`, el checklist fijo de `CrmDealStage`. No hay ningún componente que lea `CrmWorkflowInstanceStage`.

**Progreso de la instancia reflejado en la pestaña "Progreso" del contacto**
❌ **NO existe.** Cero referencias a `WorkflowInstance` en `components/broker/crm/contact-detail-tabs.tsx`.

`getBrokerGoalInsights()` en `lib/goal-engine.ts` (desglose de pipeline + predicción de 3 KPIs)
⚠️ **Existe pero es código muerto.** `grep -rl "getBrokerGoalInsights"` en todo el repo solo devuelve el propio archivo donde se define. Ningún API route la llama, ninguna página la consume.

Chequeo de "historial insuficiente antes de predecir"
❌ No implementado — la fórmula de predicción corre siempre, sin condición de datos mínimos.

`GoalDashboard` (`components/broker/crm/goal-dashboard.tsx`) y `app/broker/crm/goals/page.tsx`
Solo muestran meta vs. actual. Cero desglose, cero clic, cero predicción.

`lib/crm-saved-views.ts` — entidades soportadas
Solo `'CONTACTS' | 'PROPERTIES' | 'MANDATES' | 'PAYMENTS' | 'MAINTENANCE'`. **No incluye `'DEALS'`**, que es indispensable para cualquier desglose de Pipeline/Negociaciones/Contratos.

`app/api/broker/goals/weekly-compare/route.ts` + `components/broker/goals/verlauf-chart.tsx`
✅ Ya existe una comparación semanal funcional. **Reutilízala**, no la dupliques.

`CrmDeal` — campos disponibles
Tiene `stage, phase, operationType, value, commission, dueDate, status, wonAt`. **No tiene `priority` ni `riskScore`.** `CrmPriority` como enum solo se usa hoy en otro modelo (contacto/actividad), no en `CrmDeal`.

**Conclusión obligatoria para este prompt**: no se puede construir el Centro de Planificación Comercial sobre una base donde el Goal Engine predictivo nunca llegó al usuario. Por eso este prompt tiene una **Etapa 0 de cierre de brechas** que es un prerrequisito bloqueante — no se avanza al Módulo 2 sin cerrarla y probarla.

---

## ARQUITECTURA OBJETIVO (para tener el mapa completo en la cabeza)

```
Dashboard
   │
   ▼
Centro de Planificación Comercial (dentro de /broker/crm/goals, o /broker/crm/planning)
   │
   ├── Tab Pipeline     → workflows activos (CrmDeal + CrmWorkflowInstance)
   ├── Tab Estrategias  → CrmStrategy (nuevo) → genera Tasks
   └── Tab KPIs         → Goal Engine extendido con desglose + drill-down + predicción
   │
   ▼
Calendar / Tasks / Timeline
   │
   ▼
Resultados → actualizan Dashboard
```

Reglas duras (igual que v6, no se relajan):

- NO crear un segundo motor de KPIs. Extender `lib/goal-engine.ts`.
- NO crear un segundo motor de queries filtradas. Extender `lib/crm-saved-views.ts` (agregar entidad `DEALS`).
- NO duplicar el checklist de etapas. Un solo componente debe decidir si renderiza `CrmDealStage` fijo o `CrmWorkflowInstanceStage` configurable, según si el deal tiene instancia.
- NO duplicar la tira de comparación semanal. Reutilizar `weekly-compare` + `verlauf-chart.tsx`.
- Todo dato debe salir de una consulta real. Ningún número de ejemplo en el código final.

---

## ETAPA 0 — Cierre de brechas del v6 (bloqueante, se hace primero)

### 0.1 — Extender el motor de Vistas Guardadas para soportar `DEALS`

Archivo: `lib/crm-saved-views.ts`

- Agrega `'DEALS'` a `CrmSavedViewEntity`.
- Implementa el bloque `if (entity === 'DEALS') { ... }` siguiendo exactamente el mismo patrón que los bloques existentes (`CONTACTS`, `PROPERTIES`, etc.): debe soportar filtros por `stage`, `operationType`, `status`, `brokerId`, y por `workflowInstance.currentStageId` cuando el deal tenga workflow configurable.
- Actualiza cualquier tipo/validación de `entity` en los API routes que ya consumen `crm-saved-views.ts` (búscalos con `grep -rl "crm-saved-views" app/`) para que acepten `'DEALS'` sin romper los existentes.

**Checklist de aceptación 0.1**

- [ ] `'DEALS'` agregado al tipo `CrmSavedViewEntity`.
- [ ] Query real de deals filtrada, probada contra al menos 2 combinaciones de filtros distintas.
- [ ] Ningún endpoint existente que use `crm-saved-views.ts` se rompió (verifícalo llamándolos).

---

### 0.2 — Conectar `getBrokerGoalInsights` de punta a punta (dejar de ser código muerto)

**Archivo `lib/goal-engine.ts`** — modifica `getBrokerGoalInsights(brokerId)`:

1. Agrega el chequeo de historial mínimo que pedía el v6 y nunca se implementó. Antes de calcular cualquier predicción:

- Cuenta cuántas semanas de `BrokerGoal` + resultados reales existen para ese `brokerId` (usa `getBrokerGoalHistory` ya existente, o una query directa a `CrmDeal`/`CrmActivity` agrupada por semana).
- Si hay menos de 2 semanas de historial con datos, la función debe devolver `{ insufficientHistory: true, message: "Se necesita más historial (mínimo 2 semanas) antes de predecir de forma confiable." }` para ese KPI específico, **en vez de** calcular `probability`.
- Documenta este umbral (2 semanas) con un comentario explicando por qué.
2. Cada bloque del desglose (`contacts.breakdown`, `visits.*`, `deals.*`) debe devolver, junto al número, los **parámetros de filtro exactos** que hay que pasarle a `crm-saved-views.ts` (entidad `DEALS` o `CONTACTS`, y el filtro) para que el frontend pueda armar el link clickeable sin adivinar. Ejemplo de forma de retorno:

```
deals: {  readyForSignature: { count: 3, savedViewQuery: { entity: 'DEALS', filters: { stage: 'FIRMA_CONTRATO', status: 'ACTIVE', brokerId } } },  waitingDocs: { count: 5, savedViewQuery: { entity: 'DEALS', filters: { stage: 'DOCS_REVISION', brokerId } } },  negotiating: { count: 6, savedViewQuery: { entity: 'DEALS', filters: { stage: 'NEGOCIANDO', brokerId } } },  closedThisWeek: { count: 2, savedViewQuery: { entity: 'DEALS', filters: { status: 'WON', wonAt: { gte: start, lt: end }, brokerId } } },  pipelineWeighted: 8.4,}
```
3. Documenta en un comentario, arriba de la función, la tabla de pesos usada (ya existe: `readyForSignature=0.9, waitingDocs=0.6, negotiating=0.3`) y agrega los pesos que falten para los KPIs nuevos de la Etapa 3 de este prompt (KPIs de Pipeline y Estrategias, ver más abajo).

**Nuevo API route**: `app/api/broker/goals/insights/route.ts`

- `GET`, autenticado igual que `app/api/broker/goals/route.ts` (mismo patrón `auth()` + rol `BROKER`).
- Llama a `getBrokerGoalInsights(brokerId)` y a `getBrokerGoals(brokerId)` para cruzar cada KPI con su `target` real (`BrokerGoal.target`), y devuelve la predicción calculada con esa meta real (no una meta hardcodeada).
- Responde `{ insights }` con la forma completa descrita arriba.

**Checklist de aceptación 0.2**

- [ ] `grep -rl "getBrokerGoalInsights"` devuelve el archivo de definición **y** el nuevo API route (ya no es código muerto).
- [ ] Estado de "historial insuficiente" verificado manualmente con un broker/seed sin historial.
- [ ] Cada bloque de desglose devuelve su `savedViewQuery` listo para usar.

---

### 0.3 — UI del desglose de KPIs con drill-down tipo PMG (esto es lo que pediste llenar en "Metas")

**Archivo**: `components/broker/crm/goal-dashboard.tsx` (extender, no reemplazar) y/o crear `components/broker/crm/goal-insight-card.tsx` nuevo si el archivo actual se vuelve muy grande (>250 líneas — decide y documenta cuál hiciste).

Comportamiento exacto a implementar (replicando el ejemplo de PMG del documento de referencia):

1. Debajo de cada tarjeta de meta semanal (`Nuevos Leads`, `Visitas Agendadas`, `Contratos Cerrados`), agrega un botón/sección "Ver desglose".
2. Al hacer clic, **no** abre un formulario de edición de la meta. Abre un panel (puede ser un `Sheet`/modal reutilizando componentes de `components/ui/` ya existentes en el repo) que muestra el pipeline en cascada, exactamente como el ejemplo:

```
Contratos FirmadosMeta: 10   Actual: 4Listos para firma        3   →Esperando documentos     5   →Esperando aprobación     2   →Negociaciones            6   →Visitas                  12  →Predicción: 82%Insight: "Si conviertes dos de las seis negociaciones activas, alcanzarás la meta mensual."
```
3. Cada fila (`Listos para firma`, `Esperando documentos`, etc.) es clickeable y navega a la lista filtrada real usando el `savedViewQuery` que devuelve `getBrokerGoalInsights` (llama al endpoint de vistas guardadas existente que ya consume `crm-saved-views.ts` — búscalo con `grep -rl "crm-saved-views"` y reutilízalo, no crees uno nuevo).
4. El texto de "Insight" debe generarse a partir de los números reales (ver Etapa 0.4 de este prompt para la lógica exacta de generación de insights), nunca un texto fijo.
5. Si `insufficientHistory === true`, muestra literalmente el mensaje devuelto por la API en vez del porcentaje, con un estilo visual distinto (por ejemplo un badge neutro, no una barra de progreso a medio llenar que sugiera un dato real).

**Checklist de aceptación 0.3**

- [ ] El drill-down abre y muestra datos reales (no de ejemplo) para los 3 KPIs (Leads, Visitas, Contratos).
- [ ] Cada fila del desglose navega a un listado real filtrado.
- [ ] El estado de "historial insuficiente" se ve distinto visualmente y no muestra un porcentaje inventado.
- [ ] Nunca se abre un formulario de edición de meta al hacer clic en el KPI o en su desglose.

---

### 0.4 — Motor de Insights (texto generado, nunca fijo)

Crea una función pura `generateGoalInsight(kpi, data)` dentro de `lib/goal-engine.ts` (no un archivo nuevo, es parte del mismo motor):

- Recibe el desglose y la meta de un KPI y devuelve **una** frase priorizada según reglas deterministas documentadas en comentarios, por ejemplo (documenta las que uses, estas son de referencia):

1. Si `pipelineWeighted >= meta` → "Con el pipeline actual tienes {probability}% de probabilidad de alcanzar la meta."
2. Si falta poco y hay negociaciones activas → "Si conviertes {n} de las {total} negociaciones activas, alcanzarás la meta."
3. Si faltan visitas → "Necesitas generar aproximadamente {n} visitas más esta semana para alcanzar la meta."
4. Si `insufficientHistory` → usar el mensaje de la Etapa 0.2, punto 1.
- **Nunca** debe poder devolver una frase que no corresponda a los números calculados en la misma llamada. Prohibido usar plantillas con datos de ejemplo como fallback "bonito" — si no hay datos, usar el mensaje honesto.

**Checklist de aceptación 0.4**

- [ ] La función es pura (mismo input → mismo output), testeable manualmente con 3 escenarios distintos (meta cumplida, meta parcialmente cumplida, sin historial).
- [ ] No existe ningún string de insight hardcodeado fuera de esta función.

---

### 0.5 — Checklist configurable visible en el Deal (cerrar Etapa 3 del v6)

**Archivo**: crea `components/broker/crm/workflow-instance-checklist.tsx` (nuevo componente, siguiendo el patrón visual de `components/broker/crm/stage-checklist.tsx` para que se vea consistente).

- Recibe `dealId`, hace `fetch` a `app/api/crm/workflow-instances/by-deal/[dealId]` (ya existe, verifica su forma de respuesta con `view`) para saber si el deal tiene una `CrmWorkflowInstance`.
- Si la tiene: renderiza las `CrmWorkflowInstanceStage` en orden, con checkbox para marcar completada (llama a `app/api/crm/workflow-instances/[id]/stages` — ya existe, verifica el método soportado).
- Si NO la tiene: no renderiza nada (deja que `StageChecklist` de siempre siga funcionando solo, retrocompatibilidad obligatoria).

**Archivo**: `components/broker/crm/deal-drawer.tsx` (línea ~428)

- Cambia:

```
<StageChecklist dealId={deal.id} onCanAdvanceChange={setCanAdvance} />
```
por una lógica que decide cuál mostrar (o ambas, si decides que es más claro mostrar el checklist configurable como algo adicional en vez de reemplazo — documenta tu decisión):

```
<WorkflowInstanceChecklist dealId={deal.id} fallback={<StageChecklist dealId={deal.id} onCanAdvanceChange={setCanAdvance} />} />
```
(ajusta la firma real según cómo termines implementando el componente).

**Checklist de aceptación 0.5**

- [ ] Un deal con workflow configurable muestra su checklist real y permite marcar/avanzar etapas contra la base de datos.
- [ ] Un deal sin workflow configurable sigue funcionando exactamente igual que antes (regresión verificada).

---

### 0.6 — Reflejar el progreso del workflow en la pestaña "Progreso" del contacto (cerrar Etapa 3, punto 3 del v6)

**Archivo**: `components/broker/crm/contact-detail-tabs.tsx`

- En la pestaña donde hoy se muestra el progreso general del contacto (búscala, es la misma sección de "Horarios Preferidos" de la Etapa 0 del v6), agrega: si el contacto tiene un deal asociado con `CrmWorkflowInstance`, muestra el porcentaje de etapas completadas de esa instancia (`stages.filter(isCompleted).length / stages.length`).
- Debe ser clickeable y llevar al deal correspondiente.

**Checklist de aceptación 0.6**

- [ ] El porcentaje mostrado corresponde a datos reales de `CrmWorkflowInstanceStage`.
- [ ] Si el contacto no tiene deal con workflow, no se muestra nada (no un 0% engañoso).

---

## MÓDULO 2 — Centro de Planificación Comercial (nuevo, v7)

No avances aquí sin haber cerrado y probado toda la Etapa 0.

### Etapa 1 — Estructura de navegación (3 tabs)

Decide y documenta explícitamente una de estas dos opciones (no las mezcles a medias):

- **Opción A (recomendada, menos riesgo de regresión)**: convertir `app/broker/crm/goals/page.tsx` en un contenedor con 3 tabs: `Pipeline`, `Estrategias`, `KPIs`, moviendo el contenido actual (metas + desglose de la Etapa 0) dentro del tab `KPIs`.
- **Opción B**: nueva ruta `app/broker/crm/planning/page.tsx` con los 3 tabs, y dejar `goals/page.tsx` como redirect o como alias del tab KPIs.

Usa un componente de tabs ya existente en `components/ui/` (busca con `find components/ui -iname "*tab*"`) — no importes una librería nueva.

**Checklist de aceptación Etapa 1**

- [ ] Los 3 tabs existen y navegan sin recargar la página completa.
- [ ] El contenido de Metas/KPIs de la Etapa 0 sigue funcionando igual dentro de su tab.

---

### Etapa 2 — Tab Pipeline

Reemplaza conceptualmente "People" de PMG. Cada fila = una categoría de workflow comercial activo.

**Backend**: crea `app/api/crm/planning/pipeline/route.ts`

- Para cada categoría (`New Leads`, `Visitas Programadas`, `Negociaciones`, `Contratos`, `Propiedades Disponibles`, `Captación`, `Cobranza`, `Renovaciones`, `Mantenciones`), calcula:

- `activeItems`: total de `CrmDeal` (o `CrmContact`/`CrmActivity` según corresponda a la categoría — documenta el mapeo exacto categoría→modelo→filtro que uses) en ese estado.
- `plannedThisWeek`: de esos, cuántos tienen alguna actividad/tarea de planificación creada esta semana (define qué cuenta como "plan definido" — por ejemplo, una `CrmActivity` o `Task` creada en la semana ISO actual asociada a ese deal/contacto — documenta la regla exacta).
- Formato de salida: `{ category, plannedThisWeek, activeItems }` → el frontend arma el "18 / 42".
- Reutiliza `crm-saved-views.ts` (con la entidad `DEALS` agregada en la Etapa 0.1) para no escribir queries nuevas sueltas donde ya exista un filtro equivalente.

**Frontend**: `components/broker/crm/planning/pipeline-tab.tsx`

- Lista de filas con el formato `plannedThisWeek / activeItems`.
- Al hacer clic en una fila: abre el listado filtrado real (mismo mecanismo de vistas guardadas del resto del sistema). **Nunca** abre una pantalla de edición de KPI.
- La tabla del listado filtrado debe mostrar exactamente estas columnas (usa los datos reales de `CrmDeal`/`CrmContact`/`CrmProperty` — mapea cada una a un campo real existente, y documenta con qué campo mapeaste cada columna):

- Cliente → `CrmContact.name` (o el campo real que corresponda)
- Propiedad → `CrmProperty.address`/título (verifica el campo real)
- Etapa de Workflow → `CrmDeal.stage` o `CrmWorkflowInstanceStage` si aplica
- Próxima Acción → última `CrmActivity`/`Task` pendiente asociada
- Agente Asignado → `CrmDeal.brokerId` → nombre
- Prioridad → **no existe este campo en `CrmDeal` hoy**. No inventes un valor. Dos opciones válidas, elige una y documenta cuál:
 a) Derivarla de una regla determinista (ej. días en la etapa actual vs. promedio histórico de esa etapa → HIGH/MEDIUM/LOW), documentando la fórmula en código, o
 b) Agregar un campo `priority CrmPriority?` opcional a `CrmDeal` en el schema (migración nueva), si decides que debe ser editable manualmente por el corredor.
Si eliges (b), es un cambio de schema — trátalo con el mismo rigor que la Etapa 1 del v6 (migración real, retrocompatible, campo opcional).
- Fecha Objetivo → `CrmDeal.dueDate`
- Riesgo → mismo problema que Prioridad: no existe. Documenta una fórmula determinista (ej. dueDate vencido o próximo a vencer + sin actividad reciente = riesgo alto) en vez de inventar un número. Nunca un valor aleatorio.
- % de Completitud → si tiene `CrmWorkflowInstance`, etapas completadas / total; si no, aproxima con la posición de `CrmDealStage` dentro del enum fijo (documenta el orden que asumas).

**Checklist de aceptación Etapa 2**

- [ ] Cada categoría del pipeline muestra un conteo real `planificado / activos`.
- [ ] Clic en una fila abre un listado real con las 9 columnas pedidas, todas con datos reales o fórmulas documentadas (nunca "N/A" silencioso sin explicar por qué).
- [ ] Ninguna fila abre una pantalla de edición de KPI.

---

### Etapa 3 — Tab Estrategias

Esto es contenido nuevo, no existe nada parecido en el repo hoy — verifícalo con `grep -rl "Strategy\|Estrategia" prisma/schema.prisma lib/ components/` antes de empezar, y si encuentras algo parecido, reutilízalo en vez de duplicar.

**Modelo de datos** (agregar a `prisma/schema.prisma`, siguiendo el mismo patrón de `CrmWorkflow`/`brokerId` nullable para plantillas globales):

```
enum CrmStrategyType {
  CAPTACION_PROPIEDADES
  GENERACION_LEADS
  MARKETING
  REFERIDOS
  REACTIVACION
  INVERSIONISTAS
  OPEN_HOUSE
  ALIANZAS
}

model CrmStrategy {
  id                 String            @id @default(cuid())
  brokerId           String
  broker             User              @relation("BrokerStrategies", fields: [brokerId], references: [id])
  type               CrmStrategyType
  name               String
  goalDescription    String?
  targetNumber       Int?
  expectedConversion Float?            // porcentaje, ej. 0.25
  week               Int
  year               Int
  activities         CrmStrategyActivity[]
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  @@index([brokerId, week, year])
}

model CrmStrategyActivity {
  id            String       @id @default(cuid())
  strategyId    String
  strategy      CrmStrategy  @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  title         String
  ownerId       String?
  owner         User?        @relation("StrategyActivityOwner", fields: [ownerId], references: [id])
  dueDate       DateTime?
  taskId        String?      @unique   // vínculo a la Task real generada, si aplica
  isCompleted   Boolean      @default(false)
  createdAt     DateTime     @default(now())
}
```

Ajusta nombres de relación con `User` al patrón real ya usado (revisa cómo se nombraron las relaciones de `CrmWorkflow`/`brokerWorkflows` para copiar la convención exacta). Genera la migración real, verifica el archivo en `prisma/migrations/`.

**Backend**: `app/api/crm/strategies/route.ts` (list/create) y `app/api/crm/strategies/[id]/route.ts` (get/update/delete), más `app/api/crm/strategies/[id]/activities/route.ts`.

- Al crear una `CrmStrategyActivity` con `dueDate`, debe **crear una Task real** en el sistema de tareas existente (busca el modelo/API de Tasks con `grep -rn "model Task" prisma/schema.prisma` y el endpoint de creación, reutilízalo, no lo dupliques) y guardar su id en `taskId`.
- Al completar la Task real (desde el sistema de Tasks existente), debe reflejarse `isCompleted: true` en la `CrmStrategyActivity` correspondiente — verifica si el sistema de Tasks tiene webhooks/hooks internos o si necesitas un endpoint que ambos lados llamen; documenta el mecanismo elegido.

**Frontend**: `components/broker/crm/planning/strategies-tab.tsx`

- Tarjetas por tipo de estrategia (`CrmStrategyType`), mostrando: meta, actividades, responsable, fechas, conversión esperada vs. real (calculada comparando `targetNumber` con resultados reales del período — reutiliza la misma lógica de `getBrokerGoalInsights` donde aplique, no un cálculo paralelo), y "Contribución al Pipeline" (cuántos `CrmDeal`/`CrmContact` nuevos en el período pueden atribuirse a esa estrategia — si no hay forma de atribuir con los datos actuales, dilo explícitamente en el reporte en vez de inventar una atribución).
- Botón "Agregar estrategia" y dentro, botón "Agregar actividad" que crea la Task real.

**Checklist de aceptación Etapa 3**

- [ ] Migración real generada y verificada.
- [ ] Crear una actividad de estrategia con fecha genera una Task real en el sistema existente (verificable con un GET al endpoint de tasks).
- [ ] Completar la Task marca la actividad de estrategia como completada (o se documenta honestamente si esa sincronización no se logró completar).
- [ ] La conversión esperada vs. real usa datos reales, no de ejemplo.

---

### Etapa 4 — Tira de comparación semanal (reutilizar, no duplicar)

- El componente `components/broker/goals/verlauf-chart.tsx` y el endpoint `app/api/broker/goals/weekly-compare/route.ts` ya existen y ya cubren esto. **No crear nada nuevo.**
- Único trabajo permitido aquí: si el tab Pipeline/Estrategias necesita más métricas semanales que las que ya expone `weekly-compare` (por ejemplo, contribución de estrategias por semana), **extiende** ese mismo endpoint agregando campos al payload existente — no crees un segundo endpoint de comparación semanal.

**Checklist de aceptación Etapa 4**

- [ ] Confirmado con `grep` que no se creó ningún endpoint/componente nuevo de comparación semanal duplicado.
- [ ] Si se extendió `weekly-compare`, los campos nuevos están documentados y no rompen a los consumidores actuales del endpoint.

---

### Etapa 5 — Sincronización bidireccional (verificación, no necesariamente código nuevo)

Verifica y documenta con evidencia real (no solo "debería funcionar") cada uno de estos flujos:

- [ ] Crear/editar un ítem en el Pipeline (Etapa 2) → si genera un evento de calendario, aparece en el calendario existente.
- [ ] Completar una actividad de Estrategia (Etapa 3) → actualiza el Task real → el Workflow/Deal asociado refleja el cambio si corresponde.
- [ ] Avanzar una etapa del `CrmWorkflowInstance` (Etapa 0.5) → el KPI correspondiente en el tab KPIs (Etapa 0.3) cambia su conteo la próxima vez que se recarga (no hace falta websockets en tiempo real para este prompt — documenta explícitamente que el refresco es on-demand/on-reload, no push, si es el caso).
- [ ] El Dashboard general (fuera de este módulo) sigue mostrando datos consistentes con lo nuevo, sin fetch duplicado del mismo dato.

Si cualquiera de estos flujos no está completo, decláralo como `RECORTE:` explícito con la razón, no lo omitas del reporte.

---

## TESTING (antes de cerrar)

Verifica explícitamente, con evidencia:

- [ ] `npx tsc --noEmit` sin errores nuevos.
- [ ] `pnpm run lint` (si existe) sin errores nuevos; si no existe en este entorno, dilo explícitamente, no lo omitas.
- [ ] Navegación entre los 3 tabs sin errores de consola.
- [ ] Ningún deal existente (creado antes de este prompt) se rompió — probar al menos uno sin workflow configurable.
- [ ] Ninguna llamada duplicada al mismo endpoint en la misma carga de página (revisa con las dev tools o describiendo el flujo de `useEffect`).
- [ ] Estados de carga (`loading`) y manejo de error visibles en cada tab nuevo, no pantallas en blanco.
- [ ] Los filtros de Vistas Guardadas para la nueva entidad `DEALS` no rompieron los filtros existentes de `CONTACTS/PROPERTIES/MANDATES/PAYMENTS/MAINTENANCE`.

---

## ETAPA FINAL — Auditoría cruzada obligatoria

1. Relee este prompt completo de arriba a abajo, incluida toda la Etapa 0.
2. Entrega la tabla de trazabilidad de TODAS las etapas (0.1 a 0.6, y 1 a 5), sin filas vacías.
3. Para cada función/servicio nuevo, confirma explícitamente la cadena completa descrita en la Regla #0, punto 4 (modelo → lib → API → componente → usuario), con el `grep` que lo demuestre.
4. Entrega el checklist maestro:

```
[ ] Etapa 0.1 — Entidad DEALS agregada a crm-saved-views.ts[ ] Etapa 0.2 — getBrokerGoalInsights conectado a un API route real (ya no código muerto)[ ] Etapa 0.3 — UI de drill-down de KPIs funcional, clickeable, con datos reales[ ] Etapa 0.4 — Motor de insights generando texto desde datos reales[ ] Etapa 0.5 — Checklist configurable visible en el Deal (sin romper deals sin workflow)[ ] Etapa 0.6 — Progreso de workflow reflejado en pestaña Progreso del contacto[ ] Etapa 1 — Navegación de 3 tabs implementada[ ] Etapa 2 — Tab Pipeline con 9 columnas y drill-down real[ ] Etapa 3 — Tab Estrategias con modelo nuevo, migración real, generación de Tasks real[ ] Etapa 4 — Comparación semanal reutilizada, sin duplicados[ ] Etapa 5 — Sincronización bidireccional verificada o recortada explícitamente[ ] Testing completo sin omisiones silenciosas[ ] npx tsc --noEmit sin errores nuevos
```
5. Si algo queda parcial, dilo con total honestidad — un reporte incompleto pero honesto vale más que uno que dice "todo listo" sin serlo. Esto fue exactamente lo que falló en el v6 con el Goal Engine predictivo: existía en el código pero nadie podía verlo. No repitas ese error. verifica que no te este faltando nada de implementar aqui si ya lo implementaste y esta funciondn ocrrectamtnet sigue al otro hasta terminal todos los task modules steps
