import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  ReviewWithDetails,
  CreateReviewPayload,
  Review,
} from "@freelance/types";

/**
 * Registra una nueva reseña y calificación emitida por el cliente tras completarse una orden.
 */
export async function createReview(
  supabase: SupabaseClient<Database>,
  payload: CreateReviewPayload
): Promise<{ data: Review | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        order_id: payload.orderId,
        client_id: payload.clientId,
        freelancer_id: payload.freelancerId,
        service_id: payload.serviceId || null,
        rating: payload.rating,
        comment: payload.comment.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return {
      data: {
        id: data.id,
        orderId: data.order_id,
        clientId: data.client_id,
        freelancerId: data.freelancer_id,
        serviceId: data.service_id,
        rating: data.rating,
        comment: data.comment,
        freelancerReply: data.freelancer_reply,
        freelancerRepliedAt: data.freelancer_replied_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error desconocido al crear reseña"),
    };
  }
}

/**
 * Obtiene la reseña vinculada a una orden específica.
 */
export async function getReviewByOrderId(
  supabase: SupabaseClient<Database>,
  orderId: string
): Promise<{ data: ReviewWithDetails | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        order_id,
        client_id,
        freelancer_id,
        service_id,
        rating,
        comment,
        freelancer_reply,
        freelancer_replied_at,
        created_at,
        updated_at,
        client:profiles!reviews_client_id_fkey(id, full_name, avatar_url),
        freelancer:profiles!reviews_freelancer_id_fkey(id, full_name, avatar_url, headline),
        service:services!reviews_service_id_fkey(id, title),
        order:orders!reviews_order_id_fkey(id, title, price, completed_at)
      `)
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { data: null, error: null };

    const client = Array.isArray(data.client) ? data.client[0] : data.client;
    const freelancer = Array.isArray(data.freelancer) ? data.freelancer[0] : data.freelancer;
    const service = Array.isArray(data.service) ? data.service[0] : data.service;
    const order = Array.isArray(data.order) ? data.order[0] : data.order;

    return {
      data: {
        id: data.id,
        orderId: data.order_id,
        clientId: data.client_id,
        freelancerId: data.freelancer_id,
        serviceId: data.service_id,
        rating: data.rating,
        comment: data.comment,
        freelancerReply: data.freelancer_reply,
        freelancerRepliedAt: data.freelancer_replied_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        client: client ? {
          id: client.id,
          fullName: client.full_name,
          avatarUrl: client.avatar_url,
        } : null,
        freelancer: freelancer ? {
          id: freelancer.id,
          fullName: freelancer.full_name,
          avatarUrl: freelancer.avatar_url,
          headline: freelancer.headline,
        } : null,
        service: service ? {
          id: service.id,
          title: service.title,
        } : null,
        order: order ? {
          id: order.id,
          title: order.title,
          price: order.price,
          completedAt: order.completed_at,
        } : null,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al obtener la reseña de la orden"),
    };
  }
}

/**
 * Obtiene todas las reseñas recibidas por un freelancer con detalles del cliente y servicio.
 */
export async function getReviewsByFreelancer(
  supabase: SupabaseClient<Database>,
  freelancerId: string
): Promise<{ data: ReviewWithDetails[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        order_id,
        client_id,
        freelancer_id,
        service_id,
        rating,
        comment,
        freelancer_reply,
        freelancer_replied_at,
        created_at,
        updated_at,
        client:profiles!reviews_client_id_fkey(id, full_name, avatar_url),
        service:services!reviews_service_id_fkey(id, title),
        order:orders!reviews_order_id_fkey(id, title, price, completed_at)
      `)
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted: ReviewWithDetails[] = (data || []).map((row) => {
      const client = Array.isArray(row.client) ? row.client[0] : row.client;
      const service = Array.isArray(row.service) ? row.service[0] : row.service;
      const order = Array.isArray(row.order) ? row.order[0] : row.order;

      return {
        id: row.id,
        orderId: row.order_id,
        clientId: row.client_id,
        freelancerId: row.freelancer_id,
        serviceId: row.service_id,
        rating: row.rating,
        comment: row.comment,
        freelancerReply: row.freelancer_reply,
        freelancerRepliedAt: row.freelancer_replied_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        client: client ? {
          id: client.id,
          fullName: client.full_name,
          avatarUrl: client.avatar_url,
        } : null,
        service: service ? {
          id: service.id,
          title: service.title,
        } : null,
        order: order ? {
          id: order.id,
          title: order.title,
          price: order.price,
          completedAt: order.completed_at,
        } : null,
      };
    });

    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error("Error al obtener reseñas del freelancer"),
    };
  }
}

/**
 * Obtiene todas las reseñas asociadas a un servicio específico.
 */
export async function getReviewsByService(
  supabase: SupabaseClient<Database>,
  serviceId: string
): Promise<{ data: ReviewWithDetails[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        order_id,
        client_id,
        freelancer_id,
        service_id,
        rating,
        comment,
        freelancer_reply,
        freelancer_replied_at,
        created_at,
        updated_at,
        client:profiles!reviews_client_id_fkey(id, full_name, avatar_url),
        order:orders!reviews_order_id_fkey(id, title, price, completed_at)
      `)
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted: ReviewWithDetails[] = (data || []).map((row) => {
      const client = Array.isArray(row.client) ? row.client[0] : row.client;
      const order = Array.isArray(row.order) ? row.order[0] : row.order;

      return {
        id: row.id,
        orderId: row.order_id,
        clientId: row.client_id,
        freelancerId: row.freelancer_id,
        serviceId: row.service_id,
        rating: row.rating,
        comment: row.comment,
        freelancerReply: row.freelancer_reply,
        freelancerRepliedAt: row.freelancer_replied_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        client: client ? {
          id: client.id,
          fullName: client.full_name,
          avatarUrl: client.avatar_url,
        } : null,
        order: order ? {
          id: order.id,
          title: order.title,
          price: order.price,
          completedAt: order.completed_at,
        } : null,
      };
    });

    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error("Error al obtener reseñas del servicio"),
    };
  }
}

/**
 * Permite al freelancer responder o emitir una aclaración sobre una reseña recibida.
 */
export async function replyToReview(
  supabase: SupabaseClient<Database>,
  reviewId: string,
  reply: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from("reviews")
      .update({
        freelancer_reply: reply.trim(),
        freelancer_replied_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Error al responder la reseña"),
    };
  }
}
