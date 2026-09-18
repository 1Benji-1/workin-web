import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@freelance/ui";
import { DashboardLayout } from "../../shared/components/DashboardLayout";

type FilterTab = "todas" | "no_leidas" | "ordenes" | "mensajes" | "disputas";

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>("todas");

  // Filtrado reactivo según la pestaña seleccionada
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "no_leidas") return !n.isRead;
    if (activeTab === "ordenes") {
      return (
        n.type === "order_status" ||
        n.type === "order_escrow_funded" ||
        n.type === "order_delivered" ||
        n.type === "order_approved"
      );
    }
    if (activeTab === "mensajes") return n.type === "new_message";
    if (activeTab === "disputas") {
      return (
        n.type === "dispute_opened" ||
        n.type === "dispute_resolved" ||
        n.type === "dispute_update"
      );
    }
    return true;
  });

  const tabCounts = {
    todas: notifications.length,
    no_leidas: unreadCount,
    ordenes: notifications.filter(
      (n) =>
        n.type === "order_status" ||
        n.type === "order_escrow_funded" ||
        n.type === "order_delivered" ||
        n.type === "order_approved"
    ).length,
    mensajes: notifications.filter((n) => n.type === "new_message").length,
    disputas: notifications.filter(
      (n) =>
        n.type === "dispute_opened" ||
        n.type === "dispute_resolved" ||
        n.type === "dispute_update"
    ).length,
  };

  return (
    <DashboardLayout
      title="Centro de Notificaciones"
      subtitle="Historial en tiempo real de actualizaciones de pagos en escrow, entregas, disputas y chat."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            title="Actualizar notificaciones"
            className="p-2 text-slate-500 hover:text-[#1F363D] hover:bg-white rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs bg-white"
            >
              ✓ Marcar todas como leídas
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Pestañas de Filtro - Pills redondeadas estilo diseno.png */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white rounded-2xl sm:rounded-full border border-slate-200/80 shadow-2xs overflow-x-auto max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("todas")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "todas"
                ? "bg-[#1F363D] text-white shadow-xs"
                : "text-slate-600 hover:text-[#1F363D]"
            }`}
          >
            Todas ({tabCounts.todas})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("no_leidas")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "no_leidas"
                ? "bg-[#40798C] text-white shadow-xs"
                : "text-slate-600 hover:text-[#1F363D]"
            }`}
          >
            Sin leer ({tabCounts.no_leidas})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ordenes")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "ordenes"
                ? "bg-[#70A9A1] text-white shadow-xs"
                : "text-slate-600 hover:text-[#1F363D]"
            }`}
          >
            Órdenes ({tabCounts.ordenes})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mensajes")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "mensajes"
                ? "bg-[#9EC1A3] text-[#1F363D] shadow-xs"
                : "text-slate-600 hover:text-[#1F363D]"
            }`}
          >
            Mensajes ({tabCounts.mensajes})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("disputas")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "disputas"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 hover:text-[#1F363D]"
            }`}
          >
            Disputas ({tabCounts.disputas})
          </button>
        </div>

        {/* Tarjeta de Lista de Notificaciones */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoading && notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#40798C] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400">Cargando tus notificaciones...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                {activeTab === "no_leidas" ? "✨" : "📭"}
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {activeTab === "no_leidas"
                  ? "¡Estás al día!"
                  : "No hay notificaciones en esta categoría"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {activeTab === "no_leidas"
                  ? "Has revisado todas tus alertas y mensajes pendientes."
                  : "Cuando ocurra una novedad relevante la verás registrada en este panel."}
              </p>
              {activeTab !== "todas" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("todas")}
                  className="mt-4 text-xs font-bold text-[#40798C] hover:underline"
                >
                  Ver todas las notificaciones
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
