import React, { useState } from "react";
import { Button, Input } from "@freelance/ui";
import {
  calculateClientTotal,
  formatCurrency,
  MIN_FREELANCER_PRICE,
} from "@freelance/core";

interface SetFinalPricePanelProps {
  onConfirm: (freelancerPrice: number) => Promise<void>;
  loading?: boolean;
}

export const SetFinalPricePanel: React.FC<SetFinalPricePanelProps> = ({
  onConfirm,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [priceInput, setPriceInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericPrice = parseFloat(priceInput) || 0;
  const breakdown = calculateClientTotal(numericPrice);
  const isValidPrice = numericPrice >= MIN_FREELANCER_PRICE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPrice) {
      setErrorMsg(`El precio mínimo permitido es ${formatCurrency(MIN_FREELANCER_PRICE)}.`);
      return;
    }
    setErrorMsg(null);
    await onConfirm(numericPrice);
  };

  if (!isOpen) {
    return (
      <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
        <div className="space-y-1 max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
            ⚡ Acción requerida de tu parte
          </span>
          <h3 className="font-bold text-slate-900 text-base">
            ¿Acordaste el alcance y requerimientos con el cliente?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Define el precio final que cobrarás por este trabajo. Tú recibirás el <strong>100%</strong> de este monto; el 12% de comisión de plataforma lo asume el cliente sobre el total.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="shadow-md whitespace-nowrap bg-accent text-primary hover:bg-accent/90 font-bold"
        >
          💰 Definir precio final y activar pago
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-white p-6 shadow-md space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Paso Final del Freelancer
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            Fijar Precio Final y Activar Pago en Escrow
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-600 self-start sm:self-center"
        >
          ✕ Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5 items-start">
          {/* Input del Freelancer */}
          <div className="space-y-2">
            <Input
              label="Tu precio final (Bs)"
              type="number"
              min={MIN_FREELANCER_PRICE}
              step="any"
              placeholder="Ej: 500.00"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              required
              helperText={`Mínimo técnico: ${formatCurrency(MIN_FREELANCER_PRICE)}. Recibirás el 100% de este importe neto al aprobarse la entrega.`}
            />
          </div>

          {/* Desglose en vivo de solo lectura */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Desglose en vivo para el cliente
            </span>

            <div className="flex justify-between text-slate-600">
              <span>Tu remuneración neta (100%):</span>
              <span className="font-bold text-slate-800">
                {formatCurrency(numericPrice)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Comisión de plataforma ({breakdown.feePercentage}%):</span>
              <span className="font-mono text-slate-700">
                {formatCurrency(breakdown.commission)}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-sm">
                Total que pagará el cliente:
              </span>
              <span className="font-extrabold text-base text-primary">
                {formatCurrency(breakdown.total)}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              * El cliente depositará {formatCurrency(breakdown.total)} en Escrow. Una vez aprobado el trabajo, se te liberarán {formatCurrency(numericPrice)} íntegros.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            size="lg"
            disabled={!isValidPrice || loading}
            className="shadow-md font-bold whitespace-nowrap bg-primary hover:bg-primary/90 text-white"
          >
            {loading
              ? "Activando orden..."
              : `Confirmar y Activar Pago (${formatCurrency(breakdown.total)})`}
          </Button>
        </div>
      </form>
    </div>
  );
};
