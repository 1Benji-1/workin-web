// Lógica de negocio pura (sin UI, sin llamadas directas a Supabase).
// Ej: reglas de escrow, cálculo de comisiones, validaciones de estado de orden.

export const DEFAULT_PLATFORM_FEE_PERCENT = 12; // 12%
export const DEFAULT_PLATFORM_FEE_RATE = 0.12; // 0.12
export const MIN_FREELANCER_PRICE = 20; // Bs 20 mínimo

export function calculatePlatformFee(amount: number, feePercentage = DEFAULT_PLATFORM_FEE_RATE): number {
  return Number((amount * feePercentage).toFixed(2));
}

export type OrderStatus =
  | "pendiente_acuerdo"
  | "acordado"
  | "esperando_pago"
  | "en_progreso"
  | "entregado"
  | "aprobado"
  | "en_disputa"
  | "cerrado";

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pendiente_acuerdo: ["acordado", "esperando_pago", "cerrado"],
  acordado: ["esperando_pago", "cerrado"],
  esperando_pago: ["en_progreso", "cerrado"],
  en_progreso: ["entregado", "en_disputa"],
  entregado: ["aprobado", "en_disputa"],
  aprobado: ["cerrado"],
  en_disputa: ["aprobado", "cerrado"],
  cerrado: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_FLOW[from]?.includes(to) ?? false;
}

export function canFreelancerActivatePayment(
  orderStatus: OrderStatus,
  orderFreelancerId: string,
  userId: string
): boolean {
  return (
    userId === orderFreelancerId &&
    (orderStatus === "pendiente_acuerdo" || orderStatus === "acordado")
  );
}

export function canFreelancerDeliver(
  orderStatus: OrderStatus,
  orderFreelancerId: string,
  userId: string
): boolean {
  return userId === orderFreelancerId && orderStatus === "en_progreso";
}

export interface EscrowBreakdown {
  total: number;
  platformFee: number;
  netAmount: number;
  feePercentage: number;
}

export function calculateEscrowBreakdown(
  amount: number,
  feePercentage = DEFAULT_PLATFORM_FEE_RATE
): EscrowBreakdown {
  const numericAmount = Number(amount) || 0;
  const platformFee = Number((numericAmount * feePercentage).toFixed(2));
  const netAmount = Number((numericAmount - platformFee).toFixed(2));
  return {
    total: numericAmount,
    platformFee,
    netAmount,
    feePercentage: feePercentage * 100,
  };
}

export interface ClientTotalCalculation {
  freelancerPrice: number;
  commission: number;
  total: number;
  feePercentage: number;
}

export function calculateClientTotal(
  freelancerPrice: number,
  feePercentage = DEFAULT_PLATFORM_FEE_RATE
): ClientTotalCalculation {
  const numericPrice = Number(freelancerPrice) || 0;
  const commission = Number((numericPrice * feePercentage).toFixed(2));
  const total = Number((numericPrice + commission).toFixed(2));
  return {
    freelancerPrice: numericPrice,
    commission,
    total,
    feePercentage: feePercentage * 100,
  };
}

export function canClientPayEscrow(
  orderStatus: OrderStatus,
  orderClientId: string,
  userId: string
): boolean {
  return userId === orderClientId && orderStatus === "esperando_pago";
}

export function canClientReleaseEscrow(
  orderStatus: OrderStatus,
  orderClientId: string,
  userId: string
): boolean {
  return userId === orderClientId && orderStatus === "entregado";
}

export function canClientApprove(
  orderStatus: OrderStatus,
  orderClientId: string,
  userId: string
): boolean {
  return canClientReleaseEscrow(orderStatus, orderClientId, userId);
}

export interface OrderStatusMeta {
  label: string;
  description: string;
  badgeVariant: "primary" | "accent" | "neutral" | "warning" | "danger";
  stepIndex: number;
}

export function getOrderStatusMeta(status: OrderStatus): OrderStatusMeta {
  switch (status) {
    case "pendiente_acuerdo":
      return {
        label: "Pendiente de Acuerdo",
        description: "El cliente envió la solicitud. Ambas partes están acordando requerimientos y precio.",
        badgeVariant: "neutral",
        stepIndex: 0,
      };
    case "acordado":
      return {
        label: "Acordado",
        description: "Requerimientos y precio fijados. El freelancer debe activar el pago.",
        badgeVariant: "primary",
        stepIndex: 0,
      };
    case "esperando_pago":
      return {
        label: "Esperando Pago en Escrow",
        description: "El freelancer activó el pago. Esperando depósito del cliente en custodia segura.",
        badgeVariant: "warning",
        stepIndex: 1,
      };
    case "en_progreso":
      return {
        label: "En Progreso",
        description: "Pago retenido en custodia. El freelancer se encuentra realizando el trabajo.",
        badgeVariant: "accent",
        stepIndex: 2,
      };
    case "entregado":
      return {
        label: "Entregado",
        description: "El freelancer entregó el trabajo. Esperando revisión y aprobación del cliente.",
        badgeVariant: "primary",
        stepIndex: 3,
      };
    case "aprobado":
      return {
        label: "Aprobado",
        description: "El cliente aprobó la entrega con satisfacción.",
        badgeVariant: "accent",
        stepIndex: 4,
      };
    case "en_disputa":
      return {
        label: "En Disputa",
        description: "Hubo una discrepancia y se ha escalado a mediación de soporte.",
        badgeVariant: "danger",
        stepIndex: 3,
      };
    case "cerrado":
      return {
        label: "Cerrado",
        description: "Orden finalizada y archivada.",
        badgeVariant: "neutral",
        stepIndex: 4,
      };
  }
}

// ============================================================
// Lógica de Disputas y Mediación (Fase 5)
// ============================================================

export type DisputeStatus = "open" | "under_review" | "resolved" | "cancelled";
export type DisputeDecision = "no_liberar" | "liberar_completo" | "liberar_parcial";
export type DisputeReason =
  | "cliente_no_responde"
  | "cliente_rechaza_sin_motivo"
  | "entregables_incompletos"
  | "calidad_deficiente"
  | "desacuerdo_alcance"
  | "otro";

export function canOpenDispute(
  orderStatus: OrderStatus,
  orderClientId: string,
  orderFreelancerId: string,
  userId: string
): boolean {
  const isParticipant = userId === orderClientId || userId === orderFreelancerId;
  const isEligibleStatus = orderStatus === "en_progreso" || orderStatus === "entregado";
  return isParticipant && isEligibleStatus;
}

export function canSendMessageInDispute(
  disputeStatus: DisputeStatus,
  initiatorId: string,
  respondentId: string,
  userId: string,
  isSupport = false
): boolean {
  if (disputeStatus === "resolved" || disputeStatus === "cancelled") return false;
  return isSupport || userId === initiatorId || userId === respondentId;
}

export function canResolveDispute(
  disputeStatus: DisputeStatus,
  userRoles: string[]
): boolean {
  if (disputeStatus === "resolved" || disputeStatus === "cancelled") return false;
  return userRoles.includes("soporte") || userRoles.includes("admin");
}

export function getDisputeReasonLabel(reason: DisputeReason | string): string {
  switch (reason) {
    case "cliente_no_responde":
      return "El cliente no responde tras la entrega";
    case "cliente_rechaza_sin_motivo":
      return "El cliente objeta o rechaza sin motivo justificado";
    case "entregables_incompletos":
      return "Los entregables recibidos están incompletos";
    case "calidad_deficiente":
      return "La calidad no cumple con lo acordado";
    case "desacuerdo_alcance":
      return "Desacuerdo sobre el alcance original del proyecto";
    default:
      return "Otro motivo de discrepancia";
  }
}

export function getDisputeDecisionLabel(decision: DisputeDecision | string): string {
  switch (decision) {
    case "no_liberar":
      return "No Liberar Fondos (Reembolso 100% al Cliente)";
    case "liberar_completo":
      return "Liberar Pago Completo (100% al Freelancer)";
    case "liberar_parcial":
      return "Liberación Parcial de Fondos (División Proporcional)";
    default:
      return decision;
  }
}

export interface DisputeStatusMeta {
  label: string;
  description: string;
  badgeVariant: "primary" | "accent" | "neutral" | "warning" | "danger";
}

export function getDisputeStatusMeta(status: DisputeStatus): DisputeStatusMeta {
  switch (status) {
    case "open":
      return {
        label: "Disputa Abierta",
        description: "La disputa fue iniciada y está pendiente de revisión por el mediador.",
        badgeVariant: "danger",
      };
    case "under_review":
      return {
        label: "En Mediación",
        description: "Un mediador de soporte está analizando los argumentos y evidencias.",
        badgeVariant: "warning",
      };
    case "resolved":
      return {
        label: "Disputa Resuelta",
        description: "El veredicto final ha sido emitido y los fondos fueron liquidados.",
        badgeVariant: "accent",
      };
    case "cancelled":
      return {
        label: "Disputa Cancelada",
        description: "La disputa fue cancelada por acuerdo mutuo.",
        badgeVariant: "neutral",
      };
  }
}

// ============================================================
// Lógica de Reputación y Reseñas (Fase 6)
// ============================================================

export function canLeaveReview(
  orderStatus: OrderStatus,
  orderClientId: string,
  userId: string,
  hasExistingReview = false
): boolean {
  if (hasExistingReview) return false;
  const isClient = userId === orderClientId;
  const isOrderCompleted = orderStatus === "aprobado" || orderStatus === "cerrado";
  return isClient && isOrderCompleted;
}

export function canReplyToReview(
  freelancerId: string,
  userId: string,
  hasReply = false
): boolean {
  return userId === freelancerId && !hasReply;
}

export function validateReviewInput(
  rating: number,
  comment: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    errors.push("La calificación debe ser un número entero entre 1 y 5 estrellas.");
  }
  const trimmedComment = (comment || "").trim();
  if (trimmedComment.length < 5) {
    errors.push("El comentario de la reseña debe contener al menos 5 caracteres.");
  }
  if (trimmedComment.length > 2000) {
    errors.push("El comentario no debe exceder los 2000 caracteres.");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getRatingLabel(rating: number): string {
  switch (Math.round(rating)) {
    case 5:
      return "Excelente";
    case 4:
      return "Muy bueno";
    case 3:
      return "Bueno";
    case 2:
      return "Regular";
    case 1:
      return "Deficiente";
    default:
      return "Sin calificar";
  }
}

export interface RatingBreakdown {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  percentages: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function calculateAverageRating(ratings: number[]): RatingBreakdown {
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  if (!ratings || ratings.length === 0) {
    return {
      average: 0,
      count: 0,
      breakdown,
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  let sum = 0;
  for (const r of ratings) {
    const rounded = Math.min(5, Math.max(1, Math.round(r))) as 1 | 2 | 3 | 4 | 5;
    breakdown[rounded] = (breakdown[rounded] || 0) + 1;
    sum += r;
  }

  const count = ratings.length;
  const average = Number((sum / count).toFixed(2));
  const percentages: Record<1 | 2 | 3 | 4 | 5, number> = {
    5: Math.round((breakdown[5] / count) * 100),
    4: Math.round((breakdown[4] / count) * 100),
    3: Math.round((breakdown[3] / count) * 100),
    2: Math.round((breakdown[2] / count) * 100),
    1: Math.round((breakdown[1] / count) * 100),
  };

  return {
    average,
    count,
    breakdown,
    percentages,
  };
}

// ============================================================
// Lógica de Mensajería y Chat en Tiempo Real (Fase 7)
// ============================================================

export function canSendMessage(
  userId: string,
  clientId: string,
  freelancerId: string,
  isSupportOrAdmin = false
): boolean {
  if (isSupportOrAdmin) return true;
  return userId === clientId || userId === freelancerId;
}

export function validateMessageInput(content: string): { isValid: boolean; error?: string } {
  const trimmed = (content || "").trim();
  if (!trimmed || trimmed.length === 0) {
    return {
      isValid: false,
      error: "El mensaje no puede estar vacío.",
    };
  }
  if (trimmed.length > 4000) {
    return {
      isValid: false,
      error: "El mensaje no puede exceder los 4000 caracteres.",
    };
  }
  return { isValid: true };
}

export function formatMessageDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return timeStr;
    }
    if (isYesterday) {
      return `Ayer, ${timeStr}`;
    }

    return `${date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    })} ${timeStr}`;
  } catch {
    return isoDate;
  }
}

export function sortConversationsByRecent<
  T extends { lastMessageAt?: string | null; createdAt?: string }
>(conversations: T[]): T[] {
  return [...conversations].sort((a, b) => {
    const dateA = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}

// ---------------------------------------------------------------------------
// Notificaciones (Fase 8)
// ---------------------------------------------------------------------------

export function formatNotificationTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) {
      return "Hace un momento";
    }
    if (diffMin < 60) {
      return `Hace ${diffMin} min`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    }
    if (diffDays === 1) {
      const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      return `Ayer, ${timeStr}`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    }

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return isoDate;
  }
}

export function getNotificationActionUrl(
  type: string,
  data?: Record<string, unknown>
): string {
  if (data?.url && typeof data.url === "string") {
    return data.url;
  }
  if (data?.order_id || data?.orderId) {
    const id = String(data.order_id || data.orderId);
    return `/orders/${id}`;
  }
  if (data?.conversation_id || data?.conversationId) {
    const id = String(data.conversation_id || data.conversationId);
    return `/messages/${id}`;
  }
  if (data?.dispute_id || data?.disputeId) {
    const id = String(data.dispute_id || data.disputeId);
    return `/disputes/${id}`;
  }
  return "/notifications";
}

export interface NotificationVisualConfig {
  icon: string;
  bgClass: string;
  textClass: string;
  label: string;
}

export function getNotificationVisualConfig(type: string): NotificationVisualConfig {
  switch (type) {
    case "order_escrow_funded":
      return {
        icon: "💰",
        bgClass: "bg-emerald-50 border-emerald-200",
        textClass: "text-emerald-700",
        label: "Pago Escrow",
      };
    case "order_delivered":
      return {
        icon: "📦",
        bgClass: "bg-blue-50 border-blue-200",
        textClass: "text-blue-700",
        label: "Entrega de Trabajo",
      };
    case "order_approved":
      return {
        icon: "🎉",
        bgClass: "bg-amber-50 border-amber-200",
        textClass: "text-amber-700",
        label: "Orden Aprobada",
      };
    case "order_status":
      return {
        icon: "📋",
        bgClass: "bg-purple-50 border-purple-200",
        textClass: "text-purple-700",
        label: "Estado de Orden",
      };
    case "dispute_opened":
    case "dispute_resolved":
    case "dispute_update":
      return {
        icon: "⚠️",
        bgClass: "bg-rose-50 border-rose-200",
        textClass: "text-rose-700",
        label: "Disputa / Mediación",
      };
    case "new_message":
      return {
        icon: "💬",
        bgClass: "bg-indigo-50 border-indigo-200",
        textClass: "text-indigo-700",
        label: "Mensaje",
      };
    default:
      return {
        icon: "🔔",
        bgClass: "bg-slate-50 border-slate-200",
        textClass: "text-slate-700",
        label: "Notificación",
      };
  }
}

export function filterUnreadNotifications<T extends { isRead: boolean }>(
  notifications: T[]
): T[] {
  return notifications.filter((n) => !n.isRead);
}

export function countUnreadNotifications<T extends { isRead: boolean }>(
  notifications: T[]
): number {
  return notifications.filter((n) => !n.isRead).length;
}

// ---------------------------------------------------------------------------
// Soporte y Backoffice (Fase 9)
// ---------------------------------------------------------------------------

export function hasSupportAccess(roles?: string[] | null): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.includes("admin") || roles.includes("soporte");
}

export function hasAdminAccess(roles?: string[] | null): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.includes("admin");
}

export interface DisputeSplitCalculation {
  grossAmount: number;
  freelancerPercentage: number;
  clientPercentage: number;
  freelancerGross: number;
  freelancerNet: number;
  clientRefund: number;
  platformFee: number;
}

export function calculateDisputeSplit(
  freelancerPrice: number,
  freelancerPercentage: number
): DisputeSplitCalculation {
  const safePct = Math.max(0, Math.min(100, Number(freelancerPercentage) || 0));
  const clientPct = 100 - safePct;
  const safeGross = Math.max(0, Number(freelancerPrice) || 0);

  const freelancerGross = Number(((safeGross * safePct) / 100).toFixed(2));
  const clientRefund = Number((safeGross - freelancerGross).toFixed(2));
  // El freelancer conserva el 100% de su porción en el veredicto;
  // la comisión ya fue asumida por el cliente al momento de depositar.
  const platformFee = 0;
  const freelancerNet = freelancerGross;

  return {
    grossAmount: safeGross,
    freelancerPercentage: safePct,
    clientPercentage: clientPct,
    freelancerGross,
    freelancerNet,
    clientRefund,
    platformFee,
  };
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}




