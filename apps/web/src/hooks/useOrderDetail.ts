import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../shared/context/AuthContext";
import {
  getOrderById,
  activateOrderPayment,
  markOrderDelivered,
  approveOrderDelivery,
  toggleRequirementCompleted,
  addOrderRequirement,
  getEscrowByOrderId,
  processSimulatedEscrowPayment,
  releaseEscrowPayment,
} from "@freelance/api";
import { supabase } from "../shared/lib/supabaseClient";
import type { OrderWithDetails } from "@freelance/types";

interface RawOrderDetailItem {
  id: string;
  client_id: string;
  freelancer_id: string;
  service_id: string | null;
  package_id: string | null;
  title: string;
  description: string;
  price: number | string | null;
  freelancer_price?: number | string | null;
  commission_amount?: number | string | null;
  delivery_days: number;
  status: OrderWithDetails["status"];
  agreed_at: string | null;
  payment_activated_at: string | null;
  delivery_due_date: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id?: string;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  freelancer?: {
    id?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    headline?: string | null;
  } | null;
  service?: {
    id: string;
    title: string;
    cover_image?: string | null;
    category?: {
      name: string;
      icon: string | null;
    } | null;
  } | null;
  requirements?: Array<{
    id: string;
    order_id: string;
    description: string;
    is_completed: boolean;
    created_at: string;
  }> | null;
  status_history?: Array<{
    id: string;
    order_id: string;
    previous_status: string | null;
    new_status: string;
    changed_by: string;
    comment: string | null;
    created_at: string;
    changer?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  }> | null;
}

export function useOrderDetail(orderId: string | undefined) {
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrderDetail = useCallback(async (silent = false) => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const [{ data, error: sErr }, { data: escrowData }] = await Promise.all([
        getOrderById(supabase, orderId),
        getEscrowByOrderId(supabase, orderId),
      ]);

      if (sErr) {
        setError(sErr.message);
      } else if (data) {
        const item = data as unknown as RawOrderDetailItem;
        const mapped: OrderWithDetails = {
          id: item.id,
          clientId: item.client_id,
          freelancerId: item.freelancer_id,
          serviceId: item.service_id,
          packageId: item.package_id,
          title: item.title,
          description: item.description,
          price: item.price !== null && item.price !== undefined ? Number(item.price) : null,
          freelancerPrice: item.freelancer_price !== null && item.freelancer_price !== undefined ? Number(item.freelancer_price) : null,
          commissionAmount: item.commission_amount !== null && item.commission_amount !== undefined ? Number(item.commission_amount) : null,
          deliveryDays: item.delivery_days,
          status: item.status,
          agreedAt: item.agreed_at,
          paymentActivatedAt: item.payment_activated_at,
          deliveryDueDate: item.delivery_due_date,
          deliveredAt: item.delivered_at,
          completedAt: item.completed_at,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          client: {
            id: item.client?.id || item.client_id,
            fullName: item.client?.full_name || "Cliente",
            avatarUrl: item.client?.avatar_url || null,
          },
          freelancer: {
            id: item.freelancer?.id || item.freelancer_id,
            fullName: item.freelancer?.full_name || "Freelancer",
            avatarUrl: item.freelancer?.avatar_url || null,
            headline: item.freelancer?.headline || null,
          },
          service: item.service
            ? {
                id: item.service.id,
                title: item.service.title,
                coverImage: item.service.cover_image || null,
                category: item.service.category
                  ? {
                      name: item.service.category.name,
                      icon: item.service.category.icon || null,
                    }
                  : null,
              }
            : null,
          requirements: (item.requirements || []).map((r) => ({
            id: r.id,
            orderId: r.order_id,
            description: r.description,
            isCompleted: r.is_completed,
            createdAt: r.created_at,
          })),
          statusHistory: (item.status_history || []).map((h) => ({
            id: h.id,
            orderId: h.order_id,
            previousStatus: h.previous_status,
            newStatus: h.new_status,
            changedBy: h.changed_by,
            comment: h.comment,
            createdAt: h.created_at,
            changer: h.changer
              ? {
                  id: h.changer.id,
                  fullName: h.changer.full_name || "Usuario",
                  avatarUrl: h.changer.avatar_url || null,
                }
              : null,
          })),
          escrowHold: escrowData || null,
        };

        setOrder(mapped);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // Suscripción Realtime a cambios en la orden, requerimientos, historial y custodia
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order_realtime_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          fetchOrderDetail(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_requirements",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchOrderDetail(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "escrow_holds",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchOrderDetail(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_status_history",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchOrderDetail(true);
        }
      )
      .subscribe();

    // Actualizar automáticamente al volver a enfocar la ventana o pestaña
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchOrderDetail(true);
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    // Polling ligero de respaldo (cada 5s) si la pestaña está activa
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrderDetail(true);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      clearInterval(pollInterval);
    };
  }, [orderId, fetchOrderDetail]);

  // Acción: Activar Pago (Solo Freelancer)
  const activatePayment = async (freelancerPrice: number) => {
    if (!order || !user) return { success: false, error: "No autorizado" };
    setActionLoading(true);
    try {
      const { error: aErr } = await activateOrderPayment(
        supabase,
        order.id,
        freelancerPrice
      );
      if (aErr) throw aErr;
      await fetchOrderDetail();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al activar pago";
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  };

  // Acción: Marcar como Entregado (Solo Freelancer)
  const markDelivered = async (comment?: string) => {
    if (!order || !user) return { success: false, error: "No autorizado" };
    setActionLoading(true);
    try {
      const { error: dErr } = await markOrderDelivered(
        supabase,
        order.id,
        user.id,
        comment
      );
      if (dErr) throw dErr;
      await fetchOrderDetail();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al marcar entregado";
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  };

  // Acción: Depositar en Escrow (Solo Cliente)
  const depositEscrowPayment = async (paymentMethod = "tarjeta_simulada") => {
    if (!order || !user) return { success: false, error: "No autorizado" };
    setActionLoading(true);
    try {
      const { data, error: payErr } = await processSimulatedEscrowPayment(
        supabase,
        order.id,
        paymentMethod
      );
      if (payErr) throw payErr;
      await fetchOrderDetail();
      return { success: true, data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al depositar en custodia";
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  };

  // Acción: Aprobar Entrega y Liberar Fondos de Escrow (Solo Cliente)
  const approveDelivery = async (comment?: string) => {
    if (!order || !user) return { success: false, error: "No autorizado" };
    setActionLoading(true);
    try {
      // Si la orden tiene retención en custodia activa, libera los fondos de Escrow
      const { error: relErr } = await releaseEscrowPayment(
        supabase,
        order.id,
        comment
      );
      if (relErr) {
        // Fallback a approveOrderDelivery si no hubiera retención activa
        const { error: apErr } = await approveOrderDelivery(
          supabase,
          order.id,
          user.id
        );
        if (apErr) throw apErr;
      }
      await fetchOrderDetail();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al aprobar entrega y liberar fondos";
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  };

  // Acción: Toggle Requerimiento
  const toggleRequirement = async (requirementId: string, currentVal: boolean) => {
    try {
      await toggleRequirementCompleted(supabase, requirementId, !currentVal);
      // Optimistic update
      setOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          requirements: prev.requirements.map((r) =>
            r.id === requirementId ? { ...r, isCompleted: !currentVal } : r
          ),
        };
      });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Error" };
    }
  };

  // Acción: Añadir Requerimiento
  const addRequirement = async (description: string) => {
    if (!order) return { success: false };
    try {
      const { data, error: rErr } = await addOrderRequirement(
        supabase,
        order.id,
        description
      );
      if (rErr) throw rErr;
      if (data) {
        setOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            requirements: [
              ...prev.requirements,
              {
                id: data.id,
                orderId: data.order_id,
                description: data.description,
                isCompleted: data.is_completed,
                createdAt: data.created_at,
              },
            ],
          };
        });
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Error" };
    }
  };

  return {
    order,
    loading,
    error,
    actionLoading,
    refetch: fetchOrderDetail,
    activatePayment,
    depositEscrowPayment,
    markDelivered,
    approveDelivery,
    toggleRequirement,
    addRequirement,
  };
}
