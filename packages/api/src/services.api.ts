import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  ServiceFilterParams,
  TablesInsert,
  TablesUpdate,
} from "@freelance/types";

export type ServiceInsertPayload = TablesInsert<"services">;
export type ServiceUpdatePayload = TablesUpdate<"services">;
export type ServicePackageInsertPayload = TablesInsert<"service_packages">;

export async function getServices(
  supabase: SupabaseClient<Database>,
  filters: ServiceFilterParams = {}
) {
  const categoryJoin = filters.categorySlug
    ? "category:categories!inner!services_category_id_fkey(id, name, slug, icon)"
    : "category:categories!services_category_id_fkey(id, name, slug, icon)";

  let query = supabase
    .from("services")
    .select(`
      *,
      freelancer:profiles!services_freelancer_id_fkey(id, full_name, avatar_url, headline, skills),
      ${categoryJoin}
    `);

  // Solo servicios activos salvo que se filtre por freelancer específico
  if (filters.freelancerId) {
    query = query.eq("freelancer_id", filters.freelancerId);
  } else {
    query = query.eq("status", "active");
  }

  // Filtro por slug de categoría
  if (filters.categorySlug) {
    query = query.eq("category.slug", filters.categorySlug);
  }

  // Filtro por precio
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    query = query.gte("price", filters.minPrice);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    query = query.lte("price", filters.maxPrice);
  }

  // Filtro por días de entrega
  if (filters.maxDeliveryDays !== undefined && filters.maxDeliveryDays > 0) {
    query = query.lte("delivery_days", filters.maxDeliveryDays);
  }

  // Filtro por rating
  if (filters.minRating !== undefined && filters.minRating > 0) {
    query = query.gte("rating", filters.minRating);
  }

  // Búsqueda por texto en título o descripción
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const term = `%${filters.searchQuery.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  return query.order("created_at", { ascending: false });
}

export async function getServicesByCategory(
  supabase: SupabaseClient<Database>,
  categoryId: string
) {
  return supabase
    .from("services")
    .select(`
      *,
      freelancer:profiles!services_freelancer_id_fkey(id, full_name, avatar_url, headline, skills),
      category:categories!services_category_id_fkey(id, name, slug, icon)
    `)
    .eq("category_id", categoryId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
}

export async function getServicesByFreelancer(
  supabase: SupabaseClient<Database>,
  freelancerId: string
) {
  return supabase
    .from("services")
    .select(`
      *,
      category:categories!services_category_id_fkey(id, name, slug, icon),
      packages:service_packages(*)
    `)
    .eq("freelancer_id", freelancerId)
    .order("created_at", { ascending: false });
}

export async function getServiceById(
  supabase: SupabaseClient<Database>,
  serviceId: string
) {
  return supabase
    .from("services")
    .select(`
      *,
      freelancer:profiles!services_freelancer_id_fkey(id, full_name, avatar_url, headline, bio, skills, rating:rating_avg),
      category:categories!services_category_id_fkey(id, name, slug, icon),
      packages:service_packages(*)
    `)
    .eq("id", serviceId)
    .single();
}

export async function createService(
  supabase: SupabaseClient<Database>,
  serviceData: ServiceInsertPayload,
  packagesData?: Omit<ServicePackageInsertPayload, "service_id">[]
) {
  const { data: newService, error: serviceError } = await supabase
    .from("services")
    .insert(serviceData)
    .select()
    .single();

  if (serviceError || !newService) {
    return { data: null, error: serviceError };
  }

  // Insertar paquetes opcionales si se proporcionaron
  if (packagesData && packagesData.length > 0) {
    const packagesToInsert = packagesData.map((pkg) => ({
      ...pkg,
      service_id: newService.id,
    }));

    await supabase.from("service_packages").insert(packagesToInsert);
  }

  return { data: newService, error: null };
}

export async function updateService(
  supabase: SupabaseClient<Database>,
  serviceId: string,
  updates: ServiceUpdatePayload
) {
  return supabase
    .from("services")
    .update(updates)
    .eq("id", serviceId)
    .select()
    .single();
}

export async function deleteService(
  supabase: SupabaseClient<Database>,
  serviceId: string
) {
  return supabase.from("services").delete().eq("id", serviceId);
}
