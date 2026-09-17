import React, { useState } from "react";
import { Button, Card, Badge } from "@freelance/ui";
import { getDisputeReasonLabel } from "@freelance/core";
import type { DisputeReason } from "@freelance/core";

interface DisputeModalProps {
  orderId: string;
  orderTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<{ success: boolean; error?: string | null }>;
}

const DISPUTE_REASONS: DisputeReason[] = [
  "cliente_no_responde",
  "cliente_rechaza_sin_motivo",
  "entregables_incompletos",
  "calidad_deficiente",
  "desacuerdo_alcance",
  "otro",
];

export const DisputeModal: React.FC<DisputeModalProps> = ({
  orderTitle,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState<DisputeReason>("cliente_no_responde");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage("Por favor ingresa una descripción detallada de tu solicitud de mediación.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await onSubmit(selectedReason, description.trim());
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || "Ocurrió un error al abrir la disputa.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-6">
        {/* Cabecera */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <Badge variant="danger" size="sm">
                Mediación de Disputa
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Solicitar Intervención de Soporte
            </h2>
            <p className="text-xs text-slate-500">
              Orden: <strong className="text-slate-800">{orderTitle}</strong>
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

        {/* Aviso de congelamiento de fondos */}
        <Card className="p-4 bg-rose-50/80 border-rose-200">
          <div className="flex items-start gap-3">
            <span className="text-rose-600 text-base mt-0.5">🔒</span>
            <div className="text-xs text-rose-950 leading-relaxed">
              <strong>¿Qué sucede al abrir una disputa?</strong>
              <p className="text-[11px] text-rose-900 mt-1">
                Los fondos en custodia quedarán <strong>congelados preventivamente</strong>. Se abrirá un hilo formal donde ambas partes podrán presentar argumentos y evidencias para que un mediador humano del equipo de soporte emita un veredicto definitivo.
              </p>
            </div>
          </div>
        </Card>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Motivo Principal
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value as DisputeReason)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {getDisputeReasonLabel(r)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Exposición de Hechos y Argumentos
            </label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica detalladamente qué sucedió, qué requerimientos no se cumplieron o por qué consideras que el pago debe liberarse o reembolsarse..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              size="md"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md"
            >
              {isSubmitting ? "Abriendo Disputa..." : "⚖️ Confirmar y Abrir Disputa"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
