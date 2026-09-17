import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { getAdminPaymentsList } from "@freelance/api";
import { formatCurrency } from "@freelance/core";
import { supabase } from "../../shared/lib/supabaseClient";
import type { AdminPaymentRecord } from "@freelance/types";
import { Badge } from "@freelance/ui";

export function PaymentsOverview() {
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await getAdminPaymentsList(supabase, statusFilter);
    if (err) {
      setError(err.message);
    } else {
      setPayments(data || []);
    }
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Cálculos rápidos sobre los registros cargados
  const totalHeld = payments
    .filter((p) => p.status === "held")
    .reduce((acc, p) => acc + p.grossAmount, 0);

  const totalFees = payments.reduce((acc, p) => acc + p.platformFee, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "held":
        return <Badge variant="warning" size="sm">En Custodia (Held)</Badge>;
      case "released":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Liberado (Payout)</span>;
      case "refunded":
        return <Badge variant="danger" size="sm">Reembolsado</Badge>;
      case "partially_released":
        return <Badge variant="accent" size="sm">División Parcial</Badge>;
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
              Control y Auditoría de Pagos en Escrow
            </h2>
            <p className="text-xs text-slate-500">
              Registro histórico y en tiempo real de retenciones en garantía simuladas y comisiones de plataforma.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todos ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("held")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "held" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                En Custodia
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("released")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === "released" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Liberados
              </button>
            </div>

            <button
              type="button"
              onClick={fetchPayments}
              className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
              title="Recargar pagos"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Tarjetas de Resumen Financiero Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase">En Custodia Activa</span>
            <p className="text-xl font-black text-amber-600 mt-1">{formatCurrency(totalHeld)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Fondos garantizados pendientes de entrega</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Comisiones Calculadas</span>
            <p className="text-xl font-black text-blue-600 mt-1">{formatCurrency(totalFees)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">10% deducido sobre operaciones filtradas</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Operaciones</span>
            <p className="text-xl font-black text-slate-900 mt-1">{payments.length} transacciones</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Escrow holds registrados en la base de datos</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            Error al consultar pagos: {error}
          </div>
        )}

        {/* Tabla de Registros de Pago */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Pedido Asociado</th>
                  <th className="py-3.5 px-4">Cliente (Pagador)</th>
                  <th className="py-3.5 px-4">Freelancer (Destino)</th>
                  <th className="py-3.5 px-4">Monto Bruto</th>
                  <th className="py-3.5 px-4">Comisión (10%)</th>
                  <th className="py-3.5 px-4">Neto a Pagar</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Fecha Retención</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Cargando movimientos financieros...
                    </td>
                  </tr>
                ) : payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-bold text-slate-900 truncate">{p.orderTitle}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Hold #{p.id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {p.clientName}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {p.freelancerName}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(p.grossAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-semibold">
                        {formatCurrency(p.platformFee)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {formatCurrency(p.netAmount)}
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(p.status)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(p.heldAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No hay registros de pagos en este estado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
