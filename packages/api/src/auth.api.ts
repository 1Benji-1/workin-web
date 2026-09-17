import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@freelance/types";

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export async function signUpWithPassword(
  supabase: SupabaseClient<Database>,
  { email, password, fullName }: SignUpParams
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
}

export async function signInWithPassword(
  supabase: SupabaseClient<Database>,
  { email, password }: SignInParams
) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOutUser(supabase: SupabaseClient<Database>) {
  return supabase.auth.signOut();
}

export async function resetPasswordForEmail(
  supabase: SupabaseClient<Database>,
  email: string,
  redirectTo?: string
) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}

export async function getSession(supabase: SupabaseClient<Database>) {
  return supabase.auth.getSession();
}

export async function getCurrentUser(supabase: SupabaseClient<Database>) {
  return supabase.auth.getUser();
}
