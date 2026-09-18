import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { useOrders } from "../../hooks/useOrders";
import { getOrderStatusMeta, formatCurrency } from "@freelance/core";
import { Card, Badge, Button } from "@freelance/ui";
import { DashboardLayout } from "../../shared/components/DashboardLayout";

export default function ClientDashboard() {
  const { profile, user } = useAuth();
  const { orders, loading } = useOrders({ roleFilter: "as_client" });

  // Métricas reales calculadas
  const escrowHeld = orders
    .filter((o) => o.status === "en_progreso" || o.status === "entregado")
    .reduce((acc, o) => acc + (o.price || 0), 0);

  const activeOrders = orders.filter(
    (o) =>
      o.status === "en_progreso" ||
      o.status === "esperando_pago" ||
      o.status === "acordado" ||
      o.status === "pendiente_acuerdo"
  );

  const deliveredOrders = orders.filter((o) => o.status === "entregado");
  const completedOrders = orders.filter(
    (o) => o.status === "aprobado" || o.status === "cerrado"
  );

  return (
    <DashboardLayout
      title="Panel de Cliente"
      subtitle={`Bienvenido, ${profile?.fullName || user?.email || "Cliente"}. Gestiona tus contrataciones y fondos protegidos en garantía.`}
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link to="/">
            <Button size="sm" variant="primary" className="!rounded-full text-xs font-bold py-1.5 px-4 shadow-sm">
              + Contratar Servicio
            </Button>
          </Link>
          <Link to="/orders">
            <Button variant="outline" size="sm" className="!rounded-full text-xs font-semibold py-1.5 px-3.5">
              Ver Mis Pedidos ({orders.length})
            </Button>
          </Link>
        </div>
      }
    >
      {/* ── 4 Tarjetas KPI con la Paleta WorkIn ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: #40798C (Azul-Verdoso) */}
        <div className="bg-[#40798C] text-white p-5 sm:p-6 rounded-[1.5rem] shadow-sm transition-transform hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90 text-[11px] sm:text-xs font-semibold tracking-wider">
            <span className="truncate">FONDOS EN CUSTODIA</span>
            <span className="text-lg flex-shrink-0">🔒</span>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-2xl sm:text-3xl font-black tracking-tight block truncate">
              {formatCurrency(escrowHeld)}
            </span>
          </div>
          <p className="text-[11px] text-white/80 mt-2 font-medium truncate">
            Protegido en Escrow hasta tu aprobación.
          </p>
        </div>

        {/* KPI 2: #70A9A1 (Verde Agua) */}
        <div className="bg-[#70A9A1] text-white p-5 sm:p-6 rounded-[1.5rem] shadow-sm transition-transform hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90 text-[11px] sm:text-xs font-semibold tracking-wider">
            <span className="truncate">EN DESARROLLO</span>
            <span className="text-lg flex-shrink-0">⚡</span>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight">
              {activeOrders.length}
            </span>
            <span className="text-xs font-bold text-white/80">proyectos</span>
          </div>
          <p className="text-[11px] text-white/80 mt-2 font-medium truncate">
            Contratos activos o en preparación.
          </p>
        </div>

        {/* KPI 3: #9EC1A3 (Verde Salvia) */}
        <div className="bg-[#9EC1A3] text-[#1F363D] p-5 sm:p-6 rounded-[1.5rem] shadow-sm transition-transform hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90 text-[11px] sm:text-xs font-bold tracking-wider">
            <span className="truncate">LISTAS PARA APROBAR</span>
            <span className="text-lg flex-shrink-0">📦</span>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight">
              {deliveredOrders.length}
            </span>
            <span className="text-xs font-bold text-[#1F363D]/70">entregas</span>
          </div>
          <p className="text-[11px] text-[#1F363D]/80 mt-2 font-medium truncate">
            Esperando tu revisión y visto bueno.
          </p>
        </div>

        {/* KPI 4: #CFE0C3 (Menta Claro) */}
        <div className="bg-[#CFE0C3] text-[#1F363D] p-5 sm:p-6 rounded-[1.5rem] shadow-sm transition-transform hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90 text-[11px] sm:text-xs font-bold tracking-wider">
            <span className="truncate">COMPLETADOS</span>
            <span className="text-lg flex-shrink-0">🎉</span>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight">
              {completedOrders.length}
            </span>
            <span className="text-xs font-bold text-[#1F363D]/70">éxitos</span>
          </div>
          <p className="text-[11px] text-[#1F363D]/80 mt-2 font-medium truncate">
            Proyectos entregados satisfactoriamente.
          </p>
        </div>
      </div>

      {/* ── Aviso de Entregas Pendientes (Solo si existen) ── */}
      {deliveredOrders.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <h4 className="text-sm font-bold">
                Tienes {deliveredOrders.length} entrega(s) esperando tu aprobación
              </h4>
              <p className="text-xs text-amber-800/80">
                Revisa el trabajo entregado por el freelancer para liberar los fondos de Escrow.
              </p>
            </div>
          </div>
          <Link to={`/orders/${deliveredOrders[0].id}`}>
            <Button size="sm" variant="dark" className="!rounded-full text-xs font-bold py-1.5 px-4 whitespace-nowrap">
              Revisar Entrega →
            </Button>
          </Link>
        </div>
      )}

      {/* ── Sección: Mis Contrataciones Recientes ── */}
      <Card
        title="Mis Contrataciones Recientes"
        description="Estado en vivo de los pedidos realizados a profesionales independientes"
      >
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Cargando tus contrataciones...
          </div>
        ) : orders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 6).map((ord) => {
              const meta = getOrderStatusMeta(ord.status);

              return (
                <div
                  key={ord.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {ord.freelancer?.avatarUrl ? (
                      <img
                        src={ord.freelancer.avatarUrl}
                        alt={ord.freelancer.fullName || "Freelancer"}
                        className="w-11 h-11 rounded-full object-cover shadow-2xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#40798C]/15 text-[#40798C] font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {(ord.freelancer?.fullName || "F")[0].toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={meta.badgeVariant} size="sm">
                          {meta.label}
                        </Badge>
                        <span className="font-mono text-xs text-slate-400">
                          #{ord.id.slice(0, 8)}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {ord.title}
                      </h4>

                      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span>
                          Freelancer:{" "}
                          <strong className="text-slate-700">
                            {ord.freelancer?.fullName || "Profesional"}
                          </strong>
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span>{ord.deliveryDays} días estimados</span>
                      </p>

                      <span className="text-xs font-bold text-[#1F363D] block pt-0.5">
                        {ord.price !== null ? formatCurrency(ord.price) : "Precio pendiente de acuerdo"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                    <Link to={`/messages`}>
                      <Button variant="ghost" size="sm" className="!rounded-full text-xs">
                        💬 Chat
                      </Button>
                    </Link>
                    <Link to={`/orders/${ord.id}`}>
                      <Button
                        size="sm"
                        variant={ord.status === "entregado" ? "primary" : "outline"}
                        className="!rounded-full text-xs font-semibold py-1.5 px-3.5"
                      >
                        {ord.status === "entregado" ? "Aprobar Entrega" : "Ver Detalles →"}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <span className="text-3xl block">💼</span>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800">
                Aún no has contratado ningún servicio
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explora el catálogo de especialistas verificados en desarrollo, diseño, marketing y más. Tus pagos siempre están 100% protegidos por el sistema Escrow.
              </p>
            </div>
            <Link to="/" className="inline-block pt-1">
              <Button size="sm" variant="dark" className="!rounded-full text-xs font-bold py-2 px-5 shadow-sm">
                Explorar Servicios en el Marketplace
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* ── Banner Estilo Isla para Nuevas Contrataciones ── */}
      <div className="relative rounded-[1.5rem] bg-gradient-to-r from-[#1F363D] to-[#2A4852] text-white p-7 sm:p-9 shadow-sm overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left max-w-lg z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-[#CFE0C3] border border-white/10 mb-1">
            🔒 Garantía Total WorkIn
          </div>
          <h3 className="text-base sm:text-lg font-bold">
            ¿Buscas talento calificado para un nuevo requerimiento?
          </h3>
          <p className="text-xs text-slate-200/80 leading-relaxed">
            Publica tus requerimientos, acuerda plazos sin sorpresas y deposita en custodia solo cuando estés listo para comenzar.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 z-10 flex-shrink-0">
          <Link to="/">
            <Button
              size="sm"
              variant="outline"
              className="!rounded-full bg-white text-[#1F363D] hover:bg-[#CFE0C3] border-transparent font-bold text-xs py-2 px-5 shadow-sm"
            >
              Buscar en Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
