import React from "react";
import { Badge } from "@freelance/ui";
import { formatCurrency } from "@freelance/core";
import type { OrderStatus, EscrowHold } from "@freelance/types";

interface EscrowStatusBadgeProps {
  orderStatus: OrderStatus;
  orderPrice: number | null;
  freelancerPrice?: number | null;
  commissionAmount?: number | null;
  escrowHold?: EscrowHold | null;
  isClient: boolean;
  onOpenPaymentModal?: () => void;
}

export const EscrowStatusBadge: React.FC<EscrowStatusBadgeProps> = ({
  orderStatus,
  orderPrice,
  freelancerPrice,
  commissionAmount,
  escrowHold,
  isClient,
  onOpenPaymentModal,
}) => {
  const safeTotal = orderPrice || 0;
  const net = escrowHold?.netAmount ?? freelancerPrice ?? (orderPrice ? orderPrice / 1.12 : 0);
  const fee = escrowHold?.platformFee ?? commissionAmount ?? (orderPrice ? orderPrice - net : 0);

  if (orderStatus === "esperando_pago") {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <Badge variant="warning" size="sm">
              Esperando Depósito en Escrow
            </Badge>
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Fondos Pendientes de Custodia
          </h3>
          <p className="text-xs text-amber-950/80 leading-relaxed max-w-xl">
            {isClient
              ? `El freelancer ya definió el precio acordado (${formatCurrency(net)}). Deposita el total en garantía (${formatCurrency(safeTotal)}, incluye comisión) para que el profesional comience a trabajar.`
              : "Activaste el pago exitosamente. La orden comenzará tan pronto el cliente deposite los fondos en custodia protegida."}
          </p>
        </div>

        {isClient && onOpenPaymentModal && (
          <button
            onClick={onOpenPaymentModal}
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md bg-accent text-primary hover:bg-accent/90 transition-all transform active:scale-95 whitespace-nowrap"
          >
            💳 Pagar y Depositar en Garantía ({formatCurrency(safeTotal)})
          </button>
        )}
      </div>
    );
  }

  if (orderStatus === "en_progreso") {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <Badge variant="accent" size="sm">
              Fondos Retenidos en Garantía (Escrow)
            </Badge>
          </div>
          <h3 className="font-bold text-emerald-950 text-sm sm:text-base">
            {formatCurrency(safeTotal)} Protegidos por la Plataforma
          </h3>
          <p className="text-xs text-emerald-900 leading-relaxed max-w-xl">
            {isClient
              ? `Tus fondos están asegurados en custodia. Se transferirán ${formatCurrency(net)} netos al freelancer una vez que revises y apruebes la entrega.`
              : `¡Fondos confirmados y retenidos de forma segura! Tienes garantizado el cobro del 100% de tu precio acordado (${formatCurrency(net)}) al completar y entregar tu trabajo.`}
          </p>
        </div>

        <div className="bg-white/80 border border-emerald-200 rounded-xl px-4 py-2.5 text-right">
          <span className="text-[10px] text-slate-400 font-medium block">Total en Custodia</span>
          <span className="text-base font-black text-emerald-700">{formatCurrency(safeTotal)}</span>
        </div>
      </div>
    );
  }

  if (orderStatus === "entregado") {
    return (
      <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <Badge variant="primary" size="sm">
              Trabajo Entregado — Fondos Listos para Liberación
            </Badge>
          </div>
          <h3 className="font-bold text-indigo-950 text-sm sm:text-base">
            Fondos en Espera de Aprobación Final
          </h3>
          <p className="text-xs text-indigo-900 leading-relaxed max-w-xl">
            {isClient
              ? `El freelancer ha entregado los requerimientos. Al presionar "Aprobar Entrega", se liberarán ${formatCurrency(net)} netos al freelancer.`
              : `Entregaste el trabajo. Esperando que el cliente verifique los archivos y apruebe la orden para liberar tus ${formatCurrency(net)} acordados.`}
          </p>
        </div>

        <div className="bg-white/90 border border-indigo-200 rounded-xl px-4 py-2 text-right">
          <span className="text-[10px] text-slate-400 font-medium block">A liberar tras aprobación</span>
          <span className="text-base font-black text-indigo-700">{formatCurrency(net)}</span>
        </div>
      </div>
    );
  }

  if (orderStatus === "aprobado" || orderStatus === "cerrado") {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <Badge variant="accent" size="sm">
              Pago Liberado Exitosamente
            </Badge>
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Transacción de Escrow Completada
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            Los fondos han sido transferidos al freelancer tras la aprobación conforme de ambas partes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-400 block">Comisión Plataforma</span>
            <span className="text-xs font-bold text-slate-700">{formatCurrency(fee)}</span>
          </div>

          <div className="bg-emerald-100/80 border border-emerald-200 rounded-xl px-4 py-1.5 text-center">
            <span className="text-[10px] text-emerald-800 font-semibold block">Neto Pagado (100%)</span>
            <span className="text-sm font-black text-emerald-700">{formatCurrency(net)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (orderStatus === "en_disputa") {
    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <Badge variant="danger" size="sm">
              Fondos Congelados en Disputa
            </Badge>
          </div>
          <h3 className="font-bold text-rose-950 text-sm sm:text-base">
            Intervención de Soporte Requerida
          </h3>
          <p className="text-xs text-rose-900 leading-relaxed max-w-xl">
            Los fondos están retenidos de manera segura por el mediador de la plataforma hasta que se evalúe la evidencia presentada por ambas partes.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
