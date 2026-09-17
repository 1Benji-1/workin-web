import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../shared/context/AuthContext";
import { getOrdersByUser } from "@freelance/api";
import { supabase } from "../shared/lib/supabaseClient";
import type { OrderWithDetails } from "@freelance/types";

interface RawOrderItem {
  id: string;
  client_id: string;
  freelancer_id: string;
  service_id: string | null;
  package_id: string | null;
  title: string;
  description: string;
  price: number | string;
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
  } | null;
  requirements?: Array<{
    id: string;
    order_id: string;
    description: string;
    is_completed: boolean;
    created_at: string;
  }> | null;
}

interface UseOrdersOptions {
  roleFilter?: "as_client" | "as_freelancer";
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: sErr } = await getOrdersByUser(
        supabase,
        user.id,
        options.roleFilter
      );

      if (sErr) {
        setError(sErr.message);
      } else if (data) {
        const rawItems = data as unknown as RawOrderItem[];
        const mapped: OrderWithDetails[] = rawItems.map((item) => ({
          id: item.id,
          clientId: item.client_id,
          freelancerId: item.freelancer_id,
          serviceId: item.service_id,
          packageId: item.package_id,
          title: item.title,
          description: item.description,
          price: Number(item.price),
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
              }
            : null,
          requirements: (item.requirements || []).map((r) => ({
            id: r.id,
            orderId: r.order_id,
            description: r.description,
            isCompleted: r.is_completed,
            createdAt: r.created_at,
          })),
          statusHistory: [],
        }));

        setOrders(mapped);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  }, [user, options.roleFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
