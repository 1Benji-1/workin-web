import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../../hooks/useOrders";
import { getOrderStatusMeta, formatCurrency } from "@freelance/core";
import { useAuth } from "../../shared/context/AuthContext";
import { Button, Badge } from "@freelance/ui";
import { DashboardLayout } from "../../shared/components/DashboardLayout";

export default function OrdersListPage() {
  const { user } = useAuth();
  const [filterRole, setFilterRole] = useState<"all" | "as_client" | "as_freelancer">("all");

  const { orders, loading, error, refetch } = useOrders({
    roleFilter: filterRole === "all" ? undefined : filterRole,
  });

  return (
    <DashboardLayout
      title="Pedidos & Contratos"
      subtitle="Historial de órdenes, acuerdos y servicios en curso dentro de la plataforma."
      actions={
        <Link to="/">
          <Button variant="outline" size="sm">
            Explorar Marketplace
          </Button>
        </Link>
      }
    >
      {/* Selector de Pestañas estilo Píldora / Cápsula (Support Tickets en diseno.png) */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white rounded-2xl sm:rounded-full border border-slate-200/80 shadow-2xs overflow-x-auto max-w-full scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterRole("all")}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            filterRole === "all"
              ? "bg-[#1F363D] text-white shadow-xs"
              : "text-slate-600 hover:text-[#1F363D]"
          }`}
        >
          Todos los pedidos
        </button>
        <button
          type="button"
          onClick={() => setFilterRole("as_client")}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            filterRole === "as_client"
              ? "bg-[#40798C] text-white shadow-xs"
              : "text-slate-600 hover:text-[#1F363D]"
          }`}
        >
          Mis Contrataciones
        </button>
        <button
          type="button"
          onClick={() => setFilterRole("as_freelancer")}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            filterRole === "as_freelancer"
              ? "bg-[#70A9A1] text-white shadow-xs"
              : "text-slate-600 hover:text-[#1F363D]"
          }`}
        >
          Mis Trabajos
        </button>
      </div>

      {/* Lista de Órdenes */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-xs text-slate-500">
          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
          Cargando pedidos...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
          <button onClick={() => refetch()} className="block mt-2 underline font-semibold">
            Reintentar
          </button>
        </div>
      ) : orders.length > 0 ? (
        <div className="grid gap-3.5 sm:gap-4">
          {orders.map((order) => {
            const meta = getOrderStatusMeta(order.status);
            const isClient = user?.id === order.clientId;

            return (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 min-w-0"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={meta.badgeVariant} size="sm">
                      {meta.label}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      · {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug break-words">
                    {order.title}
                  </h3>

                  <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>
                      {isClient ? "Freelancer:" : "Cliente:"}{" "}
                      <strong className="text-slate-700">
                        {isClient ? order.freelancer.fullName : order.client.fullName}
                      </strong>
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span>Entrega estimada: {order.deliveryDays} días</span>
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex-shrink-0 w-full sm:w-auto">
                  <span className="text-base sm:text-lg font-black text-primary">
                    {order.price !== null ? formatCurrency(order.price) : "Por acordar"}
                  </span>

                  <Link to={`/orders/${order.id}`}>
                    <Button size="sm">
                      Ver Acuerdo →
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
          <span className="text-4xl block">📋</span>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">
              No tienes pedidos en esta vista
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cuando solicites un servicio en el marketplace o recibas una contratación como freelancer, aparecerá listado aquí.
            </p>
          </div>
          <Link to="/">
            <Button size="md" className="mt-2">
              Explorar Servicios en Marketplace
            </Button>
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
