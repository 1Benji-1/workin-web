import React from "react";
import { Badge, Card } from "@freelance/ui";
import { formatCurrency } from "@freelance/core";
import type { PayoutWithOrder } from "@freelance/api";

interface PayoutHistoryProps {
  payouts: PayoutWithOrder[];
  loading?: boolean;
}

export const PayoutHistory: React.FC<PayoutHistoryProps> = ({ payouts, loading }) => {
  if (loading) {
    return (
      <Card title="Historial de Desembolsos (Payouts)">
        <div className="py-8 text-center text-xs text-slate-400">
          Cargando historial de pagos...
        </div>
      </Card>
    );
  }

  if (payouts.length === 0) {
    return (
      <Card
        title="Historial de Desembolsos (Payouts)"
        description="Registro de transferencias y pagos liberados tras la aprobación de tus entregas"
      >
        <div className="py-8 text-center space-y-2">
          <span className="text-3xl">💵</span>
          <p className="text-xs text-slate-500 font-medium">
            Aún no tienes desembolsos registrados.
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Cuando entregues un trabajo y el cliente apruebe la orden, los fondos de Escrow se liberarán automáticamente y aparecerán aquí.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Historial de Desembolsos (Payouts)"
      description="Registro de fondos netos transferidos desde el sistema Escrow"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Orden</th>
              <th className="py-2.5 px-3">Método / Proveedor</th>
              <th className="py-2.5 px-3">ID Transferencia</th>
              <th className="py-2.5 px-3 text-right">Monto Neto</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const formattedDate = new Date(p.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                    {formattedDate}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 block max-w-xs truncate">
                      {p.orderTitle || "Orden de Servicio"}
                    </span>
                    <span className="text-[10px] text-slate-400">Ref: {p.orderId.slice(0, 8)}...</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      {p.payoutProvider === "simulado" ? "🧪 Simulado" : "💳 Stripe"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {p.providerPayoutId || "N/A"}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap font-black text-emerald-600 text-sm">
                    +{formatCurrency(p.amount)}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <Badge
                      variant={p.status === "completed" ? "accent" : p.status === "pending" ? "warning" : "danger"}
                      size="sm"
                    >
                      {p.status === "completed" ? "Completado" : p.status === "pending" ? "En Proceso" : "Fallido"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
