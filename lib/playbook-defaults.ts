import { CrmDealStage, CrmTaskType, CrmChannel } from '@prisma/client'

export type PlaybookStepDef = {
  stage: CrmDealStage
  order: number
  title: string
  description: string
  taskType: CrmTaskType
  channel: CrmChannel | null
  daysDue: number
  isRequired: boolean
}

export const DEFAULT_PLAYBOOK: PlaybookStepDef[] = [
  // NUEVO_LEAD
  {
    stage: 'NUEVO_LEAD',
    order: 1,
    title: 'Llamada de bienvenida',
    description: 'Primer contacto telefónico para entender necesidades',
    taskType: 'LLAMADA',
    channel: 'TELEFONO',
    daysDue: 1,
    isRequired: true,
  },
  {
    stage: 'NUEVO_LEAD',
    order: 2,
    title: 'WhatsApp de presentación',
    description: 'Mensaje de presentación con portafolio de propiedades',
    taskType: 'WHATSAPP',
    channel: 'WHATSAPP',
    daysDue: 1,
    isRequired: true,
  },
  {
    stage: 'NUEVO_LEAD',
    order: 3,
    title: 'Clasificar tipo de búsqueda',
    description: 'Registrar si busca arriendo, compra, sector, presupuesto',
    taskType: 'OTRO',
    channel: null,
    daysDue: 2,
    isRequired: true,
  },

  // CONTACTO_INICIADO
  {
    stage: 'CONTACTO_INICIADO',
    order: 1,
    title: 'Enviar fichas de propiedades',
    description: 'Mínimo 3 propiedades que coincidan con el perfil',
    taskType: 'EMAIL',
    channel: 'EMAIL',
    daysDue: 1,
    isRequired: true,
  },
  {
    stage: 'CONTACTO_INICIADO',
    order: 2,
    title: 'Agendar visita o video llamada',
    description: 'Confirmar fecha y hora con el cliente',
    taskType: 'REUNION',
    channel: 'WHATSAPP',
    daysDue: 3,
    isRequired: true,
  },

  // VISITA_AGENDADA
  {
    stage: 'VISITA_AGENDADA',
    order: 1,
    title: 'Confirmar visita 24h antes',
    description: 'Recordatorio por WhatsApp el día anterior',
    taskType: 'WHATSAPP',
    channel: 'WHATSAPP',
    daysDue: 1,
    isRequired: true,
  },
  {
    stage: 'VISITA_AGENDADA',
    order: 2,
    title: 'Realizar visita a propiedad',
    description: 'Ejecutar la visita y registrar feedback del cliente',
    taskType: 'VISITA',
    channel: 'PRESENCIAL',
    daysDue: 3,
    isRequired: true,
  },
  {
    stage: 'VISITA_AGENDADA',
    order: 3,
    title: 'Follow-up post visita',
    description: 'Preguntar impresión y proponer propuesta económica',
    taskType: 'LLAMADA',
    channel: 'TELEFONO',
    daysDue: 1,
    isRequired: true,
  },

  // OFERTA_RECIBIDA
  {
    stage: 'OFERTA_RECIBIDA',
    order: 1,
    title: 'Presentar oferta al propietario',
    description: 'Comunicar la oferta del cliente al arrendador',
    taskType: 'LLAMADA',
    channel: 'TELEFONO',
    daysDue: 1,
    isRequired: true,
  },
  {
    stage: 'OFERTA_RECIBIDA',
    order: 2,
    title: 'Resolver objeciones del cliente',
    description: 'Registrar objeciones y proponer contraoferta si necesario',
    taskType: 'LLAMADA',
    channel: 'TELEFONO',
    daysDue: 2,
    isRequired: false,
  },

  // DOCS_REVISION
  {
    stage: 'DOCS_REVISION',
    order: 1,
    title: 'Solicitar documentos al cliente',
    description: 'Lista: liquidaciones, contrato trabajo, RUT, referencias',
    taskType: 'WHATSAPP',
    channel: 'WHATSAPP',
    daysDue: 1,
    isRequired: true,
  },
  {
    stage: 'DOCS_REVISION',
    order: 2,
    title: 'Revisar antecedentes comerciales',
    description: 'Verificar DICOM, estabilidad laboral, ingresos',
    taskType: 'DOCUMENTO',
    channel: null,
    daysDue: 3,
    isRequired: true,
  },

  // NEGOCIANDO
  {
    stage: 'NEGOCIANDO',
    order: 1,
    title: 'Acuerdo de precio y condiciones',
    description: 'Confirmar por escrito precio final, plazo y condiciones',
    taskType: 'EMAIL',
    channel: 'EMAIL',
    daysDue: 2,
    isRequired: true,
  },

  // FIRMA_CONTRATO
  {
    stage: 'FIRMA_CONTRATO',
    order: 1,
    title: 'Coordinar firma del contrato',
    description: 'Agendar firma presencial o digital con ambas partes',
    taskType: 'REUNION',
    channel: 'PRESENCIAL',
    daysDue: 3,
    isRequired: true,
  },
  {
    stage: 'FIRMA_CONTRATO',
    order: 2,
    title: 'Recibir garantía y primer arriendo',
    description: 'Confirmar transferencias y emitir comprobantes',
    taskType: 'DOCUMENTO',
    channel: null,
    daysDue: 2,
    isRequired: true,
  },

  // ENTREGA_LLAVES
  {
    stage: 'ENTREGA_LLAVES',
    order: 1,
    title: 'Checklist de entrega',
    description: 'Completar checklist de estado de la propiedad con fotos',
    taskType: 'VISITA',
    channel: 'PRESENCIAL',
    daysDue: 2,
    isRequired: true,
  },
  {
    stage: 'ENTREGA_LLAVES',
    order: 2,
    title: 'Entregar llaves al arrendatario',
    description: 'Registro fotográfico y firma del acta de entrega',
    taskType: 'DOCUMENTO',
    channel: null,
    daysDue: 1,
    isRequired: true,
  },
]
