import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Role, TablesUpdate } from "@freelance/types";

export type ProfileUpdatePayload = TablesUpdate<"profiles">;

export async function getProfileById(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  return supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}

export async function updateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: ProfileUpdatePayload
) {
  return supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
}

export async function getUserRoles(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  return supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId);
}

export async function addUserRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: Role
) {
  return supabase
    .from("user_roles")
    .insert({
      user_id: userId,
      role,
      active: true,
    })
    .select()
    .single();
}

export async function setUserRoleActive(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: Role,
  active: boolean
) {
  return supabase
    .from("user_roles")
    .update({ active })
    .eq("user_id", userId)
    .eq("role", role)
    .select()
    .single();
}

export async function removeUserRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: Role
) {
  return supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
}
