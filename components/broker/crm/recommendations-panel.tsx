"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  AlertCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Percent,
} from "lucide-react";
import { Recommendation } from "@/lib/crm-recommendations";

const ICONS: Record<string, React.ReactNode> = {
  FOLLOWUP: <AlertCircle className="h-3.5 w-3.5" />,
  DEADLINE: <Clock className="h-3.5 w-3.5" />,
  STALE: <Clock className="h-3.5 w-3.5" />,
  MATCH: <TrendingUp className="h-3.5 w-3.5" />,
  RENEWAL: <TrendingUp className="h-3.5 w-3.5" />,
  RISK: <AlertTriangle className="h-3.5 w-3.5" />,
  CLOSING: <Percent className="h-3.5 w-3.5" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "border-[#ef4444]/30 bg-[#ef4444]/5",
  MEDIUM: "border-[#B8965A]/30 bg-[#B8965A]/5",
  LOW: "border-[#5E8B8C]/30 bg-[#5E8B8C]/5",
};

const PRIORITY_ICON_COLORS: Record<string, string> = {
  HIGH: "text-[#ef4444]",
  MEDIUM: "text-[#B8965A]",
  LOW: "text-[#5E8B8C]",
};

interface RecommendationsPanelProps {
  maxItems?: number;
  contactId?: string;
}

export function RecommendationsPanel({ maxItems = 5, contactId }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const query = contactId ? `?contactId=${encodeURIComponent(contactId)}` : "";
        const res = await fetch(`/api/crm/recommendations${query}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.slice(0, maxItems));
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [contactId, maxItems]);

  if (loading) {
    return (
      <div className="text-xs text-[#9C8578] p-4 animate-pulse">
        Cargando recomendaciones...
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-xs text-[#9C8578] p-4 text-center">
        ✨ Sin recomendaciones — ¡Buen trabajo!
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 border-t border-[#D5C3B6]/10">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-[#B8965A]" />
        <h3 className="text-sm font-semibold text-[#FAF6F2]">
          Acciones recomendadas
        </h3>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#B8965A]/20 text-[#B8965A]">
          {recommendations.length}
        </span>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec) => (
          <a
            key={rec.id}
            href={rec.actionUrl || "#"}
            className={`rounded-xl border p-3 transition-all hover:border-opacity-100 hover:shadow-md block ${
              PRIORITY_COLORS[rec.priority]
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`mt-0.5 shrink-0 ${
                  PRIORITY_ICON_COLORS[rec.priority]
                }`}
              >
                {ICONS[rec.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#FAF6F2]">
                  {rec.title}
                </p>
                <p className="text-xs text-[#9C8578] mt-0.5">{rec.message}</p>
                {rec.actionLabel && (
                  <span className="text-xs text-[#5E8B8C] hover:underline mt-1 inline-block font-medium">
                    {rec.actionLabel} →
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
