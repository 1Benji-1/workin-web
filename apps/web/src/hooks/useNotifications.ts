import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../shared/context/AuthContext";
import { supabase } from "../shared/lib/supabaseClient";
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  subscribeToNotifications,
} from "@freelance/api";
import type { Notification } from "@freelance/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Carga inicial de notificaciones y conteo de no leídas
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [listResult, countResult] = await Promise.all([
        getUserNotifications(supabase, user.id, { limit: 40 }),
        getUnreadNotificationsCount(supabase, user.id),
      ]);

      if (listResult.error) throw listResult.error;
      if (countResult.error) throw countResult.error;

      setNotifications(listResult.data || []);
      setUnreadCount(countResult.count || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar notificaciones");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Suscripción en tiempo real vía WebSocket
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = subscribeToNotifications(
      supabase,
      user.id,
      (newNotification) => {
        setNotifications((prev) => {
          // Evitar duplicados por race conditions
          if (prev.some((n) => n.id === newNotification.id)) return prev;
          return [newNotification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      },
      (updatedNotification) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
        );
        // Recalcular no leídas tras actualización
        setUnreadCount((prev) => Math.max(0, updatedNotification.isRead ? prev - 1 : prev));
      }
    );

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchNotifications]);

  // Marcar una notificación individual como leída
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      // Actualización optimista inmediata
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const { error: err } = await apiMarkAsRead(supabase, notificationId);
      if (err) {
        console.error("Error al marcar notificación:", err);
      }
    },
    [user]
  );

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    // Actualización optimista inmediata
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date().toISOString(),
      }))
    );
    setUnreadCount(0);

    const { error: err } = await apiMarkAllAsRead(supabase, user.id);
    if (err) {
      console.error("Error al marcar todas las notificaciones:", err);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
