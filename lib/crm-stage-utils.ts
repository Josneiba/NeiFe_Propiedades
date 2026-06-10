// lib/crm-stage-utils.ts
import { CrmDealStage, CrmPhase } from '@prisma/client'

export const STAGE_COLUMNS: {
  stage: CrmDealStage
  label: string
  phase: CrmPhase
  color: string
}[] = [
  { stage: 'NUEVO_LEAD',        label: 'Nuevo Lead',        phase: 'PRE_VENTA',  color: '#1a3a5c' },
  { stage: 'CONTACTO_INICIADO', label: 'Contacto Iniciado', phase: 'PRE_VENTA',  color: '#1a3a5c' },
  { stage: 'VISITA_AGENDADA',   label: 'Visita Agendada',   phase: 'PRE_VENTA',  color: '#1a3a5c' },
  { stage: 'PROPIEDAD_CAPTADA', label: 'Propiedad Captada', phase: 'PRE_VENTA',  color: '#1a3a5c' },
  { stage: 'PUBLICADA',         label: 'Publicada',         phase: 'VENTA',      color: '#0e4d3a' },
  { stage: 'MOSTRANDO',         label: 'Mostrando',         phase: 'VENTA',      color: '#0e4d3a' },
  { stage: 'OFERTA_RECIBIDA',   label: 'Oferta Recibida',   phase: 'VENTA',      color: '#0e4d3a' },
  { stage: 'DOCS_REVISION',     label: 'Docs Revisión',     phase: 'VENTA',      color: '#0e4d3a' },
  { stage: 'NEGOCIANDO',        label: 'Negociando',        phase: 'VENTA',      color: '#0e4d3a' },
  { stage: 'FIRMA_CONTRATO',    label: 'Firma Contrato',    phase: 'POST_VENTA', color: '#4a1a5c' },
  { stage: 'ENTREGA_LLAVES',    label: 'Entrega / Llaves',  phase: 'POST_VENTA', color: '#4a1a5c' },
  { stage: 'ADMINISTRAR',       label: 'Administrar',       phase: 'POST_VENTA', color: '#c9a84c' },
]

export const PHASE_LABELS: Record<CrmPhase, string> = {
  PRE_VENTA:  'Pre-Venta',
  VENTA:      'Venta',
  POST_VENTA: 'Post-Venta',
}

export function getPhaseFromStage(stage: CrmDealStage): CrmPhase {
  return STAGE_COLUMNS.find((s) => s.stage === stage)?.phase ?? 'PRE_VENTA'
}

export function getStageColor(stage: CrmDealStage): string {
  return STAGE_COLUMNS.find((s) => s.stage === stage)?.color ?? '#999999'
}

export function getStageLabel(stage: CrmDealStage): string {
  return STAGE_COLUMNS.find((s) => s.stage === stage)?.label ?? stage
}
