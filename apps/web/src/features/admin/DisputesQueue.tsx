import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { DisputeMediationModal } from "./DisputeMediationModal";
import { getAdminDisputesQueue } from "@freelance/api";
import { formatCurrency } from "@freelance/core";
import { supabase } from "../../shared/lib/supabaseClient";
import type { DisputeWithDetails } from "@freelance/types";
import { Badge, Button } from "@freelance/ui";

export function DisputesQueue() {
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Mediación
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await getAdminDisputesQueue(supabase, statusFilter);
    if (err) {
      setError(err.message);
    } else {
      setDisputes(data || []);
    }
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="danger" size="sm">Abierta</Badge>;
      case "under_review":
        return <Badge variant="warning" size="sm">En Revisión</Badge>;
      case "resolved":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Resuelta</span>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Cabecera y Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Cola Central de Disputas
            </h2>
            <p className="text-xs text-slate-500">
              Herramienta oficial de mediación y resolución de conflictos entre clientes y freelancers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro por estado */}
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todas ({disputes.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("open")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "open" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Abiertas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "resolved" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Resueltas
              </button>
            </div>

            <button
              type="button"
              onClick={fetchDisputes}
              className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
              title="Recargar cola"
            >
              🔄
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            Error al consultar disputas: {error}
          </div>
        )}

        {/* Tabla de Disputas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Orden / Caso</th>
                  <th className="py-3.5 px-4">Monto en Escrow</th>
                  <th className="py-3.5 px-4">Partes</th>
                  <th className="py-3.5 px-4">Motivo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && disputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Cargando casos en disputa...
                    </td>
                  </tr>
                ) : disputes.length > 0 ? (
                  disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[220px]">
                        <p className="truncate">{d.order?.title || "Pedido #" + d.orderId.slice(0, 8)}</p>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Caso #{d.id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(d.order?.price ?? 0)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px]">
                          <span className="text-slate-500">Iniciado por: </span>
                          <span className="font-bold text-slate-800">
                            {d.initiator?.fullName || "Iniciador"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          vs {d.respondent?.fullName || "Demandado"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p className="font-medium text-slate-700 truncate">{d.reason}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{d.description}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(d.status)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant={d.status === "resolved" ? "outline" : "primary"}
                          onClick={() => setSelectedDispute(d)}
                          className="text-xs py-1 px-2.5"
                        >
                          {d.status === "resolved" ? "Ver Fallo" : "⚖️ Mediar"}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <span className="text-2xl block mb-1">🎉</span>
                      No hay disputas en esta categoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Mediación */}
        {selectedDispute && (
          <DisputeMediationModal
            dispute={selectedDispute}
            isOpen={Boolean(selectedDispute)}
            onClose={() => setSelectedDispute(null)}
            onResolved={() => {
              fetchDisputes();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
