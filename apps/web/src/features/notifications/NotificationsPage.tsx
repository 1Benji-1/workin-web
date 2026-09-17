import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@freelance/ui";

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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabecera de la Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/" className="hover:text-primary transition-colors">
                Inicio
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Notificaciones</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Centro de Notificaciones</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  {unreadCount} sin leer
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Historial en tiempo real de actualizaciones de pagos en escrow, entregas, disputas y chat.
            </p>
          </div>

          {/* Acciones principales */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refresh()}
              title="Actualizar notificaciones"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg border border-slate-200 transition-colors"
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
        </div>

        {/* Pestañas de Filtrado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {(
            [
              { id: "todas", label: "Todas" },
              { id: "no_leidas", label: "No leídas" },
              { id: "ordenes", label: "Órdenes y Pagos" },
              { id: "mensajes", label: "Mensajes" },
              { id: "disputas", label: "Disputas" },
            ] as const
          ).map((tab) => {
            const count = tabCounts[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-accent font-bold shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-accent/20 text-accent font-black"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenedor Principal de la Lista */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading && notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
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
                  className="mt-4 text-xs font-semibold text-primary hover:underline"
                >
                  Ver todas las notificaciones
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
