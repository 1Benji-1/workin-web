import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getDisputesQueue } from "@freelance/api";
import type { DisputeQueueItem } from "@freelance/api";
import { getDisputeStatusMeta, getDisputeReasonLabel } from "@freelance/core";
import { supabase } from "../../shared/lib/supabaseClient";
import { Card, Button, Badge } from "@freelance/ui";

export default function DisputesQueuePage() {
  const [disputes, setDisputes] = useState<DisputeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiErr } = await getDisputesQueue(supabase);
      if (apiErr) {
        setError(apiErr.message);
      } else {
        setDisputes(data || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar disputas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const filtered = disputes.filter((d) => {
    if (filter === "open") return d.status === "open" || d.status === "under_review";
    if (filter === "resolved") return d.status === "resolved";
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="danger" size="sm">
              Soporte y Mediación
            </Badge>
            <span className="text-xs text-slate-400">Resolución de Controversias</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bandeja de Disputas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Panel de supervisión y mediación de órdenes en conflicto con retención de fondos Escrow.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Todas ({disputes.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "open" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Pendientes ({disputes.filter((d) => d.status === "open" || d.status === "under_review").length})
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "resolved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Resueltas ({disputes.filter((d) => d.status === "resolved").length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Cargando controversias...
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-center space-y-3">
          <span className="text-3xl block">⚠️</span>
          <p className="text-sm font-semibold text-red-800">Error al cargar controversias</p>
          <p className="text-xs text-red-600">{error}</p>
          <button
            onClick={() => loadDisputes()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center space-y-2">
            <span className="text-3xl">🕊️</span>
            <h3 className="font-bold text-sm text-slate-800">
              No hay disputas en esta vista
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Todas las órdenes se encuentran en curso pacífico o no hay casos abiertos con el filtro seleccionado.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((disp) => {
            const meta = getDisputeStatusMeta(disp.status);
            const dateStr = new Date(disp.createdAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <Card key={disp.id} className="p-5 hover:border-slate-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={meta.badgeVariant} size="sm">
                        {meta.label}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        Iniciada el {dateStr}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Orden #{disp.orderId.slice(0, 8)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 truncate">
                      {disp.orderTitle || "Orden de Servicio"}
                    </h3>

                    <p className="text-xs font-semibold text-rose-800">
                      Motivo: {getDisputeReasonLabel(disp.reason)}
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                      "{disp.description}"
                    </p>

                    <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-3">
                      <span>Iniciada por: <strong className="text-slate-700">{disp.initiatorName}</strong></span>
                      <span>·</span>
                      <span>Contraparte: <strong className="text-slate-700">{disp.respondentName}</strong></span>
                      {disp.orderPrice && (
                        <>
                          <span>·</span>
                          <span>Monto en riesgo: <strong className="text-primary">${disp.orderPrice.toFixed(2)} USD</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link to={`/orders/${disp.orderId}`}>
                      <Button size="sm" className="whitespace-nowrap font-bold shadow-sm">
                        ⚖️ Ver Caso y Mediación →
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
