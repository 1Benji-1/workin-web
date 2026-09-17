import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Role,
  AdminDashboardMetrics,
  AdminUserItem,
  AdminPaymentRecord,
  UpdateUserRolePayload,
  DisputeWithDetails,
} from "@freelance/types";
import { resolveOrderDispute } from "./disputes.api";

/**
 * Consulta las métricas globales del Backoffice administrativo en tiempo real.
 */
export async function getAdminDashboardMetrics(
  supabase: SupabaseClient<Database>
): Promise<{ data: AdminDashboardMetrics | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("get_admin_dashboard_metrics" as unknown as never);
    if (error) throw error;

    return {
      data: data as unknown as AdminDashboardMetrics,
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al obtener métricas de administración"),
    };
  }
}

/**
 * Consulta la cola completa de disputas de la plataforma para mediación.
 */
export async function getAdminDisputesQueue(
  supabase: SupabaseClient<Database>,
  statusFilter?: string
): Promise<{ data: DisputeWithDetails[] | null; error: Error | null }> {
  try {
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
        order:orders!disputes_order_id_fkey(
          id,
          title,
          price,
          status,
          client_id,
          freelancer_id,
          service_id
        ),
        initiator:profiles!disputes_initiator_id_fkey(id, full_name, avatar_url),
        respondent:profiles!disputes_respondent_id_fkey(id, full_name, avatar_url),
        resolution:dispute_resolutions(id, dispute_id, resolver_id, decision, freelancer_percentage, resolution_notes, created_at)
      `)
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Formatear los joins
    const formatted: DisputeWithDetails[] = (data || []).map((row: any) => {
      const order = Array.isArray(row.order) ? row.order[0] : row.order;
      const initiator = Array.isArray(row.initiator) ? row.initiator[0] : row.initiator;
      const respondent = Array.isArray(row.respondent) ? row.respondent[0] : row.respondent;
      const resolution = Array.isArray(row.resolution) ? row.resolution[0] : row.resolution;

      return {
        id: row.id,
        orderId: row.order_id,
        initiatorId: row.initiator_id,
        respondentId: row.respondent_id,
        reason: row.reason,
        description: row.description,
        status: row.status as any,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        order: order
          ? {
              id: order.id,
              title: order.title,
              price: Number(order.price) || 0,
              status: order.status,
              clientId: order.client_id,
              freelancerId: order.freelancer_id,
            }
          : undefined,
        initiator: initiator
          ? {
              id: initiator.id,
              fullName: initiator.full_name,
              avatarUrl: initiator.avatar_url,
            }
          : undefined,
        respondent: respondent
          ? {
              id: respondent.id,
              fullName: respondent.full_name,
              avatarUrl: respondent.avatar_url,
            }
          : undefined,
        resolution: resolution
          ? {
              id: resolution.id,
              disputeId: resolution.dispute_id || row.id,
              resolverId: resolution.resolver_id || "",
              decision: resolution.decision,
              freelancerPercentage: Number(resolution.freelancer_percentage) || 0,
              resolutionNotes: resolution.resolution_notes || "",
              createdAt: resolution.created_at || new Date().toISOString(),
            }
          : null,
      };
    });

    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al obtener cola de disputas"),
    };
  }
}

/**
 * Consulta el listado de usuarios de la plataforma con sus roles y métricas.
 */
export async function getAdminUsersList(
  supabase: SupabaseClient<Database>,
  searchQuery?: string
): Promise<{ data: AdminUserItem[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        avatar_url,
        headline,
        phone,
        phone_verified,
        hourly_rate,
        rating_avg,
        reviews_count,
        created_at,
        user_roles(role, active)
      `)
      .order("created_at", { ascending: false });

    if (searchQuery && searchQuery.trim().length > 0) {
      query = query.ilike("full_name", `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted: AdminUserItem[] = (data || []).map((row: any) => {
      const rolesList = (row.user_roles || [])
        .filter((r: any) => r.active)
        .map((r: any) => r.role as Role);

      return {
        id: row.id,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        headline: row.headline,
        phone: row.phone,
        phoneVerified: Boolean(row.phone_verified),
        hourlyRate: row.hourly_rate ? Number(row.hourly_rate) : null,
        ratingAvg: Number(row.rating_avg) || 0,
        reviewsCount: Number(row.reviews_count) || 0,
        createdAt: row.created_at,
        roles: rolesList,
      };
    });

    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al listar usuarios"),
    };
  }
}

/**
 * Consulta el listado de movimientos financieros y retenciones en Escrow.
 */
export async function getAdminPaymentsList(
  supabase: SupabaseClient<Database>,
  statusFilter?: string
): Promise<{ data: AdminPaymentRecord[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from("escrow_holds")
      .select(`
        id,
        order_id,
        amount,
        platform_fee,
        net_amount,
        status,
        held_at,
        released_at,
        order:orders!escrow_holds_order_id_fkey(
          id,
          title,
          client:profiles!orders_client_id_fkey(id, full_name),
          freelancer:profiles!orders_freelancer_id_fkey(id, full_name)
        )
      `)
      .order("held_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted: AdminPaymentRecord[] = (data || []).map((row: any) => {
      const order = Array.isArray(row.order) ? row.order[0] : row.order;
      const client = order?.client ? (Array.isArray(order.client) ? order.client[0] : order.client) : null;
      const freelancer = order?.freelancer ? (Array.isArray(order.freelancer) ? order.freelancer[0] : order.freelancer) : null;

      return {
        id: row.id,
        orderId: row.order_id,
        orderTitle: order?.title || "Pedido sin título",
        clientName: client?.full_name || "Cliente",
        freelancerName: freelancer?.full_name || "Freelancer",
        grossAmount: Number(row.amount) || 0,
        platformFee: Number(row.platform_fee) || 0,
        netAmount: Number(row.net_amount) || 0,
        status: row.status,
        heldAt: row.held_at,
        releasedAt: row.released_at,
      };
    });

    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al obtener registros de pagos"),
    };
  }
}

/**
 * Permite a un administrador asignar, revocar o alternar el estado de un rol para un usuario.
 */
export async function updateUserRoleByAdmin(
  supabase: SupabaseClient<Database>,
  payload: UpdateUserRolePayload
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.rpc("admin_update_user_role" as unknown as never, {
      p_user_id: payload.userId,
      p_role: payload.role,
      p_active: payload.active,
    } as any);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Error al actualizar rol de usuario"),
    };
  }
}

export { resolveOrderDispute };
