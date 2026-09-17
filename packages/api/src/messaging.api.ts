import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import type {
  Database,
  ConversationWithDetails,
  Message,
  SendMessagePayload,
} from "@freelance/types";

/**
 * Obtiene una conversación existente o crea una nueva entre las partes (vinculada opcionalmente a una orden).
 */
export async function getOrCreateConversation(
  supabase: SupabaseClient<Database>,
  clientId: string,
  freelancerId: string,
  orderId?: string | null
): Promise<{ data: ConversationWithDetails | null; error: Error | null }> {
  try {
    // 1. Buscar si ya existe la conversación en una dirección u otra
    let query = supabase
      .from("conversations")
      .select(`
        id,
        client_id,
        freelancer_id,
        order_id,
        last_message,
        last_message_at,
        created_at,
        updated_at,
        client:profiles!conversations_client_id_fkey(id, full_name, avatar_url),
        freelancer:profiles!conversations_freelancer_id_fkey(id, full_name, avatar_url, headline),
        order:orders!conversations_order_id_fkey(id, title, status, price)
      `);

    if (orderId) {
      query = query.eq("order_id", orderId);
    } else {
      query = query.is("order_id", null);
    }

    const { data: existingList, error: searchErr } = await query;
    if (searchErr) throw searchErr;

    const matched = (existingList || []).find(
      (c) =>
        (c.client_id === clientId && c.freelancer_id === freelancerId) ||
        (c.client_id === freelancerId && c.freelancer_id === clientId)
    );

    if (matched) {
      const client = Array.isArray(matched.client) ? matched.client[0] : matched.client;
      const freelancer = Array.isArray(matched.freelancer) ? matched.freelancer[0] : matched.freelancer;
      const order = Array.isArray(matched.order) ? matched.order[0] : matched.order;

      return {
        data: {
          id: matched.id,
          clientId: matched.client_id,
          freelancerId: matched.freelancer_id,
          orderId: matched.order_id,
          lastMessage: matched.last_message,
          lastMessageAt: matched.last_message_at,
          createdAt: matched.created_at,
          updatedAt: matched.updated_at,
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
          order: order ? {
            id: order.id,
            title: order.title,
            status: order.status,
            price: order.price,
          } : null,
        },
        error: null,
      };
    }

    // 2. Si no existe, crearla
    const { data: created, error: insertErr } = await supabase
      .from("conversations")
      .insert({
        client_id: clientId,
        freelancer_id: freelancerId,
        order_id: orderId || null,
        last_message_at: new Date().toISOString(),
      })
      .select(`
        id,
        client_id,
        freelancer_id,
        order_id,
        last_message,
        last_message_at,
        created_at,
        updated_at,
        client:profiles!conversations_client_id_fkey(id, full_name, avatar_url),
        freelancer:profiles!conversations_freelancer_id_fkey(id, full_name, avatar_url, headline),
        order:orders!conversations_order_id_fkey(id, title, status, price)
      `)
      .single();

    if (insertErr) throw insertErr;

    const client = Array.isArray(created.client) ? created.client[0] : created.client;
    const freelancer = Array.isArray(created.freelancer) ? created.freelancer[0] : created.freelancer;
    const order = Array.isArray(created.order) ? created.order[0] : created.order;

    return {
      data: {
        id: created.id,
        clientId: created.client_id,
        freelancerId: created.freelancer_id,
        orderId: created.order_id,
        lastMessage: created.last_message,
        lastMessageAt: created.last_message_at,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
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
        order: order ? {
          id: order.id,
          title: order.title,
          status: order.status,
          price: order.price,
        } : null,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al obtener o crear conversación"),
    };
  }
}

/**
 * Obtiene todas las conversaciones en las que participa el usuario autenticado.
 */
export async function getConversationsByUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ data: ConversationWithDetails[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        client_id,
        freelancer_id,
        order_id,
        last_message,
        last_message_at,
        created_at,
        updated_at,
        client:profiles!conversations_client_id_fkey(id, full_name, avatar_url),
        freelancer:profiles!conversations_freelancer_id_fkey(id, full_name, avatar_url, headline),
        order:orders!conversations_order_id_fkey(id, title, status, price)
      `)
      .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error) throw error;

    const formatted: ConversationWithDetails[] = (data || []).map((row) => {
      const client = Array.isArray(row.client) ? row.client[0] : row.client;
      const freelancer = Array.isArray(row.freelancer) ? row.freelancer[0] : row.freelancer;
      const order = Array.isArray(row.order) ? row.order[0] : row.order;

      return {
        id: row.id,
        clientId: row.client_id,
        freelancerId: row.freelancer_id,
        orderId: row.order_id,
        lastMessage: row.last_message,
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
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
        order: order ? {
          id: order.id,
          title: order.title,
          status: order.status,
          price: order.price,
        } : null,
      };
    });

    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error("Error al obtener conversaciones"),
    };
  }
}

/**
 * Obtiene el detalle de una conversación por su ID.
 */
export async function getConversationById(
  supabase: SupabaseClient<Database>,
  conversationId: string
): Promise<{ data: ConversationWithDetails | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        client_id,
        freelancer_id,
        order_id,
        last_message,
        last_message_at,
        created_at,
        updated_at,
        client:profiles!conversations_client_id_fkey(id, full_name, avatar_url),
        freelancer:profiles!conversations_freelancer_id_fkey(id, full_name, avatar_url, headline),
        order:orders!conversations_order_id_fkey(id, title, status, price)
      `)
      .eq("id", conversationId)
      .single();

    if (error) throw error;
    if (!data) return { data: null, error: null };

    const client = Array.isArray(data.client) ? data.client[0] : data.client;
    const freelancer = Array.isArray(data.freelancer) ? data.freelancer[0] : data.freelancer;
    const order = Array.isArray(data.order) ? data.order[0] : data.order;

    return {
      data: {
        id: data.id,
        clientId: data.client_id,
        freelancerId: data.freelancer_id,
        orderId: data.order_id,
        lastMessage: data.last_message,
        lastMessageAt: data.last_message_at,
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
        order: order ? {
          id: order.id,
          title: order.title,
          status: order.status,
          price: order.price,
        } : null,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al obtener conversación"),
    };
  }
}

/**
 * Obtiene todos los mensajes de una conversación ordenados cronológicamente.
 */
export async function getMessagesByConversation(
  supabase: SupabaseClient<Database>,
  conversationId: string
): Promise<{ data: Message[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        attachments,
        is_read,
        created_at,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const formatted: Message[] = (data || []).map((row) => {
      const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
      return {
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        content: row.content,
        attachments: Array.isArray(row.attachments) ? (row.attachments as unknown as Message["attachments"]) : [],
        isRead: row.is_read,
        createdAt: row.created_at,
        sender: sender ? {
          id: sender.id,
          fullName: sender.full_name,
          avatarUrl: sender.avatar_url,
        } : null,
      };
    });

    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error("Error al obtener mensajes"),
    };
  }
}

/**
 * Envía un nuevo mensaje dentro de la conversación.
 */
export async function sendMessage(
  supabase: SupabaseClient<Database>,
  payload: SendMessagePayload
): Promise<{ data: Message | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: payload.conversationId,
        sender_id: payload.senderId,
        content: payload.content.trim(),
        attachments: (payload.attachments || []) as unknown as Database["public"]["Tables"]["messages"]["Insert"]["attachments"],
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        attachments,
        is_read,
        created_at,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    const sender = Array.isArray(data.sender) ? data.sender[0] : data.sender;
    return {
      data: {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content,
        attachments: Array.isArray(data.attachments) ? (data.attachments as unknown as Message["attachments"]) : [],
        isRead: data.is_read,
        createdAt: data.created_at,
        sender: sender ? {
          id: sender.id,
          fullName: sender.full_name,
          avatarUrl: sender.avatar_url,
        } : null,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al enviar mensaje"),
    };
  }
}

/**
 * Marca como leídos los mensajes recibidos en una conversación.
 */
export async function markMessagesAsRead(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  currentUserId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .eq("is_read", false);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Error al marcar mensajes como leídos"),
    };
  }
}

/**
 * Se suscribe a nuevos mensajes en tiempo real vía Supabase Realtime para una conversación.
 */
export function subscribeToConversationMessages(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  onNewMessage: (msg: Message) => void
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`chat_${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const newRow = payload.new as Database["public"]["Tables"]["messages"]["Row"];
        // Cargar datos del remitente para enriquecer el mensaje
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", newRow.sender_id)
          .single();

        const formattedMsg: Message = {
          id: newRow.id,
          conversationId: newRow.conversation_id,
          senderId: newRow.sender_id,
          content: newRow.content,
          attachments: Array.isArray(newRow.attachments) ? (newRow.attachments as unknown as Message["attachments"]) : [],
          isRead: newRow.is_read,
          createdAt: newRow.created_at,
          sender: senderProfile ? {
            id: senderProfile.id,
            fullName: senderProfile.full_name,
            avatarUrl: senderProfile.avatar_url,
          } : null,
        };

        onNewMessage(formattedMsg);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
