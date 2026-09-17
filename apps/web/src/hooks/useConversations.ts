import { useState, useEffect, useCallback } from "react";
import type { ConversationWithDetails } from "@freelance/types";
import { getConversationsByUser } from "@freelance/api";
import { sortConversationsByRecent } from "@freelance/core";
import { supabase } from "../shared/lib/supabaseClient";
import { useAuth } from "../shared/context/AuthContext";

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: cErr } = await getConversationsByUser(supabase, user.id);
      if (cErr) throw cErr;
      setConversations(sortConversationsByRecent(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar conversaciones");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Suscribirse a cambios en conversations en tiempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("user_conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
}
