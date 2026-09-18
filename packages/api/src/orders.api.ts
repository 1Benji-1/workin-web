import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  CreateOrderPayload,
  OrderStatus,
} from "@freelance/types";

export async function createOrder(
  supabase: SupabaseClient<Database>,
  payload: CreateOrderPayload
) {
  // 1. Insertar orden en tabla orders (nace sin precio; lo define el freelancer al activar pago)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      client_id: payload.clientId,
      freelancer_id: payload.freelancerId,
      service_id: payload.serviceId || null,
      package_id: payload.packageId || null,
      title: payload.title,
      description: payload.description,
      delivery_days: payload.deliveryDays,
      status: "pendiente_acuerdo",
    })
    .select()
    .single();

  if (orderError || !order) {
    return { data: null, error: orderError };
  }

  // 2. Insertar requerimientos si existen
  if (payload.requirements && payload.requirements.length > 0) {
    const reqsToInsert = payload.requirements
      .filter((r) => r.trim().length > 0)
      .map((r) => ({
        order_id: order.id,
        description: r.trim(),
        is_completed: false,
      }));

    if (reqsToInsert.length > 0) {
      await supabase.from("order_requirements").insert(reqsToInsert);
    }
  }

  // 3. Registrar en historial de auditoría
  await supabase.from("order_status_history").insert({
    order_id: order.id,
    previous_status: null,
    new_status: "pendiente_acuerdo",
    changed_by: payload.clientId,
    comment: "Solicitud de servicio enviada por el cliente",
  });

  return { data: order, error: null };
}

export async function getOrdersByUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  roleFilter?: "as_client" | "as_freelancer"
) {
  let query = supabase
    .from("orders")
    .select(`
      *,
      client:profiles!orders_client_id_fkey(id, full_name, avatar_url),
      freelancer:profiles!orders_freelancer_id_fkey(id, full_name, avatar_url, headline),
      service:services!orders_service_id_fkey(id, title, cover_image, category_id),
      requirements:order_requirements(*)
    `);

  if (roleFilter === "as_client") {
    query = query.eq("client_id", userId);
  } else if (roleFilter === "as_freelancer") {
    query = query.eq("freelancer_id", userId);
  } else {
    query = query.or(`client_id.eq.${userId},freelancer_id.eq.${userId}`);
  }

  return query.order("created_at", { ascending: false });
}

export async function getOrderById(
  supabase: SupabaseClient<Database>,
  orderId: string
) {
  return supabase
    .from("orders")
    .select(`
      *,
      client:profiles!orders_client_id_fkey(id, full_name, avatar_url, phone),
      freelancer:profiles!orders_freelancer_id_fkey(id, full_name, avatar_url, headline, phone),
      service:services!orders_service_id_fkey(
        id,
        title,
        cover_image,
        category:categories!services_category_id_fkey(id, name, slug, icon)
      ),
      package:service_packages!orders_package_id_fkey(id, tier, title, revisions),
      requirements:order_requirements(*),
      status_history:order_status_history(
        *,
        changer:profiles!order_status_history_changed_by_fkey(id, full_name, avatar_url)
      )
    `)
    .eq("id", orderId)
    .order("created_at", { referencedTable: "order_status_history", ascending: true })
    .single();
}

export async function activateOrderPayment(
  supabase: SupabaseClient<Database>,
  orderId: string,
  freelancerPrice: number
) {
  return supabase.rpc("activate_order_payment", {
    p_order_id: orderId,
    p_freelancer_price: freelancerPrice,
  });
}

export async function markOrderDelivered(
  supabase: SupabaseClient<Database>,
  orderId: string,
  freelancerId: string,
  comment?: string
) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "entregado",
      delivered_at: now,
    })
    .eq("id", orderId)
    .eq("freelancer_id", freelancerId)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error };
  }

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    previous_status: "en_progreso",
    new_status: "entregado",
    changed_by: freelancerId,
    comment: comment || "Trabajo finalizado y entregado para revisión del cliente",
  });

  return { data, error: null };
}

export async function approveOrderDelivery(
  supabase: SupabaseClient<Database>,
  orderId: string,
  clientId: string
) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "aprobado",
      completed_at: now,
    })
    .eq("id", orderId)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error };
  }

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    previous_status: "entregado",
    new_status: "aprobado",
    changed_by: clientId,
    comment: "El cliente aprobó la entrega a satisfacción",
  });

  return { data, error: null };
}

export async function toggleRequirementCompleted(
  supabase: SupabaseClient<Database>,
  requirementId: string,
  isCompleted: boolean
) {
  return supabase
    .from("order_requirements")
    .update({ is_completed: isCompleted })
    .eq("id", requirementId)
    .select()
    .single();
}

export async function addOrderRequirement(
  supabase: SupabaseClient<Database>,
  orderId: string,
  description: string
) {
  return supabase
    .from("order_requirements")
    .insert({
      order_id: orderId,
      description: description.trim(),
      is_completed: false,
    })
    .select()
    .single();
}

export async function getOrderRequirements(
  supabase: SupabaseClient<Database>,
  orderId: string
) {
  try {
    const { data, error } = await supabase
      .from("order_requirements")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return {
      data: (data || []).map((r) => ({
        id: r.id,
        orderId: r.order_id,
        description: r.description,
        isCompleted: r.is_completed,
        createdAt: r.created_at,
      })),
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Error al obtener requerimientos"),
    };
  }
}

