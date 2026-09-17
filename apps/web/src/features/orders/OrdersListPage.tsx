import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../../hooks/useOrders";
import { getOrderStatusMeta } from "@freelance/core";
import { useAuth } from "../../shared/context/AuthContext";
import { Button, Badge } from "@freelance/ui";

export default function OrdersListPage() {
  const { user } = useAuth();
  const [filterRole, setFilterRole] = useState<"all" | "as_client" | "as_freelancer">("all");

  const { orders, loading, error, refetch } = useOrders({
    roleFilter: filterRole === "all" ? undefined : filterRole,
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Badge variant="primary" size="sm" className="mb-1">
            Fase 3: Contratación y Acuerdos
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Mis Pedidos y Contrataciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Historial de acuerdos y servicios en curso dentro de la plataforma.
          </p>
        </div>

        <Link to="/">
          <Button variant="outline" size="sm">
            Explorar Marketplace
          </Button>
        </Link>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setFilterRole("all")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            filterRole === "all"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Todos los pedidos
        </button>
        <button
          type="button"
          onClick={() => setFilterRole("as_client")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            filterRole === "as_client"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Mis Contrataciones (Como Cliente)
        </button>
        <button
          type="button"
          onClick={() => setFilterRole("as_freelancer")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            filterRole === "as_freelancer"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Mis Trabajos (Como Freelancer)
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
        <div className="grid gap-4">
          {orders.map((order) => {
            const meta = getOrderStatusMeta(order.status);
            const isClient = user?.id === order.clientId;

            return (
              <div
                key={order.id}
                className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
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

                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {order.title}
                  </h3>

                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>
                      {isClient ? "Freelancer:" : "Cliente:"}{" "}
                      <strong className="text-slate-700">
                        {isClient ? order.freelancer.fullName : order.client.fullName}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>Entrega estimada: {order.deliveryDays} días</span>
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-xl font-black text-primary">
                    ${order.price} USD
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
    </div>
  );
}
