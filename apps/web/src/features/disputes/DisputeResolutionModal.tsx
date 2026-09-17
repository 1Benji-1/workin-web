import React, { useState } from "react";
import { Button, Card, Badge } from "@freelance/ui";
import { calculateEscrowBreakdown } from "@freelance/core";
import type { DisputeDecision } from "@freelance/core";

interface DisputeResolutionModalProps {
  orderPrice: number;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (
    decision: DisputeDecision,
    freelancerPercentage: number,
    notes: string
  ) => Promise<{ success: boolean; error?: string | null }>;
}

export const DisputeResolutionModal: React.FC<DisputeResolutionModalProps> = ({
  orderPrice,
  isOpen,
  onClose,
  onResolve,
}) => {
  const [decision, setDecision] = useState<DisputeDecision>("liberar_parcial");
  const [percentage, setPercentage] = useState<number>(50);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const breakdown = calculateEscrowBreakdown(orderPrice);
  const totalNet = breakdown.netAmount;

  // Monto a entregar al freelancer según la decisión
  const finalPercentage =
    decision === "no_liberar" ? 0 : decision === "liberar_completo" ? 100 : percentage;

  const freelancerPayoutAmount = ((totalNet * finalPercentage) / 100).toFixed(2);
  const clientRefundAmount = (
    orderPrice - Number(freelancerPayoutAmount) - (decision === "liberar_completo" ? breakdown.platformFee : 0)
  ).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setErrorMessage("Por favor ingresa las notas y justificación oficial del veredicto.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await onResolve(decision, finalPercentage, notes.trim());
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || "Ocurrió un error al emitir la resolución.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-6">
        {/* Cabecera */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <Badge variant="primary" size="sm">
                Mediación de Soporte
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Emitir Veredicto de Resolución
            </h2>
            <p className="text-xs text-slate-500">
              Monto total en disputa: <strong className="text-slate-800">${orderPrice.toFixed(2)} USD</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 text-lg p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Selector de las 3 Resoluciones */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Decisión del Mediador
            </label>

            <div className="grid gap-2">
              {/* Opción 1: No Liberar */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  decision === "no_liberar"
                    ? "border-rose-400 bg-rose-50/70 ring-1 ring-rose-400"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="no_liberar"
                  checked={decision === "no_liberar"}
                  onChange={() => setDecision("no_liberar")}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    ❌ No Liberar Fondos (Reembolso al Cliente)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    El trabajo no fue entregado o es deficiente sin posibilidad de subsanar. Se devuelven los fondos al cliente y no se paga al freelancer.
                  </span>
                </div>
              </label>

              {/* Opción 2: Liberar Completo */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  decision === "liberar_completo"
                    ? "border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-400"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="liberar_completo"
                  checked={decision === "liberar_completo"}
                  onChange={() => setDecision("liberar_completo")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    ✅ Liberar Pago Completo (100% Freelancer)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    El freelancer cumplió con los requerimientos pactados y la objeción del cliente carece de fundamento. Se transfiere el 100% neto.
                  </span>
                </div>
              </label>

              {/* Opción 3: Liberar Parcial */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  decision === "liberar_parcial"
                    ? "border-amber-400 bg-amber-50/70 ring-1 ring-amber-400"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="liberar_parcial"
                  checked={decision === "liberar_parcial"}
                  onChange={() => setDecision("liberar_parcial")}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    ⚖️ Liberar Parcialmente (Entrega Intermedia)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Hubo un avance verificable pero incompleto. Se divide el valor en el porcentaje especificado.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Slider de porcentaje si es Liberar Parcial */}
          {decision === "liberar_parcial" && (
            <Card className="p-4 bg-amber-50/50 border-amber-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Porcentaje para el Freelancer:</span>
                <span className="font-black text-sm text-primary">{percentage}%</span>
              </div>

              <input
                type="range"
                min="5"
                max="95"
                step="5"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full accent-primary"
              />

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-white p-2 rounded-lg border border-amber-200 text-center">
                  <span className="text-slate-400 block text-[10px]">Pago Freelancer ({percentage}%)</span>
                  <span className="font-black text-emerald-600">${freelancerPayoutAmount} USD</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200 text-center">
                  <span className="text-slate-400 block text-[10px]">Reembolso Cliente ({100 - percentage}%)</span>
                  <span className="font-black text-indigo-600">${clientRefundAmount} USD</span>
                </div>
              </div>
            </Card>
          )}

          {/* Justificación */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Justificación Oficial del Veredicto
            </label>
            <textarea
              rows={4}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explica el fundamento técnico y contractual de la resolución tras revisar los archivos y argumentos presentados..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              size="md"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
            >
              {isSubmitting ? "Emitiendo Veredicto..." : "⚖️ Confirmar y Ejecutar Resolución"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
