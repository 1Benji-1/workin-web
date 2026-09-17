import React, { useState } from "react";
import type { ReviewWithDetails } from "@freelance/types";
import { replyToReview } from "@freelance/api";
import { supabase } from "../../shared/lib/supabaseClient";
import { RatingStars } from "./RatingStars";
import { Button } from "@freelance/ui";

interface ReviewsListProps {
  reviews: ReviewWithDetails[];
  loading?: boolean;
  emptyMessage?: string;
  currentUserId?: string;
  onReplySuccess?: (reviewId: string, reply: string) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  loading = false,
  emptyMessage = "Aún no hay reseñas registradas.",
  currentUserId,
  onReplySuccess,
}) => {
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    setReplyError(null);

    try {
      const { success, error } = await replyToReview(supabase, reviewId, replyText);
      if (error) {
        setReplyError(error.message);
      } else if (success) {
        onReplySuccess?.(reviewId, replyText);
        setReplyingReviewId(null);
        setReplyText("");
      }
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : "Error al enviar réplica");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        Cargando reseñas...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <span className="text-3xl">⭐</span>
        <p className="mt-2 text-sm font-semibold text-slate-700">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Las valoraciones aparecerán aquí cuando los clientes completen sus pedidos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((rev) => {
        const isFreelancerRecipient = currentUserId === rev.freelancerId;
        const canReply = isFreelancerRecipient && !rev.freelancerReply;

        return (
          <div
            key={rev.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm"
          >
            {/* Cabecera de la reseña */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden font-bold text-slate-600 text-sm shrink-0">
                  {rev.client?.avatarUrl ? (
                    <img
                      src={rev.client.avatarUrl}
                      alt={rev.client.fullName || "Cliente"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(rev.client?.fullName || "C")[0].toUpperCase()}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {rev.client?.fullName || "Cliente verificado"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      ✓ Compra verificada
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RatingStars rating={rev.rating} size="sm" />
                    <span className="text-xs text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {rev.service?.title && (
                <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 self-start sm:self-center">
                  Servicio: <strong className="text-slate-700">{rev.service.title}</strong>
                </span>
              )}
            </div>

            {/* Texto del comentario */}
            <p className="mt-3 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
              {rev.comment}
            </p>

            {/* Réplica oficial del Freelancer */}
            {rev.freelancerReply && (
              <div className="mt-4 pl-4 border-l-2 border-primary/40 bg-slate-50/70 p-3.5 rounded-r-xl">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span>💬</span> Respuesta del profesional
                  </span>
                  {rev.freelancerRepliedAt && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.freelancerRepliedAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{rev.freelancerReply}"
                </p>
              </div>
            )}

            {/* Formulario para que el Freelancer responda */}
            {canReply && (
              <div className="mt-3 pt-2">
                {replyingReviewId === rev.id ? (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-700">
                      Responder al comentario de {rev.client?.fullName || "tu cliente"}:
                    </p>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escribe tu agradecimiento o respuesta profesional..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none bg-white"
                      disabled={submittingReply}
                    />
                    {replyError && (
                      <p className="text-xs text-red-600">{replyError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setReplyingReviewId(null);
                          setReplyText("");
                        }}
                        disabled={submittingReply}
                        className="text-xs py-1.5 px-3"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleSendReply(rev.id)}
                        disabled={submittingReply || !replyText.trim()}
                        className="text-xs py-1.5 px-3 bg-primary text-white"
                      >
                        {submittingReply ? "Enviando..." : "Publicar respuesta"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingReviewId(rev.id);
                      setReplyText("");
                      setReplyError(null);
                    }}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <span>💬</span> Responder a esta reseña
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
