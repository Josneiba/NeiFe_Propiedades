"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/broker/crm/kanban-column";
import {
  KanbanCard,
  type DealCardData,
} from "@/components/broker/crm/kanban-card";
import { MobileListView } from "@/components/broker/crm/mobile-list-view";
import { DealDrawer } from "@/components/broker/crm/deal-drawer";
import { NewDealModal } from "@/components/broker/crm/new-deal-modal";
import { AdminConfirmModal } from "@/components/broker/crm/admin-confirm-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw } from "lucide-react";
import { STAGE_COLUMNS, PHASE_LABELS } from "@/lib/crm-stage-utils";
import { DEFAULT_PLAYBOOK } from "@/lib/playbook-defaults";
import { CrmDealStage, CrmPhase } from "@prisma/client";
import { toast } from "sonner";

// Fases y sus columnas
const PHASES: { phase: CrmPhase; label: string; color: string }[] = [
  { phase: "PRE_VENTA", label: "Pre-Venta", color: "#1a3a5c" },
  { phase: "VENTA", label: "Venta", color: "#0e4d3a" },
  { phase: "POST_VENTA", label: "Post-Venta", color: "#4a1a5c" },
];

// Filtro de columnas visibles — el corazón del nuevo sistema de filtros
type PhaseFilter = CrmPhase | "ALL";

export default function WorkspacePage() {
  const [deals, setDeals] = useState<DealCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDragDeal, setActiveDragDeal] = useState<DealCardData | null>(
    null,
  );
  const [selectedDeal, setSelectedDeal] = useState<DealCardData | null>(null);
  const [pendingAdminDeal, setPendingAdminDeal] = useState<DealCardData | null>(
    null,
  );
  const [showNewDeal, setShowNewDeal] = useState(false);

  // Filtros de columnas visibles
  const [activePhases, setActivePhases] = useState<Set<CrmPhase>>(
    new Set(["PRE_VENTA", "VENTA", "POST_VENTA"]),
  );
  const [filterOp, setFilterOp] = useState<"ALL" | "ARRIENDO" | "VENTA">("ALL");
  const [filterLandlord, setFilterLandlord] = useState<string>("ALL");
  const [landlords, setLandlords] = useState<Array<{ id: string; name: string }>>([]);

  // Nuevos filtros: búsqueda y rango de valor
  const [searchQuery, setSearchQuery] = useState("");
  const [minValue, setMinValue] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const loadDeals = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ status: "ACTIVE" });
      if (filterOp !== "ALL") params.set("operationType", filterOp);
      if (filterLandlord !== "ALL") params.set("landlordId", filterLandlord);
      const res = await fetch(`/api/crm/deals?${params}`);
      if (!res.ok) throw new Error("Error al cargar deals");
      const data = await res.json();

      // Calcular daysInStage en el cliente (o el API lo puede devolver)
      const enriched: DealCardData[] = data.map((d: any) => {
        const stageSteps = DEFAULT_PLAYBOOK.filter(s => s.stage === d.stage)
        const required = stageSteps.filter(s => s.isRequired).length
        const completedIds = new Set((d.playbookSteps ?? []).map((p: any) => p.stepId))
        const completed = stageSteps.filter(s => s.isRequired && completedIds.has(`${s.stage}-${s.order}`)).length

        return {
          id: d.id,
          code: d.code,
          title: d.title,
          stage: d.stage,
          operationType: d.operationType,
          value: d.value,
          property: d.property,
          contacts: d.contacts || [],
          lastActivityAt: d.activities?.[0]?.createdAt ?? null,
          daysInStage: 0,
          dueDate: d.dueDate ? new Date(d.dueDate) : null,
          playbookProgress: { completed, required },
        }
      });
      setDeals(enriched);
    } catch (e) {
      toast.error("No se pudieron cargar las oportunidades");
    } finally {
      setIsLoading(false);
    }
  }, [filterOp, filterLandlord]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Fetch landlords para el filtro
  useEffect(() => {
    const fetchLandlords = async () => {
      try {
        const res = await fetch('/api/broker/clientes');
        if (res.ok) {
          const data = await res.json();
          const landlordList = data.map((c: any) => ({
            id: c.landlord?.id || c.owner?.id,
            name: c.landlord?.name || c.owner?.name || 'Sin nombre'
          }));
          setLandlords(landlordList);
        }
      } catch (e) {
        console.error('Error fetching landlords:', e);
      }
    };
    fetchLandlords();
  }, []);

  // Toggle de fase (click activa/desactiva, doble click activa solo esa)
  function togglePhase(phase: CrmPhase) {
    setActivePhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        if (next.size === 1) return next; // no dejar vacío
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  }

  // Columnas visibles según filtros activos
  const visibleColumns = STAGE_COLUMNS.filter(
    (col) => activePhases.has(col.phase) || col.stage === "ADMINISTRAR",
  );

  function getDealsByStage(stage: CrmDealStage): DealCardData[] {
    let filtered = deals.filter((d) => d.stage === stage);

    // Aplicar búsqueda
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.code.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.property?.address?.toLowerCase().includes(q),
      );
    }

    // Aplicar rango de valor
    if (minValue !== null && minValue > 0) {
      filtered = filtered.filter((d) => d.value && d.value >= minValue);
    }
    if (maxValue !== null && maxValue > 0) {
      filtered = filtered.filter((d) => d.value && d.value <= maxValue);
    }

    return filtered;
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragDeal(null);
    if (!over) return;

    const draggedDeal = deals.find((d) => d.id === active.id);
    const newStage = over.id as CrmDealStage;
    if (!draggedDeal || draggedDeal.stage === newStage) return;

    // Si destino es ADMINISTRAR, mostrar modal de confirmación
    if (newStage === "ADMINISTRAR") {
      setPendingAdminDeal(draggedDeal);
      return;
    }

    // Stage gate: verificar playbook completado para transiciones críticas
    const GATED_TRANSITIONS: Partial<Record<CrmDealStage, CrmDealStage[]>> = {
      VISITA_AGENDADA: ['NUEVO_LEAD', 'CONTACTO_INICIADO'],
      OFERTA_RECIBIDA: ['VISITA_AGENDADA', 'PROPIEDAD_CAPTADA'],
      FIRMA_CONTRATO: ['NEGOCIANDO', 'DOCS_REVISION'],
      ADMINISTRAR: ['FIRMA_CONTRATO', 'ENTREGA_LLAVES'],
    }

    const requires = GATED_TRANSITIONS[newStage as CrmDealStage]
    if (requires?.includes(draggedDeal.stage as CrmDealStage)) {
      try {
        const res = await fetch(`/api/crm/deals/${draggedDeal.id}/playbook`)
        const { canAdvance } = await res.json()
        if (!canAdvance) {
          toast.error('Completa el checklist de la etapa antes de avanzar')
          return
        }
      } catch (e) {
        console.error('Error checking playbook:', e)
      }
    }

    // Optimistic update
    const prevDeals = [...deals];
    setDeals((prev) =>
      prev.map((d) =>
        d.id === draggedDeal.id ? { ...d, stage: newStage } : d,
      ),
    );

    try {
      const res = await fetch(`/api/crm/deals/${draggedDeal.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStage }),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Error al mover la oportunidad");
      }
      toast.success(
        `Movido a ${STAGE_COLUMNS.find((s) => s.stage === newStage)?.label}`,
      );
    } catch (error) {
      setDeals(prevDeals);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo mover la oportunidad",
      );
    }
  }

  async function handleAdminConfirm() {
    if (!pendingAdminDeal) return;
    try {
      const res = await fetch(`/api/crm/deals/${pendingAdminDeal.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStage: "ADMINISTRAR" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast.success("✅ Propiedad creada en administración");
      setDeals((prev) => prev.filter((d) => d.id !== pendingAdminDeal.id));
      setPendingAdminDeal(null);
      if (data.redirectTo) {
        setTimeout(() => (window.location.href = data.redirectTo), 1500);
      }
    } catch (e: any) {
      toast.error(e.message || "Error al trasladar a administración");
    }
  }

  const totalDeals = deals.length;
  const phaseBreakdown = PHASES.map((p) => ({
    ...p,
    count: deals.filter((d) => {
      const col = STAGE_COLUMNS.find((c) => c.stage === d.stage);
      return col?.phase === p.phase;
    }).length,
  }));

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header con botones fixed */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#D5C3B6]/10 sticky top-0 z-40 bg-[#1C2828]">
        <div>
          <h1 className="text-xl font-semibold text-[#FAF6F2]">Workspace</h1>
          <p className="text-xs text-[#9C8578] mt-0.5">
            {totalDeals} oportunidades activas
          </p>
        </div>
        {/* Botones agrupados a la derecha - ahora sticky */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDeals}
            className="border-[#D5C3B6]/20 text-[#9C8578] hover:text-[#FAF6F2]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={() => setShowNewDeal(true)}
            className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/80 text-[#FAF6F2]">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nueva oportunidad
          </Button>
        </div>
      </div>

      {/* Filtros de columnas visibles */}
      <div className="flex-shrink-0 flex items-center gap-2 px-6 py-3 border-b border-[#D5C3B6]/10 flex-wrap">
        {/* Todas */}
        <button
          onClick={() =>
            setActivePhases(new Set(["PRE_VENTA", "VENTA", "POST_VENTA"]))
          }
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activePhases.size === 3
              ? "bg-[#D5C3B6]/15 text-[#FAF6F2]"
              : "text-[#9C8578] hover:text-[#D5C3B6]"
          }`}
        >
          Todas
        </button>

        {/* Botón por fase — toggle individual */}
        {PHASES.map((p) => (
          <button
            key={p.phase}
            onClick={() => togglePhase(p.phase)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              activePhases.has(p.phase)
                ? "text-[#FAF6F2]"
                : "text-[#9C8578] hover:text-[#D5C3B6] opacity-50"
            }`}
            style={
              activePhases.has(p.phase)
                ? { backgroundColor: p.color + "55" }
                : {}
            }
          >
            {p.label}
            <span className="ml-1.5 opacity-70">
              {phaseBreakdown.find((pb) => pb.phase === p.phase)?.count}
            </span>
          </button>
        ))}

        {/* Separador */}
        <div className="w-px h-5 bg-[#D5C3B6]/20 mx-1" />

        {/* Filtro por tipo de operación */}
        {(["ALL", "ARRIENDO", "VENTA"] as const).map((op) => (
          <button
            key={op}
            onClick={() => setFilterOp(op)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterOp === op
                ? "bg-[#B8965A]/20 text-[#B8965A]"
                : "text-[#9C8578] hover:text-[#D5C3B6]"
            }`}
          >
            {op === "ALL"
              ? "Arriendo + Venta"
              : op === "ARRIENDO"
                ? "Solo Arriendo"
                : "Solo Venta"}
          </button>
        ))}
      </div>

      {/* Búsqueda y filtros adicionales */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#D5C3B6]/10 bg-[#1C2828]/50 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <input
            type="text"
            placeholder="Buscar código, título o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#2D3C3C] border border-[#D5C3B6]/20 rounded-lg text-[#FAF6F2] placeholder-[#9C8578] focus:outline-none focus:border-[#5E8B8C]"
          />
        </div>

        {/* Landlord Filter */}
        <select
          value={filterLandlord}
          onChange={(e) => setFilterLandlord(e.target.value)}
          className="px-3 py-1.5 text-xs bg-[#2D3C3C] border border-[#D5C3B6]/20 rounded-lg text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]"
        >
          <option value="ALL">Todos los arrendadores</option>
          {landlords.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        {/* Placeholder for Due Date Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#9C8578]">Fecha Venc.:</label>
          <input
            type="date"
            placeholder="Fecha"
            className="w-32 px-2 py-1.5 text-xs bg-[#2D3C3C] border border-[#D5C3B6]/20 rounded-lg text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C]"
          />
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs px-2 py-1 text-[#9C8578] hover:text-[#FAF6F2] transition-colors"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#9C8578] text-sm animate-pulse">
            Cargando oportunidades...
          </p>
        </div>
      ) : (
        <>
          {/* Mobile view - list */}
          <div className="lg:hidden flex-1 overflow-y-auto">
            <MobileListView deals={deals} onCardClick={setSelectedDeal} />
          </div>

          {/* Desktop view - Kanban */}
          <DndContext
            sensors={sensors}
            onDragStart={(e) => {
              const deal = deals.find((d) => d.id === e.active.id);
              setActiveDragDeal(deal ?? null);
            }}
            onDragEnd={handleDragEnd}
          >
            <div className="hidden lg:flex flex-1 overflow-x-auto overflow-y-hidden">
              <div
                className="flex gap-3 h-full px-6 py-4"
                style={{ minWidth: "max-content" }}
              >
                {visibleColumns.map((col, i) => {
                  // Separador de fase
                  const prevCol = visibleColumns[i - 1];
                  const showSeparator =
                    i > 0 && prevCol && prevCol.phase !== col.phase;

                  return (
                    <div key={col.stage} className="flex items-stretch gap-3">
                      {showSeparator && (
                        <div className="flex flex-col items-center justify-center px-1">
                          <div className="w-px flex-1 bg-[#D5C3B6]/15" />
                          <span className="text-[9px] uppercase tracking-widest text-[#9C8578]/60 rotate-90 my-4 whitespace-nowrap">
                            {PHASE_LABELS[col.phase]}
                          </span>
                          <div className="w-px flex-1 bg-[#D5C3B6]/15" />
                        </div>
                      )}
                      <KanbanColumn
                        stage={col.stage}
                        deals={getDealsByStage(col.stage)}
                        onCardClick={setSelectedDeal}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drag overlay — muestra la card mientras se arrastra */}
            <DragOverlay>
              {activeDragDeal && (
                <div className="opacity-90 shadow-2xl rotate-2">
                  <KanbanCard
                    deal={activeDragDeal}
                    stageColor={
                      STAGE_COLUMNS.find(
                        (s) => s.stage === activeDragDeal.stage,
                      )?.color ?? "#999"
                    }
                    onClick={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {/* Drawer de detalle */}
      {selectedDeal && (
        <DealDrawer
          deal={selectedDeal}
          open={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdate={loadDeals}
        />
      )}

      {/* Modal crear deal */}
      {showNewDeal && (
        <NewDealModal
          open={showNewDeal}
          onClose={() => setShowNewDeal(false)}
          onCreated={loadDeals}
        />
      )}

      {/* Modal confirmar ADMINISTRAR */}
      {pendingAdminDeal && (
        <AdminConfirmModal
          deal={pendingAdminDeal}
          open={!!pendingAdminDeal}
          onConfirm={handleAdminConfirm}
          onCancel={() => setPendingAdminDeal(null)}
        />
      )}
    </div>
  );
}
