import React, { useState } from "react";
import { Button } from "@freelance/ui";
import { createReview } from "@freelance/api";
import { validateReviewInput, getRatingLabel } from "@freelance/core";
import { supabase } from "../../shared/lib/supabaseClient";
import { RatingStars } from "./RatingStars";
import type { Review } from "@freelance/types";

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  clientId: string;
  freelancerId: string;
  serviceId?: string | null;
  orderTitle: string;
  freelancerName: string;
  onSuccess?: (review: Review) => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  isOpen,
  onClose,
  orderId,
  clientId,
  freelancerId,
  serviceId,
  orderTitle,
  freelancerName,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validation = validateReviewInput(rating, comment);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createReview(supabase, {
        orderId,
        clientId,
        freelancerId,
        serviceId,
        rating,
        comment,
      });

      if (error) {
        setErrors([error.message]);
      } else if (data) {
        onSuccess?.(data);
        onClose();
      }
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : "Error al enviar la reseña"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>⭐</span> Calificar Servicio & Dejar Reseña
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
        {/* Contexto del Pedido */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600">
          <p className="font-semibold text-slate-800 text-sm">{orderTitle}</p>
          <p className="mt-0.5 text-slate-500">
            Freelancer: <span className="font-medium text-slate-700">{freelancerName}</span>
          </p>
        </div>

        {/* Selector de Estrellas */}
        <div className="text-center py-2 bg-amber-50/40 rounded-xl border border-amber-100/60 p-4">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            ¿Cómo calificarías el trabajo recibido?
          </p>
          <div className="flex justify-center">
            <RatingStars
              rating={rating}
              size="lg"
              interactive={true}
              onRatingChange={(newRating) => setRating(newRating)}
            />
          </div>
          <p className="text-sm font-bold text-amber-600 mt-2">
            {rating} estrellas — {getRatingLabel(rating)}
          </p>
        </div>

        {/* Textarea Comentario */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="review-comment" className="text-xs font-semibold text-slate-700">
              Tu reseña y experiencia
            </label>
            <span className="text-[11px] text-slate-400">
              {comment.length}/2000 caracteres (mínimo 5)
            </span>
          </div>
          <textarea
            id="review-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe qué tal fue trabajar con este profesional, la calidad del entregable, la puntualidad y si lo recomendarías a otros clientes..."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-slate-400"
            disabled={loading}
          />
        </div>

        {/* Errores */}
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 space-y-1">
            {errors.map((err, idx) => (
              <p key={idx}>• {err}</p>
            ))}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-xs py-2 px-4"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || comment.trim().length < 5}
            className="text-xs py-2 px-4 bg-primary text-white font-semibold"
          >
            {loading ? "Publicando reseña..." : "Publicar Reseña"}
          </Button>
        </div>
      </form>
    </div>
  </div>
  );
};
