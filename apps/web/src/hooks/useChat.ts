import { useState, useEffect, useCallback, useRef } from "react";
import type { Message, ConversationWithDetails, MessageAttachment } from "@freelance/types";
import {
  getConversationById,
  getMessagesByConversation,
  sendMessage as apiSendMessage,
  markMessagesAsRead,
  subscribeToConversationMessages,
} from "@freelance/api";
import { validateMessageInput } from "@freelance/core";
import { supabase } from "../shared/lib/supabaseClient";
import { useAuth } from "../shared/context/AuthContext";

export function useChat(conversationId?: string) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(conversationId));
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  // Cargar conversación y mensajes iniciales
  const loadChat = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [convRes, msgRes] = await Promise.all([
        getConversationById(supabase, conversationId),
        getMessagesByConversation(supabase, conversationId),
      ]);

      if (convRes.error) throw convRes.error;
      if (msgRes.error) throw msgRes.error;

      setConversation(convRes.data);
      setMessages(msgRes.data);

      // Marcar como leídos los mensajes que no sean del usuario actual
      if (user) {
        await markMessagesAsRead(supabase, conversationId, user.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar el chat");
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [conversationId, user, scrollToBottom]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Suscripción Realtime a nuevos mensajes
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToConversationMessages(
      supabase,
      conversationId,
      (newMessage) => {
        setMessages((prev) => {
          // Evitar duplicados por inserción optimista
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });

        // Marcar como leído si el mensaje recibido no es propio
        if (user && newMessage.senderId !== user.id) {
          markMessagesAsRead(supabase, conversationId, user.id);
        }

        setTimeout(() => scrollToBottom(true), 50);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, user, scrollToBottom]);

  // Enviar nuevo mensaje
  const sendMessage = async (
    content: string,
    attachments?: MessageAttachment[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!conversationId || !user) {
      return { success: false, error: "Conversación o usuario no disponible" };
    }

    const validation = validateMessageInput(content);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    setSending(true);
    try {
      const { data, error: sendErr } = await apiSendMessage(supabase, {
        conversationId,
        senderId: user.id,
        content,
        attachments,
      });

      if (sendErr) throw sendErr;

      if (data) {
        // Asegurar inserción inmediata en el estado
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar mensaje";
      return { success: false, error: msg };
    } finally {
      setSending(false);
    }
  };

  return {
    conversation,
    messages,
    loading,
    sending,
    error,
    messagesEndRef,
    sendMessage,
    scrollToBottom,
    refetch: loadChat,
  };
}
