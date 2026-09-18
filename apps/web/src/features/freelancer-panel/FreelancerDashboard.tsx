import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import {
  getServicesByFreelancer,
  updateService,
  getPayoutsByFreelancer,
} from "@freelance/api";
import type { PayoutWithOrder } from "@freelance/api";
import { useOrders } from "../../hooks/useOrders";
import { getOrderStatusMeta, canFreelancerActivatePayment, formatCurrency } from "@freelance/core";
import { supabase } from "../../shared/lib/supabaseClient";
import { Card, Button, Badge } from "@freelance/ui";
import { DashboardLayout } from "../../shared/components/DashboardLayout";
import { PayoutHistory } from "../payments";
import { RatingStars } from "../reviews";

interface FreelancerServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  status: string;
  rating: number;
  reviews_count: number;
  category?: {
    name: string;
    icon: string | null;
  } | null;
}

export default function FreelancerDashboard() {
  const { user, profile } = useAuth();
  const { orders: myOrders, loading: loadingOrders } = useOrders({ roleFilter: "as_freelancer" });

  const [myServices, setMyServices] = useState<FreelancerServiceItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutWithOrder[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingServices(true);
    setLoadingPayouts(true);
    try {
      const [{ data: srvs }, { data: pos }] = await Promise.all([
        getServicesByFreelancer(supabase, user.id),
        getPayoutsByFreelancer(supabase, user.id),
      ]);

      if (srvs) setMyServices(srvs as unknown as FreelancerServiceItem[]);
      if (pos) setPayouts(pos);
    } finally {
      setLoadingServices(false);
      setLoadingPayouts(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleServiceStatus = async (serviceId: string, currentStatus: string) => {
    setStatusUpdatingId(serviceId);
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      await updateService(supabase, serviceId, { status: newStatus });
      await loadData();
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Fondos actualmente retenidos en Escrow (monto neto garantizado al freelancer para órdenes en progreso)
  const escrowHeld = myOrders
    .filter((o) => o.status === "en_progreso")
    .reduce((acc, o) => acc + (o.freelancerPrice ?? (o.price ? o.price / 1.12 : 0)), 0);

  // Ganancias netas liberadas (obtenidas del historial real de payouts)
  const releasedEarnings = payouts
    .filter((p) => p.status === "completed")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Bienvenido, ${profile?.fullName || user?.email}. Administra tus ofertas, contratos y finanzas.`}
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link to="/orders">
            <Button variant="outline" size="sm" className="!rounded-full text-xs font-semibold py-1.5 px-4">
              Ver Órdenes ({myOrders.length})
            </Button>
          </Link>
          <Link to="/services/new">
            <Button variant="primary" size="sm" className="!rounded-full text-xs font-bold py-1.5 px-4 shadow-sm">
              + Publicar Servicio
            </Button>
          </Link>
        </div>
      }
    >
      {/* Resumen Financiero y de Actividad - 4 Bloques de Color estilo diseno.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: #40798C (Azul-Verdoso) */}
        <div className="bg-[#40798C] text-white p-5 sm:p-6 rounded-[1.5rem] shadow-sm transition-transform hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90 text-[11px] sm:text-xs font-semibold tracking-wider">
            <span className="truncate">FONDOS EN CUSTODIA</span>
            <span className="text-lg flex-shrink-0">🛡️</span>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-2xl sm:text-3xl font-black tracking-tight block truncate">{formatCurrency(escrowHeld)}</span>
          </div>
          <p className="text-[11px] text-white/80 mt-2 font-medium truncate">
            Garantizado en órdenes activas.
          </p>
        </div>

        {/* KPI 2: #70A9A1 (Verde Agua) */}
        <div className="bg-[#70A9A1] text-white p-5 sm:p-6 rounded-[1.5rem] shadow-sm transition-transform hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90 text-[11px] sm:text-xs font-semibold tracking-wider">
            <span className="truncate">GANANCIAS NETAS</span>
            <span className="text-lg flex-shrink-0">💵</span>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-2xl sm:text-3xl font-black tracking-tight block truncate">{formatCurrency(releasedEarnings)}</span>
          </div>
          <p className="text-[11px] text-white/80 mt-2 font-medium truncate">
            Disponibles tras entrega aprobada.
          </p>
        </div>

        {/* KPI 3: #9EC1A3 (Verde Pastel) */}
        <div className="bg-[#9EC1A3] text-[#1F363D] p-5 sm:p-6 rounded-[1.5rem] shadow-sm transition-transform hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90 text-[11px] sm:text-xs font-bold tracking-wider">
            <span className="truncate">SERVICIOS ACTIVOS</span>
            <span className="text-lg flex-shrink-0">💼</span>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight">{myServices.length}</span>
            <span className="text-xs font-bold text-[#1F363D]/70">ofertas</span>
          </div>
          <p className="text-[11px] text-[#1F363D]/80 mt-2 font-medium truncate">
            {myServices.filter((s) => s.status === "active").length} visibles en marketplace.
          </p>
        </div>

        {/* KPI 4: #CFE0C3 (Menta Claro) */}
        <div className="bg-[#CFE0C3] text-[#1F363D] p-5 sm:p-6 rounded-[1.5rem] shadow-sm transition-transform hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90 text-[11px] sm:text-xs font-bold tracking-wider">
            <span className="truncate">REPUTACIÓN</span>
            <span className="text-lg flex-shrink-0">⭐</span>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight">
              {profile?.ratingAvg ? Number(profile.ratingAvg).toFixed(1) : "5.0"}
            </span>
            <RatingStars rating={profile?.ratingAvg ? Number(profile.ratingAvg) : 5.0} size="xs" />
          </div>
          <p className="text-[11px] text-[#1F363D]/80 mt-2 font-medium truncate">
            {profile?.reviewsCount ?? 0} {profile?.reviewsCount === 1 ? "reseña" : "reseñas recibidas"}.
          </p>
        </div>
      </div>

      {/* Sección 1: Mis Servicios Publicados */}
      <Card
        title="Mis Servicios Publicados"
        description="Ofertas activas en el marketplace que pueden ser contratadas por clientes"
      >
        {loadingServices ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Cargando tus servicios...
          </div>
        ) : myServices.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {myServices.map((srv) => (
              <div
                key={srv.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0 hover:bg-slate-50/50 transition-colors p-2 sm:p-3 rounded-2xl"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
                    {srv.category?.icon || "💼"}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {srv.title}
                      </h4>
                      <Badge
                        variant={srv.status === "active" ? "accent" : "neutral"}
                        size="sm"
                      >
                        {srv.status === "active" ? "Activo" : "Pausado"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {srv.category?.name} · Entrega en {srv.delivery_days} días · ⭐ {Number(srv.rating).toFixed(1)}
                    </p>
                    <span className="text-xs font-bold text-[#1F363D] inline-block">
                      Desde {formatCurrency(srv.price)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                  <Link to={`/services/${srv.id}`}>
                    <Button variant="ghost" size="sm" className="!rounded-full text-xs font-medium">
                      Ver público
                    </Button>
                  </Link>
                  <Link to={`/services/${srv.id}/edit`}>
                    <Button variant="outline" size="sm" className="!rounded-full text-xs font-semibold">
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={statusUpdatingId === srv.id}
                    onClick={() => handleToggleServiceStatus(srv.id, srv.status)}
                    className="!rounded-full text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {srv.status === "active" ? "Pausar" : "Reactivar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
            <span className="text-3xl block">🚀</span>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">
                Aún no has publicado ningún servicio
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crea tu primera oferta para que clientes potenciales puedan encontrarte y contratarte.
              </p>
            </div>
            <Link to="/services/new" className="inline-block pt-1">
              <Button size="sm" variant="dark" className="!rounded-full text-xs font-bold py-2 px-5 shadow-sm">
                + Publicar mi primer servicio
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Sección 2: Órdenes Recibidas */}
      <Card
        title="Órdenes Recibidas de Clientes"
        description="Pedidos y acuerdos solicitados directamente a tus servicios"
      >
        {loadingOrders ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Cargando pedidos entrantes...
          </div>
        ) : myOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {myOrders.map((ord) => {
              const meta = getOrderStatusMeta(ord.status);
              const canActivate = user ? canFreelancerActivatePayment(ord.status, ord.freelancerId, user.id) : false;

              return (
                <div
                  key={ord.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0 hover:bg-slate-50/50 transition-colors p-2 sm:p-3 rounded-2xl"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={meta.badgeVariant} size="sm">
                        {meta.label}
                      </Badge>
                      <span className="font-mono text-xs text-slate-400">
                        #{ord.id.slice(0, 8)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 break-words">
                      {ord.title}
                    </h4>

                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span>Cliente: <strong className="text-slate-700">{ord.client.fullName}</strong></span>
                      <span className="hidden sm:inline">·</span>
                      <span>{ord.deliveryDays} días estimados</span>
                    </p>

                    <span className="text-xs font-bold text-[#1F363D] block pt-0.5">
                      {ord.price !== null ? formatCurrency(ord.price) : "Precio pendiente de acuerdo"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                    {canActivate && (
                      <Link to={`/orders/${ord.id}`}>
                        <Button
                          size="sm"
                          className="bg-[#40798C] text-white hover:bg-[#2E5664] !rounded-full text-xs font-bold py-1.5 px-4 shadow-sm whitespace-nowrap"
                        >
                          💰 Fijar Precio
                        </Button>
                      </Link>
                    )}

                    <Link to={`/orders/${ord.id}`}>
                      <Button variant="outline" size="sm" className="!rounded-full text-xs font-semibold py-1.5 px-3.5">
                        Ver Acuerdo →
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <span className="text-2xl block">📋</span>
            <h4 className="font-bold text-sm text-slate-800">
              No tienes órdenes activas en este momento
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando un cliente solicite uno de tus servicios en el marketplace, el pedido aparecerá aquí con los requerimientos detallados y podrás pulsar <strong>"Fijar Precio"</strong>.
            </p>
          </div>
        )}
      </Card>

      {/* Historial de Desembolsos (Escrow Payouts) */}
      <PayoutHistory payouts={payouts} loading={loadingPayouts} />
    </DashboardLayout>
  );
}
