import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  Notification,
  NotificationMetadata,
  CreateNotificationPayload,
  SendEmailPayload,
} from "@freelance/types";

function mapNotificationRow(row: Database["public"]["Tables"]["notifications"]["Row"]): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    data: (row.data || {}) as NotificationMetadata,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/**
 * Obtiene las notificaciones del usuario paginadas y ordenadas cronológicamente.
 */
export async function getUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { limit?: number; onlyUnread?: boolean }
): Promise<{ data: Notification[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 50);

    if (options?.onlyUnread) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      data: (data || []).map(mapNotificationRow),
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al obtener notificaciones"),
    };
  }
}

/**
 * Obtiene el conteo exacto de notificaciones no leídas para el usuario.
 */
export async function getUnreadNotificationsCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;

    return {
      count: count ?? 0,
      error: null,
    };
  } catch (err: unknown) {
    return {
      count: 0,
      error: err instanceof Error ? err : new Error("Error al contar notificaciones no leídas"),
    };
  }
}

/**
 * Marca una notificación específica como leída.
 */
export async function markNotificationAsRead(
  supabase: SupabaseClient<Database>,
  notificationId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error("Error al marcar notificación como leída"),
    };
  }
}

/**
 * Marca todas las notificaciones pendientes del usuario como leídas.
 */
export async function markAllNotificationsAsRead(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error("Error al marcar todas las notificaciones"),
    };
  }
}

/**
 * Crea una notificación programada o manual para un usuario.
 */
export async function createNotification(
  supabase: SupabaseClient<Database>,
  payload: CreateNotificationPayload
): Promise<{ data: Notification | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        data: (payload.data || {}) as Json,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data: mapNotificationRow(data),
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al crear notificación"),
    };
  }
}

/**
 * Suscripción en tiempo real vía WebSocket a la tabla notifications filtrada por usuario.
 */
export function subscribeToNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  onNewNotification: (notification: Notification) => void,
  onUpdateNotification?: (notification: Notification) => void
): RealtimeChannel {
  const channelName = `notifications:user:${userId}:${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as Database["public"]["Tables"]["notifications"]["Row"];
        if (row) {
          onNewNotification(mapNotificationRow(row));
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as Database["public"]["Tables"]["notifications"]["Row"];
        if (row && onUpdateNotification) {
          onUpdateNotification(mapNotificationRow(row));
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Invoca la Edge Function send-notification-email para despachar un correo transaccional.
 */
export async function sendEmailNotification(
  supabase: SupabaseClient<Database>,
  payload: SendEmailPayload
): Promise<{ data: unknown; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: payload,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al enviar email"),
    };
  }
}
