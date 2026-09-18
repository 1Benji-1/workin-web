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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">
              Panel Exclusivo Freelancer
            </Badge>
            <span className="text-xs text-slate-400">Punto de control de actividad</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">
            Mi Panel de Trabajo
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bienvenido, {profile?.fullName || user?.email}. Administra tus ofertas, órdenes y pagos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/orders">
            <Button variant="outline" size="sm">
              Ver Todas las Órdenes ({myOrders.length})
            </Button>
          </Link>
          <Link to="/services/new">
            <Button size="sm">
              + Publicar Nuevo Servicio
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen Financiero y de Actividad */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Fondos en Custodia</span>
            <span>🛡️</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">{formatCurrency(escrowHeld)}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Retenidos en órdenes en curso.
          </p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Ganancias Netas</span>
            <span>💵</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{formatCurrency(releasedEarnings)}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Liberadas tras entrega conforme.
          </p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Servicios Activos</span>
            <span>💼</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{myServices.length}</span>
            <span className="text-xs text-slate-400">ofertas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {myServices.filter((s) => s.status === "active").length} ofertas activas.
          </p>
        </Card>

        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Reputación</span>
            <span>⭐</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900">
              {profile?.ratingAvg ? Number(profile.ratingAvg).toFixed(1) : "5.0"}
            </span>
            <RatingStars rating={profile?.ratingAvg ? Number(profile.ratingAvg) : 5.0} size="xs" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {profile?.reviewsCount ?? 0} {profile?.reviewsCount === 1 ? "reseña recibida" : "reseñas recibidas"}.
          </p>
        </Card>
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
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl flex-shrink-0 border border-slate-200">
                    {srv.category?.icon || "💼"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-900">
                        {srv.title}
                      </h4>
                      <Badge
                        variant={srv.status === "active" ? "accent" : "neutral"}
                        size="sm"
                      >
                        {srv.status === "active" ? "Activo" : "Pausado"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {srv.category?.name} · Entrega en {srv.delivery_days} días · ⭐ {Number(srv.rating).toFixed(1)}
                    </p>
                    <span className="text-xs font-bold text-primary inline-block mt-1">
                      Desde {formatCurrency(srv.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/services/${srv.id}`}>
                    <Button variant="ghost" size="sm">
                      Ver público
                    </Button>
                  </Link>
                  <Link to={`/services/${srv.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={statusUpdatingId === srv.id}
                    onClick={() => handleToggleServiceStatus(srv.id, srv.status)}
                    className="text-xs text-slate-500"
                  >
                    {srv.status === "active" ? "Pausar" : "Reactivar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-3">
            <span className="text-3xl block">🚀</span>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-sm">
                Aún no has publicado ningún servicio
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crea tu primera oferta para que clientes potenciales puedan encontrarte y contratarte.
              </p>
            </div>
            <Link to="/services/new">
              <Button size="sm">
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
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={meta.badgeVariant} size="sm">
                        {meta.label}
                      </Badge>
                      <span className="font-mono text-xs text-slate-400">
                        #{ord.id.slice(0, 8)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">
                      {ord.title}
                    </h4>

                    <p className="text-xs text-slate-500">
                      Cliente: <strong className="text-slate-700">{ord.client.fullName}</strong> · {ord.deliveryDays} días estimados
                    </p>

                    <span className="text-xs font-bold text-primary block pt-0.5">
                      {ord.price !== null ? formatCurrency(ord.price) : "Precio pendiente de acuerdo"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {canActivate && (
                      <Link to={`/orders/${ord.id}`}>
                        <Button
                          size="sm"
                          className="bg-accent text-primary hover:bg-accent/90 text-xs font-bold whitespace-nowrap"
                        >
                          💰 Fijar Precio
                        </Button>
                      </Link>
                    )}

                    <Link to={`/orders/${ord.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Ver Acuerdo →
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <span className="text-2xl block">📋</span>
            <h4 className="font-semibold text-sm text-slate-800">
              No tienes órdenes activas en este momento
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando un cliente solicite uno de tus servicios en el marketplace, el pedido aparecerá aquí con los requerimientos detallados y podrás pulsar <strong>"Activar pago"</strong>.
            </p>
          </div>
        )}
      </Card>

      {/* Historial de Desembolsos (Escrow Payouts) */}
      <PayoutHistory payouts={payouts} loading={loadingPayouts} />
    </div>
  );
}
