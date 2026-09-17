import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@freelance/types";

export async function getCategories(supabase: SupabaseClient<Database>) {
  return supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
}

export async function getCategoryBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
) {
  return supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
}
