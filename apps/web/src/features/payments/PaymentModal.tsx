import React, { useState } from "react";
import { Button, Card, Badge } from "@freelance/ui";
import { calculateEscrowBreakdown } from "@freelance/core";
import type { OrderWithDetails } from "@freelance/types";

interface PaymentModalProps {
  order: OrderWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (paymentMethod: string) => Promise<{ success: boolean; error?: string | null }>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("tarjeta_simulada");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const breakdown = calculateEscrowBreakdown(order.price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    const result = await onConfirmPayment(selectedMethod);
    setIsProcessing(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || "Ocurrió un error al procesar el depósito en custodia.");
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
              <Badge variant="accent" size="sm">
                Custodia Segura (Escrow)
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-primary">
              Depositar Fondos en Garantía
            </h2>
            <p className="text-xs text-slate-500">
              Orden: <strong className="text-slate-800">{order.title}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 text-lg p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Desglose Financiero */}
        <Card className="p-4 bg-slate-50/80 border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Desglose del Pago
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Precio acordado del servicio:</span>
              <span className="font-semibold text-slate-800">${breakdown.total.toFixed(2)} USD</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Protección y custodia de fondos (Escrow):</span>
              <span className="text-emerald-700 font-semibold">Incluida ($0.00)</span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
              <span>Comisión de plataforma ({breakdown.feePercentage}% retenida al profesional):</span>
              <span>-${breakdown.platformFee.toFixed(2)} USD</span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Monto neto que recibirá el freelancer al aprobar:</span>
              <span className="font-medium text-slate-700">${breakdown.netAmount.toFixed(2)} USD</span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-slate-900">
              <span className="font-bold text-sm">Total a pagar ahora:</span>
              <span className="text-2xl font-black text-primary">
                ${breakdown.total.toFixed(2)} <span className="text-xs font-normal text-slate-500">USD</span>
              </span>
            </div>
          </div>
        </Card>

        {/* Garantía de Seguridad */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-start gap-3">
          <span className="text-emerald-600 text-base mt-0.5">🔒</span>
          <div className="text-[11px] text-emerald-950 leading-relaxed">
            <strong>Tus fondos están protegidos al 100%.</strong> El dinero queda retenido en la plataforma y el freelancer solo lo recibirá una vez que tú revises y apruebes el trabajo final entregado.
          </div>
        </div>

        {/* Selector de Método de Pago Simulado */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Selecciona Método de Pago (Modo Demostración)
            </label>

            <div className="grid gap-2">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedMethod === "tarjeta_simulada"
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="tarjeta_simulada"
                    checked={selectedMethod === "tarjeta_simulada"}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="text-primary focus:ring-accent"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">💳 Tarjeta Débito / Crédito Simulada</span>
                    <span className="text-[10px] text-slate-500">Visa / Mastercard simulada (aprobación instantánea)</span>
                  </div>
                </div>
                <Badge variant="accent" size="sm">
                  Recomendado
                </Badge>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedMethod === "transferencia_simulada"
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transferencia_simulada"
                    checked={selectedMethod === "transferencia_simulada"}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="text-primary focus:ring-accent"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">🏦 Transferencia Bancaria Simulada</span>
                    <span className="text-[10px] text-slate-500">Depósito bancario con confirmación simulada</span>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  Demo
                </Badge>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedMethod === "saldo_demo"
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="saldo_demo"
                    checked={selectedMethod === "saldo_demo"}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="text-primary focus:ring-accent"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">🪙 Saldo de Billetera Virtual Demo</span>
                    <span className="text-[10px] text-slate-500">Fondos virtuales de prueba ilimitados</span>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  Demo
                </Badge>
              </label>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              size="lg"
              disabled={isProcessing}
              className="bg-accent text-primary hover:bg-accent/90 shadow-lg font-bold"
            >
              {isProcessing
                ? "Asegurando Fondos..."
                : `🛡️ Depositar $${breakdown.total.toFixed(2)} USD en Escrow`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
