import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../shared/context/AuthContext";
import {
  getDisputeByOrderId,
  openOrderDispute,
  resolveOrderDispute,
  sendDisputeMessage,
} from "@freelance/api";
import { supabase } from "../shared/lib/supabaseClient";
import type { DisputeWithDetails, DisputeDecision } from "@freelance/types";

export function useDispute(orderId: string | undefined) {
  const { user, roles } = useAuth();
  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDispute = useCallback(async (silent = false) => {
    if (!orderId) {
      setDispute(null);
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const { data, error: dErr } = await getDisputeByOrderId(supabase, orderId);
      if (dErr) {
        setError(dErr.message);
      } else {
        setDispute(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la disputa");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  // Suscripción Realtime a cambios en disputas y mensajes de disputa
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`dispute_realtime_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "disputes",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchDispute(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dispute_messages",
        },
        () => {
          fetchDispute(true);
        }
      )
      .subscribe();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchDispute(true);
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDispute(true);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      clearInterval(pollInterval);
    };
  }, [orderId, fetchDispute]);

  // Abrir Disputa
  const createDispute = async (
    reason: string,
    description: string,
    initialMessage?: string
  ) => {
    if (!orderId || !user) return { success: false, error: "No autorizado" };
    setSubmitting(true);
    try {
      const { data, error: oErr } = await openOrderDispute(supabase, {
        orderId,
        reason,
        description,
        initialMessage,
      });

      if (oErr) throw oErr;
      await fetchDispute();
      return { success: true, data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al abrir la disputa";
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  // Enviar mensaje en el hilo
  const postMessage = async (message: string, attachments: unknown[] = []) => {
    if (!dispute || !user) return { success: false, error: "No autorizado" };
    setSubmitting(true);
    try {
      const isSupport = roles.includes("soporte") || roles.includes("admin");
      const { error: sErr } = await sendDisputeMessage(
        supabase,
        dispute.id,
        user.id,
        message,
        isSupport,
        attachments
      );

      if (sErr) throw sErr;
      await fetchDispute();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar mensaje";
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  // Emitir veredicto de resolución
  const resolve = async (
    decision: DisputeDecision,
    freelancerPercentage: number,
    notes: string
  ) => {
    if (!dispute || !user) return { success: false, error: "No autorizado" };
    setSubmitting(true);
    try {
      const { data, error: rErr } = await resolveOrderDispute(
        supabase,
        dispute.id,
        decision,
        freelancerPercentage,
        notes
      );

      if (rErr) throw rErr;
      await fetchDispute();
      return { success: true, data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al resolver la disputa";
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    dispute,
    loading,
    error,
    submitting,
    refetchDispute: fetchDispute,
    createDispute,
    postMessage,
    resolveDispute: resolve,
  };
}
