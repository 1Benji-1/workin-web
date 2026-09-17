import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { Role, UserProfile, PortfolioItem } from "@freelance/types";
import {
  signInWithPassword,
  signUpWithPassword,
  signOutUser,
  resetPasswordForEmail,
  getProfileById,
  updateProfile,
  getUserRoles,
  addUserRole,
  setUserRoleActive,
} from "@freelance/api";
import { supabase } from "../lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: Role[];
  isLoading: boolean;
  hasRole: (role: Role) => boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (
    email: string,
    password: string,
    fullName: string,
    initialRoles: Role[]
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfileData: (
    updates: Partial<Omit<UserProfile, "id" | "roles" | "createdAt" | "updatedAt">>
  ) => Promise<{ error: string | null }>;
  toggleRole: (role: Role, activate: boolean) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (currentUserId: string) => {
    try {
      // 1. Obtener perfil
      const { data: profileRow } = await getProfileById(supabase, currentUserId);

      // 2. Obtener roles
      const { data: roleRows } = await getUserRoles(supabase, currentUserId);

      const activeRoles = (roleRows || [])
        .filter((r) => r.active)
        .map((r) => r.role as Role);

      setRoles(activeRoles);

      if (profileRow) {
        setProfile({
          id: profileRow.id,
          fullName: profileRow.full_name,
          avatarUrl: profileRow.avatar_url,
          phone: profileRow.phone,
          phoneVerified: profileRow.phone_verified,
          headline: profileRow.headline,
          bio: profileRow.bio,
          hourlyRate: profileRow.hourly_rate ? Number(profileRow.hourly_rate) : null,
          skills: profileRow.skills || [],
          portfolio: (Array.isArray(profileRow.portfolio)
            ? profileRow.portfolio
            : []) as unknown as PortfolioItem[],
          roles: activeRoles,
          createdAt: profileRow.created_at,
          updatedAt: profileRow.updated_at,
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }, []);

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchUserData(currentSession.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchUserData(newSession.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const hasRole = useCallback(
    (role: Role) => roles.includes(role),
    [roles]
  );

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await signInWithPassword(supabase, { email, password });
    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }
    if (data.user) {
      await fetchUserData(data.user.id);
    }
    setIsLoading(false);
    return { error: null };
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    initialRoles: Role[]
  ) => {
    setIsLoading(true);
    const { data, error } = await signUpWithPassword(supabase, {
      email,
      password,
      fullName,
    });

    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }

    if (data.user) {
      // Si el usuario seleccionó "freelancer", lo insertamos en user_roles
      if (initialRoles.includes("freelancer")) {
        try {
          await addUserRole(supabase, data.user.id, "freelancer");
        } catch {
          // Ignorar error si ya fue creado por trigger o política
        }
      }
      await fetchUserData(data.user.id);
    }

    setIsLoading(false);
    return { error: null };
  };

  const logout = async () => {
    await signOutUser(supabase);
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const resetPassword = async (email: string) => {
    const { error } = await resetPasswordForEmail(supabase, email);
    if (error) return { error: error.message };
    return { error: null };
  };

  const updateProfileData = async (
    updates: Partial<Omit<UserProfile, "id" | "roles" | "createdAt" | "updatedAt">>
  ) => {
    if (!user) return { error: "No hay sesión activa" };

    const payload: Record<string, unknown> = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.phoneVerified !== undefined) payload.phone_verified = updates.phoneVerified;
    if (updates.headline !== undefined) payload.headline = updates.headline;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.hourlyRate !== undefined) payload.hourly_rate = updates.hourlyRate;
    if (updates.skills !== undefined) payload.skills = updates.skills;
    if (updates.portfolio !== undefined) payload.portfolio = updates.portfolio;

    const { error } = await updateProfile(supabase, user.id, payload);
    if (error) return { error: error.message };

    await fetchUserData(user.id);
    return { error: null };
  };

  const toggleRole = async (role: Role, activate: boolean) => {
    if (!user) return { error: "No hay sesión activa" };

    try {
      // Verificar si ya tiene el rol en la tabla
      const { data: existingRoles } = await getUserRoles(supabase, user.id);
      const exists = existingRoles?.some((r) => r.role === role);

      if (exists) {
        const { error } = await setUserRoleActive(supabase, user.id, role, activate);
        if (error) return { error: error.message };
      } else if (activate) {
        const { error } = await addUserRole(supabase, user.id, role);
        if (error) return { error: error.message };
      }

      await fetchUserData(user.id);
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar rol";
      return { error: msg };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        hasRole,
        login,
        register,
        logout,
        resetPassword,
        updateProfileData,
        toggleRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
