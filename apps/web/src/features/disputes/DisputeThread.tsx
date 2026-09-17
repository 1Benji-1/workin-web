import React, { useState } from "react";
import { Badge, Button, Card } from "@freelance/ui";
import {
  getDisputeStatusMeta,
  getDisputeReasonLabel,
  getDisputeDecisionLabel,
} from "@freelance/core";
import { DisputeResolutionModal } from "./DisputeResolutionModal";
import type { DisputeWithDetails, DisputeDecision } from "@freelance/types";

interface DisputeThreadProps {
  dispute: DisputeWithDetails;
  currentUserId?: string;
  orderPrice: number;
  userRoles?: string[];
  onSendMessage: (message: string) => Promise<{ success: boolean; error?: string | null }>;
  onResolveDispute: (
    decision: DisputeDecision,
    freelancerPercentage: number,
    notes: string
  ) => Promise<{ success: boolean; error?: string | null }>;
}

export const DisputeThread: React.FC<DisputeThreadProps> = ({
  dispute,
  currentUserId,
  orderPrice,
  userRoles = [],
  onSendMessage,
  onResolveDispute,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const statusMeta = getDisputeStatusMeta(dispute.status);
  const isResolved = dispute.status === "resolved";
  const isSupportOrAdmin = userRoles.includes("soporte") || userRoles.includes("admin");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setErrorMsg(null);
    const res = await onSendMessage(newMessage.trim());
    setIsSending(false);

    if (res.success) {
      setNewMessage("");
    } else {
      setErrorMsg(res.error || "No se pudo enviar el mensaje.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Estado de la Disputa */}
      <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/80 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <Badge variant={statusMeta.badgeVariant} size="sm">
                {statusMeta.label}
              </Badge>
              <span className="text-[11px] text-slate-400">
                Iniciada el {new Date(dispute.createdAt).toLocaleDateString("es-ES")}
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Motivo: {getDisputeReasonLabel(dispute.reason)}
            </h3>
            <p className="text-xs text-rose-950/80 leading-relaxed max-w-2xl">
              {dispute.description}
            </p>
          </div>

          {!isResolved && (
            <Button
              size="sm"
              onClick={() => setShowResolutionModal(true)}
              className="bg-primary hover:bg-primary/90 text-white font-bold whitespace-nowrap self-start sm:self-center shadow-md"
            >
              ⚖️ Emitir Veredicto {isSupportOrAdmin ? "(Soporte)" : "(Modo Demo)"}
            </Button>
          )}
        </div>

        {/* Notificación de fondos retenidos */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-rose-200/60">
          <span>🔒</span>
          <span>
            Fondos en custodia protegidos ($<strong>{orderPrice.toFixed(2)} USD</strong>). Ninguna parte podrá disponer del saldo hasta que concluya la mediación.
          </span>
        </div>
      </div>

      {/* Tarjeta de Veredicto Final si ya está resuelta */}
      {isResolved && dispute.resolution && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <Badge variant="accent" size="sm">
              Veredicto Oficial Emitido
            </Badge>
            <span className="text-xs text-slate-400">
              Resuelto el {new Date(dispute.resolution.createdAt).toLocaleDateString("es-ES")}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="font-black text-sm text-emerald-950">
              Resolución: {getDisputeDecisionLabel(dispute.resolution.decision)}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-200">
              "{dispute.resolution.resolutionNotes}"
            </p>
          </div>

          <div className="text-xs text-emerald-800 font-semibold flex items-center gap-3">
            <span>Porcentaje asignado al freelancer: {dispute.resolution.freelancerPercentage}%</span>
            {dispute.resolution.resolver && (
              <span className="text-[11px] text-slate-500 font-normal">
                (Mediador: {dispute.resolution.resolver.fullName || "Equipo de Soporte"})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hilo de Mensajes y Evidencias */}
      <Card
        title="Hilo de Mediación y Evidencias"
        description="Espacio formal de comunicación entre Cliente, Freelancer y el equipo de Soporte"
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto pr-1 space-y-4">
            {dispute.messages && dispute.messages.length > 0 ? (
              dispute.messages.map((msg) => {
                const isMyMessage = msg.senderId === currentUserId;
                const formattedTime = new Date(msg.createdAt).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const formattedDate = new Date(msg.createdAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                });

                if (msg.isSupport) {
                  return (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 space-y-1.5 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-900">🛡️ Mediación de Soporte Oficial</span>
                          <Badge variant="warning" size="sm">
                            Oficial
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formattedDate} · {formattedTime}
                        </span>
                      </div>
                      <p className="text-xs text-amber-950 whitespace-pre-line leading-relaxed font-medium">
                        {msg.message}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`pt-3 first:pt-0 flex flex-col ${
                      isMyMessage ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-semibold text-slate-700">
                        {isMyMessage ? "Tú" : msg.sender?.fullName || "Usuario"}
                      </span>
                      <span>·</span>
                      <span>
                        {formattedDate} {formattedTime}
                      </span>
                    </div>

                    <div
                      className={`max-w-xl rounded-2xl p-3.5 text-xs whitespace-pre-line leading-relaxed shadow-sm ${
                        isMyMessage
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aún no hay mensajes registrados en el hilo.
              </p>
            )}
          </div>

          {/* Caja para responder en el hilo (solo si la disputa está abierta) */}
          {!isResolved ? (
            <form onSubmit={handleSend} className="pt-3 border-t border-slate-100 space-y-2">
              <textarea
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tus aclaraciones, añade enlaces a pruebas o responde al mediador..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {errorMsg && (
                <div className="text-[11px] text-rose-600 font-medium">⚠️ {errorMsg}</div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">
                  Sé respetuoso y conciso para facilitar la decisión de soporte.
                </span>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSending || !newMessage.trim()}
                  className="font-bold shadow-sm"
                >
                  {isSending ? "Enviando..." : "Enviar Respuesta"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              🔒 El hilo de mediación está cerrado porque ya se emitió un veredicto final.
            </div>
          )}
        </div>
      </Card>

      {/* Modal para emitir veredicto */}
      <DisputeResolutionModal
        orderPrice={orderPrice}
        isOpen={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        onResolve={onResolveDispute}
      />
    </div>
  );
};
