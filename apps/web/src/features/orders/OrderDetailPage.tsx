import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { useOrderDetail } from "../../hooks/useOrderDetail";
import { useDispute } from "../../hooks/useDispute";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { RequirementsChecklist } from "./RequirementsChecklist";
import { PaymentModal, EscrowStatusBadge } from "../payments";
import { DisputeModal, DisputeThread } from "../disputes";
import { ReviewFormModal, ReviewsList } from "../reviews";
import { useReviews } from "../../hooks/useReviews";
import { getOrCreateConversation } from "@freelance/api";
import { supabase } from "../../shared/lib/supabaseClient";
import {
  canFreelancerActivatePayment,
  canFreelancerDeliver,
  canClientApprove,
  canOpenDispute,
  canLeaveReview,
  calculatePlatformFee,
} from "@freelance/core";
import { Card, Button, Badge } from "@freelance/ui";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const {
    order,
    loading,
    error,
    actionLoading,
    activatePayment,
    depositEscrowPayment,
    markDelivered,
    approveDelivery,
    toggleRequirement,
    addRequirement,
    refetch: refetchOrder,
  } = useOrderDetail(id);

  const {
    dispute,
    createDispute,
    postMessage,
    resolveDispute: executeResolveDispute,
    refetchDispute,
  } = useDispute(id);

  const {
    orderReview,
    handleReviewCreated,
    handleReplyAdded,
  } = useReviews({ orderId: id });

  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        Cargando detalles del acuerdo...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Orden no encontrada</h2>
        <p className="text-xs text-slate-500">
          {error || "La orden solicitada no existe o no tienes permisos para visualizarla."}
        </p>
        <Link to="/orders">
          <Button variant="outline">Ver Mis Pedidos</Button>
        </Link>
      </div>
    );
  }

  const isClient = user?.id === order.clientId;
  const isFreelancer = user?.id === order.freelancerId;
  const canActivate = user ? canFreelancerActivatePayment(order.status, order.freelancerId, user.id) : false;
  const canDeliver = user ? canFreelancerDeliver(order.status, order.freelancerId, user.id) : false;
  const canApprove = user ? canClientApprove(order.status, order.clientId, user.id) : false;
  const canDispute = user ? canOpenDispute(order.status, order.clientId, order.freelancerId, user.id) : false;
  const canReview = user ? canLeaveReview(order.status, order.clientId, user.id, Boolean(orderReview)) : false;

  const platformFee = calculatePlatformFee(order.price);
  const netEarnings = (order.price - platformFee).toFixed(2);

  const handleActivatePayment = async () => {
    const res = await activatePayment();
    if (res.success) {
      setActionSuccessMsg("¡Pago activado con éxito! La orden está ahora en estado esperando_pago.");
      setTimeout(() => setActionSuccessMsg(null), 5000);
    }
  };

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await markDelivered(deliveryNotes);
    if (res.success) {
      setShowDeliveryModal(false);
      setActionSuccessMsg("¡Trabajo marcado como entregado! El cliente ha sido notificado para revisión.");
      setTimeout(() => setActionSuccessMsg(null), 5000);
    }
  };

  const handleConfirmPayment = async (paymentMethod: string) => {
    const res = await depositEscrowPayment(paymentMethod);
    if (res.success) {
      setActionSuccessMsg("¡Depósito en garantía completado exitosamente! Los fondos han sido retenidos en Escrow y el trabajo ha iniciado.");
      setTimeout(() => setActionSuccessMsg(null), 6000);
    }
    return res;
  };

  const handleApprove = async () => {
    const res = await approveDelivery();
    if (res.success) {
      setActionSuccessMsg("¡Entrega aprobada exitosamente! Se han liberado los fondos de Escrow al freelancer.");
      setTimeout(() => setActionSuccessMsg(null), 6000);
    }
  };

  const handleCreateDispute = async (reason: string, description: string) => {
    const res = await createDispute(reason, description);
    if (res.success) {
      setActionSuccessMsg("¡Disputa abierta con éxito! Un mediador de soporte revisará el caso.");
      setTimeout(() => setActionSuccessMsg(null), 6000);
      await refetchOrder();
      await refetchDispute();
    }
    return res;
  };

  const handleResolveDispute = async (
    decision: "no_liberar" | "liberar_completo" | "liberar_parcial",
    freelancerPercentage: number,
    notes: string
  ) => {
    const res = await executeResolveDispute(decision, freelancerPercentage, notes);
    if (res.success) {
      setActionSuccessMsg("¡Veredicto de resolución ejecutado exitosamente!");
      setTimeout(() => setActionSuccessMsg(null), 6000);
      await refetchOrder();
      await refetchDispute();
    }
    return res;
  };

  const handleOpenOrderChat = async () => {
    if (!order) return;
    const res = await getOrCreateConversation(supabase, order.clientId, order.freelancerId, order.id);
    if (res.data) {
      navigate(`/messages/${res.data.id}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb y Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/orders" className="hover:text-primary transition-colors">
              Mis Pedidos
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">#{order.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {order.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenOrderChat}
            className="text-primary border-primary/30 hover:bg-primary/5 text-xs font-semibold flex items-center gap-1.5"
          >
            <span>💬</span> Chat del Proyecto
          </Button>

          {canDispute && order.status !== "en_disputa" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisputeModal(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold"
            >
              ⚖️ Abrir Disputa
            </Button>
          )}
          <Badge variant={isFreelancer ? "accent" : "primary"} size="sm">
            {isFreelancer ? "Tu Rol: Freelancer" : "Tu Rol: Cliente"}
          </Badge>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <span>✅</span>
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Línea de Vida del Acuerdo */}
      <OrderStatusTimeline status={order.status} />

      {/* Barra de Acción Clave (Activar Pago / Entregar / Aprobar) */}
      {canActivate && (
        <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
              ⚡ Acción requerida de tu parte
            </span>
            <h3 className="font-bold text-slate-900 text-base">
              ¿Estás de acuerdo con el alcance y el precio?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Al hacer clic en <strong>"Activar Pago"</strong> confirmas que puedes realizar este trabajo bajo los términos establecidos. Esto habilitará la orden para que el cliente deposite los <strong>${order.price} USD</strong> en custodia segura (Escrow).
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleActivatePayment}
            disabled={actionLoading}
            className="shadow-md whitespace-nowrap bg-accent text-primary hover:bg-accent/90"
          >
            {actionLoading ? "Activando..." : "⚡ Activar Pago"}
          </Button>
        </div>
      )}

      {/* Estado y Acciones de Custodia de Fondos (Escrow) */}
      <EscrowStatusBadge
        orderStatus={order.status}
        orderPrice={order.price}
        escrowHold={order.escrowHold}
        isClient={isClient}
        onOpenPaymentModal={() => setShowPaymentModal(true)}
      />

      {/* Hilo de Disputa si la orden está en estado 'en_disputa' o tiene mediación activa */}
      {(order.status === "en_disputa" || dispute) && dispute && (
        <DisputeThread
          dispute={dispute}
          currentUserId={user?.id}
          orderPrice={order.price}
          userRoles={roles}
          onSendMessage={postMessage}
          onResolveDispute={handleResolveDispute}
        />
      )}

      {canDeliver && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              🚀 Trabajo en Desarrollo
            </span>
            <p className="text-xs text-emerald-900">
              ¿Terminaste los entregables acordados? Entrega tu trabajo para que el cliente lo revise y apruebe.
            </p>
          </div>

          <Button size="md" onClick={() => setShowDeliveryModal(true)} disabled={actionLoading}>
            📦 Marcar como Entregado
          </Button>
        </div>
      )}

      {canApprove && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              ✨ Revisión de Entrega y Liberación de Fondos
            </span>
            <p className="text-xs text-emerald-900 leading-relaxed">
              El freelancer ha completado el trabajo. Al aprobar la entrega, se transferirán los fondos en custodia (${(order.escrowHold?.netAmount ?? (order.price * 0.9)).toFixed(2)} USD) de forma definitiva al profesional.
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleApprove}
            disabled={actionLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold whitespace-nowrap"
          >
            {actionLoading
              ? "Liberando Fondos..."
              : `✅ Aprobar y Liberar $${(order.escrowHold?.netAmount ?? (order.price * 0.9)).toFixed(2)} USD`}
          </Button>
        </div>
      )}

      {/* Banner de Invitación a Calificar (Fase 6: Reseñas) */}
      {canReview && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="space-y-1 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <span>⭐</span> Tu opinión es importante
            </span>
            <h4 className="text-base font-bold text-slate-900">
              ¿Cómo fue tu experiencia trabajando con {order.freelancer?.fullName || "el profesional"}?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              El pedido ha finalizado. Deja una calificación por estrellas y un testimonio para reconocer el trabajo bien hecho y orientar a futuros clientes.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => setShowReviewModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-3 px-5 shadow-sm whitespace-nowrap"
          >
            ⭐ Calificar Servicio
          </Button>
        </div>
      )}

      {/* Modal de Entrega */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900">
              Entregar Trabajo al Cliente
            </h3>
            <p className="text-xs text-slate-600">
              Añade notas sobre los entregables, enlaces de descarga o instrucciones de acceso.
            </p>
            <form onSubmit={handleDeliverSubmit} className="space-y-4">
              <textarea
                rows={4}
                required
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="He finalizado todos los puntos solicitados. Puedes revisar el trabajo en..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-primary focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowDeliveryModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={actionLoading}>
                  {actionLoading ? "Entregando..." : "Confirmar Entrega"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid Principal: Detalles + Contraparte */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda (2 Cols): Descripción y Requerimientos */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Descripción del Acuerdo">
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {order.description}
            </div>
          </Card>

          {/* Checklist de Requerimientos */}
          <RequirementsChecklist
            requirements={order.requirements}
            onToggle={toggleRequirement}
            onAdd={addRequirement}
            canEdit={order.status !== "cerrado" && order.status !== "aprobado"}
          />

          {/* Reseña del Pedido (Fase 6) */}
          {orderReview && (
            <Card
              title="Reseña y Calificación del Pedido"
              description="Valoración verificada registrada para este trabajo"
            >
              <ReviewsList
                reviews={[orderReview]}
                currentUserId={user?.id}
                onReplySuccess={handleReplyAdded}
              />
            </Card>
          )}

          {/* Historial de Auditoría de Estados */}
          <Card
            title="Historial de Auditoría del Pedido"
            description="Registro transparente de cada cambio de estado y notas del acuerdo"
          >
            {order.statusHistory && order.statusHistory.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {order.statusHistory.map((item) => (
                  <div key={item.id} className="relative text-xs space-y-0.5">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {item.newStatus}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {item.changer && (
                      <p className="text-[11px] text-slate-500">
                        Por: <strong className="text-slate-700">{item.changer.fullName}</strong>
                      </p>
                    )}
                    {item.comment && (
                      <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1 italic">
                        "{item.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Sin movimientos registrados.</p>
            )}
          </Card>
        </div>

        {/* Columna Derecha (1 Col): Ficha Económica y Contraparte */}
        <div className="space-y-6">
          {/* Ficha Económica */}
          <Card title="Condiciones del Acuerdo">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Precio Acordado:</span>
                <span className="text-base font-black text-primary">${order.price} USD</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Tiempo de Entrega:</span>
                <span className="font-bold text-slate-800">{order.deliveryDays} días</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Comisión Plataforma (10%):</span>
                <span className="font-mono text-slate-600">${platformFee} USD</span>
              </div>
              {isFreelancer && (
                <div className="flex items-center justify-between pt-1 font-semibold text-emerald-700">
                  <span>Tus Ganancias Estimadas:</span>
                  <span className="text-sm font-bold">${netEarnings} USD</span>
                </div>
              )}
            </div>
          </Card>

          {/* Tarjeta de Contraparte */}
          <Card title={isFreelancer ? "Información del Cliente" : "Información del Freelancer"}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center flex-shrink-0">
                {isFreelancer
                  ? (order.client.fullName || "C").charAt(0).toUpperCase()
                  : (order.freelancer.fullName || "F").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  {isFreelancer ? order.client.fullName : order.freelancer.fullName}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  {isFreelancer ? "Cliente en WorkIn" : order.freelancer.headline || "Freelancer Profesional"}
                </p>
              </div>
            </div>
          </Card>

          {/* Enlace al Servicio Original si aplica */}
          {order.service && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                Servicio Asociado
              </span>
              <Link
                to={`/services/${order.service.id}`}
                className="font-bold text-primary hover:underline block"
              >
                {order.service.title} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pago y Depósito en Escrow */}
      <PaymentModal
        order={order}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Modal para Abrir Disputa */}
      <DisputeModal
        orderId={order.id}
        orderTitle={order.title}
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSubmit={handleCreateDispute}
      />

      {/* Modal para Emitir Reseña (Fase 6) */}
      <ReviewFormModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        orderId={order.id}
        clientId={order.clientId}
        freelancerId={order.freelancerId}
        serviceId={order.serviceId}
        orderTitle={order.title}
        freelancerName={order.freelancer?.fullName || "Freelancer"}
        onSuccess={(newRev) => {
          handleReviewCreated(newRev);
          setActionSuccessMsg("¡Muchas gracias! Tu calificación y testimonio han sido publicados.");
          setTimeout(() => setActionSuccessMsg(null), 6000);
        }}
      />
    </div>
  );
}
