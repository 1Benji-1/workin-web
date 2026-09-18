import { useState, useEffect, useCallback, useMemo } from "react";
import type { ReviewWithDetails, RatingSummary, Review } from "@freelance/types";
import {
  getReviewsByFreelancer,
  getReviewsByService,
  getReviewByOrderId,
} from "@freelance/api";
import { calculateAverageRating } from "@freelance/core";
import { supabase } from "../shared/lib/supabaseClient";

interface UseReviewsOptions {
  freelancerId?: string;
  serviceId?: string;
  orderId?: string;
  autoFetch?: boolean;
}

export function useReviews({
  freelancerId,
  serviceId,
  orderId,
  autoFetch = true,
}: UseReviewsOptions) {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [orderReview, setOrderReview] = useState<ReviewWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(autoFetch));
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      if (orderId) {
        const { data, error: ordErr } = await getReviewByOrderId(supabase, orderId);
        if (ordErr) throw ordErr;
        setOrderReview(data);
      }

      if (freelancerId) {
        const { data, error: fErr } = await getReviewsByFreelancer(supabase, freelancerId);
        if (fErr) throw fErr;
        setReviews(data);
      } else if (serviceId) {
        const { data, error: sErr } = await getReviewsByService(supabase, serviceId);
        if (sErr) throw sErr;
        setReviews(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar reseñas");
    } finally {
      setLoading(false);
    }
  }, [freelancerId, serviceId, orderId]);

  useEffect(() => {
    if (autoFetch && (freelancerId || serviceId || orderId)) {
      fetchReviews();
    }
  }, [autoFetch, freelancerId, serviceId, orderId, fetchReviews]);

  // Suscripción en tiempo real a reseñas
  useEffect(() => {
    if (!autoFetch || (!freelancerId && !serviceId && !orderId)) return;

    const channelName = `reviews_realtime_${orderId || freelancerId || serviceId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        () => {
          fetchReviews(true);
        }
      )
      .subscribe();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchReviews(true);
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [autoFetch, freelancerId, serviceId, orderId, fetchReviews]);

  // Cálculo memoizado de estadísticas de calificación
  const summary: RatingSummary = useMemo(() => {
    const ratings = reviews.map((r) => r.rating);
    return calculateAverageRating(ratings);
  }, [reviews]);

  const handleReviewCreated = useCallback((newReview: Review) => {
    // Si estamos en contexto de orden, actualizamos orderReview
    setOrderReview((prev) => ({
      ...(prev || {}),
      ...newReview,
    }));
    // Si estamos listando, recargamos
    fetchReviews();
  }, [fetchReviews]);

  const handleReplyAdded = useCallback((reviewId: string, reply: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              freelancerReply: reply,
              freelancerRepliedAt: new Date().toISOString(),
            }
          : r
      )
    );
    if (orderReview && orderReview.id === reviewId) {
      setOrderReview((prev) =>
        prev
          ? {
              ...prev,
              freelancerReply: reply,
              freelancerRepliedAt: new Date().toISOString(),
            }
          : null
      );
    }
  }, [orderReview]);

  return {
    reviews,
    orderReview,
    summary,
    loading,
    error,
    refetch: fetchReviews,
    handleReviewCreated,
    handleReplyAdded,
  };
}
