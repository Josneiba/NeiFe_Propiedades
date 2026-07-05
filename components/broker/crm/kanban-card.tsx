"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Copy, User, Home } from "lucide-react";
import { CrmDealStage } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface DealCardData {
  id: string;
  code: string;
  title: string;
  stage: CrmDealStage;
  operationType: string;
  value: number | null;
  property: { code: string; address: string; type: string } | null;
  contacts: Array<{
    contact: { id: string; code: string; name: string; phone?: string | null; email?: string | null };
    role: string;
    isPrimary: boolean;
  }>;
  lastActivityAt: Date | null;
  daysInStage: number;
  dueDate: Date | null;
  playbookProgress?: { completed: number; required: number };
}

interface KanbanCardProps {
  deal: DealCardData;
  stageColor: string;
  onClick: () => void;
}

function getDaysSince(date: Date | null): number {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function UrgencyDot({ days }: { days: number }) {
  const color = days > 5 ? "#ef4444" : days > 2 ? "#f59e0b" : "#22c55e";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
      title={`${days} días sin actividad`}
    />
  );
}

function copyToClipboard(text: string, e: React.MouseEvent) {
  e.stopPropagation();
  navigator.clipboard.writeText(text);
}

export function KanbanCard({ deal, stageColor, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deal.id,
      data: { deal },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    borderLeft: `3px solid ${stageColor}`,
  };

  const daysSinceActivity = getDaysSince(deal.lastActivityAt);
  const primaryContact =
    deal.contacts.find((c) => c.isPrimary) || deal.contacts[0];
  const secondaryContact = deal.contacts.find(
    (c) => !c.isPrimary && c !== primaryContact,
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#D5C3B6]/25 transition-all select-none min-h-[140px] flex flex-col duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-[#5E8B8C]/20 animate-fade-in-up"
      onClick={onClick}
    >
      {/* Header: código + urgencia */}
      <div className="flex items-center justify-between mb-2">
        <button
          className="font-mono text-[10px] text-[#B8965A] hover:text-[#D5C3B6] flex items-center gap-1 group"
          onClick={(e) => copyToClipboard(deal.code, e)}
          title="Copiar código"
        >
          {deal.code}
          <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <div className="flex items-center gap-1.5" {...listeners}>
          <UrgencyDot days={daysSinceActivity} />
        </div>
      </div>

      {/* Título */}
      <div className="mb-2.5">
        <p className="text-xs font-medium text-[#FAF6F2] line-clamp-2 leading-tight">
          {deal.title}
        </p>
      </div>

      {/* Contacto principal + Propiedad */}
      <div className="space-y-1.5 flex-1 mb-2">
        {primaryContact && (
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="text-[9px] text-[#9C8578] flex-shrink-0 h-4 w-4" />
            <span className="text-[9px] text-[#D5C3B6] truncate">
              {primaryContact.contact.name}
            </span>
          </div>
        )}
        {deal.property && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Home className="text-[9px] text-[#9C8578] flex-shrink-0 h-4 w-4" />
            <span className="text-[9px] text-[#D5C3B6] truncate">
              {deal.property.code} • {deal.property.address.split(",")[0]}
            </span>
          </div>
        )}
      </div>

      {/* Valor */}
      {deal.value && (
        <div className="pt-1.5 border-t border-[#D5C3B6]/10">
          <span className="text-[10px] text-[#B8965A] font-semibold">
            ${deal.value.toLocaleString("es-CL")}
          </span>
        </div>
      )}

      {/* Playbook Progress Bar */}
      {deal.playbookProgress && deal.playbookProgress.required > 0 && (
        <div className="mt-2 pt-2 border-t border-[#D5C3B6]/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-[#9C8578] uppercase font-semibold">Checklist</span>
            <span className="text-[8px] text-[#B8965A]">
              {deal.playbookProgress.completed}/{deal.playbookProgress.required}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#2D3C3C] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#5E8B8C] to-[#7BA89D] transition-all duration-300"
              style={{
                width: `${(deal.playbookProgress.completed / deal.playbookProgress.required) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
