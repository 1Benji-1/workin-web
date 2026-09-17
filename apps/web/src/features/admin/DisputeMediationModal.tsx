import React, { useState, useEffect } from "react";
import type { DisputeWithDetails, OrderRequirement, DisputeMessage } from "@freelance/types";
import { calculateDisputeSplit, formatCurrency } from "@freelance/core";
import {
  resolveOrderDispute,
  getOrderRequirements,
  getDisputeMessages,
} from "@freelance/api";
import { supabase } from "../../shared/lib/supabaseClient";
import { Button } from "@freelance/ui";

interface DisputeMediationModalProps {
  dispute: DisputeWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export function DisputeMediationModal({
  dispute,
  isOpen,
  onClose,
  onResolved,
}: DisputeMediationModalProps) {
  const [activeTab, setActiveTab] = useState<"evidence" | "requirements" | "messages">("evidence");
  const [requirements, setRequirements] = useState<OrderRequirement[]>([]);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);

  // Estados del Veredicto de Mediación
  const [decision, setDecision] = useState<"no_liberar" | "liberar_completo" | "liberar_parcial">("liberar_parcial");
  const [freelancerPct, setFreelancerPct] = useState<number>(50);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const orderPrice = dispute.order?.price || 0;
  const isAlreadyResolved = dispute.status === "resolved";

  // Carga de requerimientos y mensajes de mediación
  useEffect(() => {
    if (!isOpen || !dispute.orderId) return;

    async function loadEvidence() {
      setIsLoadingEvidence(true);
      try {
        const [reqsRes, msgsRes] = await Promise.all([
          getOrderRequirements(supabase, dispute.orderId),
          getDisputeMessages(supabase, dispute.id),
        ]);
        if (reqsRes.data) setRequirements(reqsRes.data);
        if (msgsRes.data) setMessages(msgsRes.data);
      } catch (err) {
        console.error("Error al cargar evidencia:", err);
      } finally {
        setIsLoadingEvidence(false);
      }
    }

    loadEvidence();
  }, [isOpen, dispute.id, dispute.orderId]);

  if (!isOpen) return null;

  // Cálculo en vivo de la división
  const splitPct = decision === "no_liberar" ? 0 : decision === "liberar_completo" ? 100 : freelancerPct;
  const split = calculateDisputeSplit(orderPrice, splitPct);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setErrorMsg("Debes ingresar una justificación detallada para el veredicto de mediación.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { data, error } = await resolveOrderDispute(
        supabase,
        dispute.id,
        decision,
        splitPct,
        notes.trim()
      );

      if (error) throw error;
      if (data && !data.success) {
        throw new Error("No se pudo aplicar el veredicto.");
      }

      onResolved();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error al procesar veredicto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
              <span>⚖️ Herramienta de Mediación Oficial</span>
              <span>•</span>
              <span className="text-slate-500 font-normal">Caso #{dispute.id.slice(0, 8)}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              {dispute.order?.title || "Pedido en Disputa"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Valor en Escrow retenido: <span className="font-bold text-slate-900">{formatCurrency(orderPrice)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[75vh] overflow-y-auto">
          {/* Panel Izquierdo: Evidencia y Contexto (7 cols) */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-6">
            {/* Partes Involucradas */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Iniciador</span>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {dispute.initiator?.fullName || "Iniciador"}
                </p>
                <span className="text-[10px] text-slate-500">
                  {dispute.initiatorId === dispute.order?.clientId ? "Cliente (Comprador)" : "Freelancer"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Demandado</span>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {dispute.respondent?.fullName || "Demandado"}
                </p>
                <span className="text-[10px] text-slate-500">
                  {dispute.respondentId === dispute.order?.freelancerId ? "Freelancer (Prestador)" : "Cliente"}
                </span>
              </div>
            </div>

            {/* Pestañas de Evidencia */}
            <div className="flex border-b border-slate-200 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("evidence")}
                className={`pb-2 text-xs font-bold transition-colors relative ${
                  activeTab === "evidence"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Motivo y Alegatos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("requirements")}
                className={`pb-2 text-xs font-bold transition-colors relative ${
                  activeTab === "requirements"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Requerimientos ({requirements.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("messages")}
                className={`pb-2 text-xs font-bold transition-colors relative ${
                  activeTab === "messages"
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Mensajes de Mediación ({messages.length})
              </button>
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="space-y-4">
              {activeTab === "evidence" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                    <span className="text-xs font-bold text-amber-900 block mb-1">
                      Motivo Formal: {dispute.reason}
                    </span>
                    <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
                      {dispute.description}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Registrada el: {new Date(dispute.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>
              )}

              {activeTab === "requirements" && (
                <div className="space-y-2">
                  {isLoadingEvidence ? (
                    <p className="text-xs text-slate-400 py-4">Cargando requerimientos...</p>
                  ) : requirements.length > 0 ? (
                    requirements.map((req) => (
                      <div key={req.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800 block mb-1">{req.description}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Estado: <b>{req.isCompleted ? "Completado" : "Pendiente"}</b></span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No se registraron requerimientos formales.</p>
                  )}
                </div>
              )}

              {activeTab === "messages" && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {isLoadingEvidence ? (
                    <p className="text-xs text-slate-400 py-4">Cargando mensajes...</p>
                  ) : messages.length > 0 ? (
                    messages.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{m.sender?.fullName || "Usuario"}</span>
                          <span className="text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleTimeString("es-ES")}</span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{m.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">Sin mensajes adicionales en el canal de disputa.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho: Veredicto de Mediación (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-50/40 flex flex-col justify-between space-y-6">
            {isAlreadyResolved ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <span className="text-2xl">✅</span>
                <h3 className="text-sm font-bold text-emerald-900">Disputa Resuelta Oficialmente</h3>
                <p className="text-xs text-emerald-800">
                  Decisión aplicada: <b>{dispute.resolution?.decision}</b>
                </p>
                <p className="text-xs text-emerald-800">
                  Porcentaje asignado al freelancer: <b>{dispute.resolution?.freelancerPercentage}%</b>
                </p>
                {dispute.resolution?.resolutionNotes && (
                  <div className="mt-3 p-3 bg-white rounded-xl text-left border border-emerald-100 text-[11px] text-slate-700">
                    <span className="font-bold block text-slate-900 mb-0.5">Fundamentación:</span>
                    {dispute.resolution.resolutionNotes}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleResolve} className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Emitir Veredicto
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Como mediador, tu resolución sobre los fondos en custodia es final e inapelable.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Opciones de Decisión */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Selecciona el sentido del fallo:
                  </label>

                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        decision === "liberar_parcial"
                          ? "bg-amber-50/50 border-amber-300 ring-1 ring-amber-300"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === "liberar_parcial"}
                        onChange={() => setDecision("liberar_parcial")}
                        className="mt-0.5"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">División Parcial Equitativa</span>
                        <span className="text-slate-500">Divide los fondos proporcionalmente entre ambas partes.</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        decision === "liberar_completo"
                          ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === "liberar_completo"}
                        onChange={() => setDecision("liberar_completo")}
                        className="mt-0.5"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-emerald-950 block">Liberar 100% al Freelancer</span>
                        <span className="text-slate-500">El trabajo cumple con lo pactado; se liquida el monto total.</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        decision === "no_liberar"
                          ? "bg-rose-50/50 border-rose-300 ring-1 ring-rose-300"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === "no_liberar"}
                        onChange={() => setDecision("no_liberar")}
                        className="mt-0.5"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-rose-950 block">Reembolso 100% al Cliente</span>
                        <span className="text-slate-500">Incumplimiento total; los fondos regresan al cliente.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Slider para división parcial */}
                {decision === "liberar_parcial" && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700">Porcentaje para Freelancer:</span>
                      <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-sm">
                        {freelancerPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="99"
                      value={freelancerPct}
                      onChange={(e) => setFreelancerPct(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1% (Casi todo cliente)</span>
                      <span>50% (Mitad)</span>
                      <span>99% (Casi todo freelancer)</span>
                    </div>
                  </div>
                )}

                {/* Previsualización de Distribución Financiera */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Reembolso al Cliente:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(split.clientRefund)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Liquidación al Freelancer:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(split.freelancerNet)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-1">
                    <span>Comisión WorkIn (10% sobre pago):</span>
                    <span>{formatCurrency(split.platformFee)}</span>
                  </div>
                </div>

                {/* Justificación obligatoria */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Fundamentación del Fallo (Visible para ambas partes):
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe los motivos basados en la evidencia revisada..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  />
                </div>

                {/* Botón de Ejecución */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-xs font-bold py-2.5"
                >
                  {isSubmitting ? "Ejecutando Veredicto..." : "⚖️ Confirmar y Ejecutar Veredicto"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
