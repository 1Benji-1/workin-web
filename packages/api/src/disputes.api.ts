import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Dispute,
  DisputeMessage,
  DisputeResolution,
  DisputeWithDetails,
  OpenDisputePayload,
} from "@freelance/types";

export interface OpenDisputeResult {
  success: boolean;
  dispute_id: string;
  order_id: string;
  status: string;
}

export interface ResolveDisputeResult {
  success: boolean;
  dispute_id: string;
  order_id: string;
  decision: string;
  freelancer_percentage: number;
  status: string;
}

/**
 * Abre una disputa formal para una orden en curso o entregada.
 * Invoca el procedimiento atómico en PostgreSQL `open_order_dispute`.
 */
export async function openOrderDispute(
  supabase: SupabaseClient<Database>,
  payload: OpenDisputePayload
) {
  const { data, error } = await supabase.rpc("open_order_dispute", {
    p_order_id: payload.orderId,
    p_reason: payload.reason,
    p_description: payload.description,
    p_initial_message: payload.initialMessage || undefined,
  });

  return {
    data: data as unknown as OpenDisputeResult | null,
    error,
  };
}

/**
 * Emite el veredicto oficial de mediación para resolver una disputa (Soporte / Admin).
 * Invoca el procedimiento atómico `resolve_order_dispute`.
 */
export async function resolveOrderDispute(
  supabase: SupabaseClient<Database>,
  disputeId: string,
  decision: "no_liberar" | "liberar_completo" | "liberar_parcial",
  freelancerPercentage: number,
  notes: string
) {
  const { data, error } = await supabase.rpc("resolve_order_dispute", {
    p_dispute_id: disputeId,
    p_decision: decision,
    p_freelancer_percentage: freelancerPercentage,
    p_resolution_notes: notes,
  });

  return {
    data: data as unknown as ResolveDisputeResult | null,
    error,
  };
}

interface RawDisputeRow {
  id: string;
  order_id: string;
  initiator_id: string;
  respondent_id: string;
  reason: string;
  description: string;
  status: Dispute["status"];
  created_at: string;
  updated_at: string;
  initiator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  respondent?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  dispute_resolutions?: {
    id: string;
    dispute_id: string;
    resolver_id: string;
    decision: DisputeResolution["decision"];
    freelancer_percentage: number;
    resolution_notes: string;
    created_at: string;
    resolver?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

/**
 * Obtiene la disputa activa (o más reciente) asociada a una orden.
 */
export async function getDisputeByOrderId(
  supabase: SupabaseClient<Database>,
  orderId: string
) {
  const { data, error } = await supabase
    .from("disputes")
    .select(`
      id,
      order_id,
      initiator_id,
      respondent_id,
      reason,
      description,
      status,
      created_at,
      updated_at,
      initiator:initiator_id (
        id,
        full_name,
        avatar_url
      ),
      respondent:respondent_id (
        id,
        full_name,
        avatar_url
      ),
      dispute_resolutions (
        id,
        dispute_id,
        resolver_id,
        decision,
        freelancer_percentage,
        resolution_notes,
        created_at,
        resolver:resolver_id (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const row = data as unknown as RawDisputeRow;

  // Obtener mensajes del hilo
  const { data: messagesData } = await getDisputeMessages(supabase, row.id);

  const resolution = Array.isArray(row.dispute_resolutions)
    ? row.dispute_resolutions[0]
    : row.dispute_resolutions;

  const dispute: DisputeWithDetails = {
    id: row.id,
    orderId: row.order_id,
    initiatorId: row.initiator_id,
    respondentId: row.respondent_id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    initiator: row.initiator
      ? {
          id: row.initiator.id,
          fullName: row.initiator.full_name,
          avatarUrl: row.initiator.avatar_url,
        }
      : null,
    respondent: row.respondent
      ? {
          id: row.respondent.id,
          fullName: row.respondent.full_name,
          avatarUrl: row.respondent.avatar_url,
        }
      : null,
    resolution: resolution
      ? {
          id: resolution.id,
          disputeId: resolution.dispute_id,
          resolverId: resolution.resolver_id,
          decision: resolution.decision,
          freelancerPercentage: Number(resolution.freelancer_percentage),
          resolutionNotes: resolution.resolution_notes,
          createdAt: resolution.created_at,
          resolver: resolution.resolver
            ? {
                id: resolution.resolver.id,
                fullName: resolution.resolver.full_name,
                avatarUrl: resolution.resolver.avatar_url,
              }
            : null,
        }
      : null,
    messages: messagesData || [],
  };

  return { data: dispute, error: null };
}

interface RawDisputeMessageRow {
  id: string;
  dispute_id: string;
  sender_id: string;
  message: string;
  attachments: unknown;
  is_support: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Obtiene los mensajes del hilo de mediación de una disputa.
 */
export async function getDisputeMessages(
  supabase: SupabaseClient<Database>,
  disputeId: string
) {
  const { data, error } = await supabase
    .from("dispute_messages")
    .select(`
      id,
      dispute_id,
      sender_id,
      message,
      attachments,
      is_support,
      created_at,
      sender:sender_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: true });

  if (error) {
    return { data: null, error };
  }

  const messages: DisputeMessage[] = ((data as unknown as RawDisputeMessageRow[]) || []).map(
    (m) => ({
      id: m.id,
      disputeId: m.dispute_id,
      senderId: m.sender_id,
      message: m.message,
      attachments: Array.isArray(m.attachments) ? m.attachments : [],
      isSupport: m.is_support,
      createdAt: m.created_at,
      sender: m.sender
        ? {
            id: m.sender.id,
            fullName: m.sender.full_name,
            avatarUrl: m.sender.avatar_url,
          }
        : null,
    })
  );

  return { data: messages, error: null };
}

/**
 * Envía un mensaje o argumento en el hilo de la disputa.
 */
export async function sendDisputeMessage(
  supabase: SupabaseClient<Database>,
  disputeId: string,
  senderId: string,
  message: string,
  isSupport = false,
  attachments: unknown[] = []
) {
  const { data, error } = await supabase
    .from("dispute_messages")
    .insert({
      dispute_id: disputeId,
      sender_id: senderId,
      message: message.trim(),
      is_support: isSupport,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attachments: attachments as any,
    })
    .select(`
      id,
      dispute_id,
      sender_id,
      message,
      attachments,
      is_support,
      created_at
    `)
    .single();

  return { data, error };
}

export interface DisputeQueueItem extends Dispute {
  orderTitle?: string;
  orderPrice?: number;
  initiatorName?: string;
  respondentName?: string;
}

/**
 * Consulta la cola de disputas para mediación (Bandeja de Soporte / Admin).
 */
export async function getDisputesQueue(
  supabase: SupabaseClient<Database>,
  filterStatus?: Dispute["status"]
) {
  let query = supabase
    .from("disputes")
    .select(`
      id,
      order_id,
      initiator_id,
      respondent_id,
      reason,
      description,
      status,
      created_at,
      updated_at,
      orders:order_id (
        title,
        price
      ),
      initiator:initiator_id (
        full_name
      ),
      respondent:respondent_id (
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (filterStatus) {
    query = query.eq("status", filterStatus);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  const list: DisputeQueueItem[] = (data || []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    return {
      id: r.id,
      orderId: r.order_id,
      initiatorId: r.initiator_id,
      respondentId: r.respondent_id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      orderTitle: r.orders?.title,
      orderPrice: r.orders?.price ? Number(r.orders.price) : undefined,
      initiatorName: r.initiator?.full_name || "Usuario",
      respondentName: r.respondent?.full_name || "Usuario",
    };
  });

  return { data: list, error: null };
}
