// Se regenera con: supabase gen types typescript --local > src/database.types.ts
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./database.types";

export type Role = "cliente" | "freelancer" | "admin" | "soporte";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  projectUrl?: string;
  imageUrl?: string;
}

export interface UserProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  phoneVerified: boolean;
  headline: string | null;
  bio: string | null;
  hourlyRate: number | null;
  skills: string[];
  portfolio: PortfolioItem[];
  roles: Role[];
  ratingAvg?: number;
  reviewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  tier: "basico" | "estandar" | "premium";
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
}

export interface Service {
  id: string;
  freelancerId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  coverImage: string | null;
  status: "active" | "paused" | "draft";
  rating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithFreelancer extends Service {
  freelancer: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    headline: string | null;
    skills: string[];
  };
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
  packages?: ServicePackage[];
}

export interface ServiceFilterParams {
  searchQuery?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  maxDeliveryDays?: number;
  minRating?: number;
  freelancerId?: string;
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

export interface OrderRequirement {
  id: string;
  orderId: string;
  description: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  previousStatus: string | null;
  newStatus: string;
  changedBy: string;
  comment: string | null;
  createdAt: string;
  changer?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface Order {
  id: string;
  clientId: string;
  freelancerId: string;
  serviceId: string | null;
  packageId: string | null;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  status: OrderStatus;
  agreedAt: string | null;
  paymentActivatedAt: string | null;
  deliveryDueDate: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithDetails extends Order {
  client: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  freelancer: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    headline: string | null;
  };
  service?: {
    id: string;
    title: string;
    coverImage: string | null;
    category?: {
      name: string;
      icon: string | null;
    } | null;
  } | null;
  requirements: OrderRequirement[];
  statusHistory: OrderStatusHistory[];
  escrowHold?: EscrowHold | null;
  payment?: Payment | null;
  dispute?: Dispute | null;
}

export interface CreateOrderPayload {
  clientId: string;
  freelancerId: string;
  serviceId?: string;
  packageId?: string;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  requirements?: string[];
}

export type PaymentStatus =
  | "pending"
  | "held_in_escrow"
  | "released"
  | "partially_refunded"
  | "refunded"
  | "failed";

export type EscrowStatus =
  | "held"
  | "released"
  | "partially_released"
  | "refunded";

export type PayoutStatus =
  | "pending"
  | "completed"
  | "failed";

export interface Payment {
  id: string;
  orderId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentProvider: string;
  providerTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowHold {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: EscrowStatus;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  orderId: string;
  freelancerId: string;
  amount: number;
  status: PayoutStatus;
  payoutProvider: string;
  providerPayoutId: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface PlatformFee {
  id: string;
  orderId: string;
  escrowId: string;
  feePercentage: number;
  feeAmount: number;
  createdAt: string;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "cancelled";
export type DisputeDecision = "no_liberar" | "liberar_completo" | "liberar_parcial";
export type DisputeReason =
  | "cliente_no_responde"
  | "cliente_rechaza_sin_motivo"
  | "entregables_incompletos"
  | "calidad_deficiente"
  | "desacuerdo_alcance"
  | "otro";

export interface Dispute {
  id: string;
  orderId: string;
  initiatorId: string;
  respondentId: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  message: string;
  attachments?: unknown[];
  isSupport: boolean;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface DisputeResolution {
  id: string;
  disputeId: string;
  resolverId: string;
  decision: DisputeDecision;
  freelancerPercentage: number;
  resolutionNotes: string;
  createdAt: string;
  resolver?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface DisputeWithDetails extends Dispute {
  order?: {
    id: string;
    title: string;
    price: number;
    status: string;
    clientId?: string;
    freelancerId?: string;
  } | null;
  initiator?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  respondent?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  messages?: DisputeMessage[];
  resolution?: DisputeResolution | null;
}

export interface OpenDisputePayload {
  orderId: string;
  reason: string;
  description: string;
  initialMessage?: string;
}

// ============================================================
// Tipos de Reputación y Reseñas (Fase 6)
// ============================================================

export interface Review {
  id: string;
  orderId: string;
  clientId: string;
  freelancerId: string;
  serviceId?: string | null;
  rating: number; // 1 - 5
  comment: string;
  freelancerReply?: string | null;
  freelancerRepliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithDetails extends Review {
  client?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  freelancer?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    headline?: string | null;
  } | null;
  service?: {
    id: string;
    title: string;
  } | null;
  order?: {
    id: string;
    title: string;
    price: number;
    completedAt?: string | null;
  } | null;
}

export interface CreateReviewPayload {
  orderId: string;
  clientId: string;
  freelancerId: string;
  serviceId?: string | null;
  rating: number;
  comment: string;
}

export interface ReplyReviewPayload {
  reviewId: string;
  reply: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  percentages: Record<1 | 2 | 3 | 4 | 5, number>;
}

// ============================================================
// Tipos de Mensajería y Chat en Tiempo Real (Fase 7)
// ============================================================

export interface MessageAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments: MessageAttachment[];
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface Conversation {
  id: string;
  clientId: string;
  freelancerId: string;
  orderId?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithDetails extends Conversation {
  client?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  freelancer?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    headline?: string | null;
  } | null;
  order?: {
    id: string;
    title: string;
    status: string;
    price: number;
  } | null;
  unreadCount?: number;
}

export interface SendMessagePayload {
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachment[];
}

export interface CreateConversationPayload {
  clientId: string;
  freelancerId: string;
  orderId?: string | null;
}

// ---------------------------------------------------------------------------
// Notificaciones (Fase 8)
// ---------------------------------------------------------------------------

export type NotificationType =
  | "order_status"
  | "order_escrow_funded"
  | "order_delivered"
  | "order_approved"
  | "dispute_opened"
  | "dispute_resolved"
  | "dispute_update"
  | "new_message"
  | "system";

export interface NotificationMetadata {
  order_id?: string;
  orderId?: string;
  status?: string;
  dispute_id?: string;
  disputeId?: string;
  conversation_id?: string;
  conversationId?: string;
  sender_id?: string;
  url?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType | string;
  data: NotificationMetadata;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface CreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType | string;
  data?: NotificationMetadata;
}

export interface SendEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  type?: string;
}

// ---------------------------------------------------------------------------
// Panel de Soporte y Backoffice (Fase 9)
// ---------------------------------------------------------------------------

export interface AdminDashboardMetrics {
  users: {
    total: number;
    clients: number;
    freelancers: number;
    support: number;
    admins: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
    disputed: number;
  };
  disputes: {
    open: number;
    resolved: number;
  };
  financials: {
    escrow_held: number;
    escrow_released: number;
    platform_fees: number;
  };
}

export interface AdminUserItem {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  phone: string | null;
  phoneVerified: boolean;
  hourlyRate: number | null;
  ratingAvg: number;
  reviewsCount: number;
  createdAt: string;
  roles: Role[];
}

export interface AdminPaymentRecord {
  id: string;
  orderId: string;
  orderTitle?: string;
  clientName?: string;
  freelancerName?: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: string; // 'held' | 'released' | 'refunded' | 'partially_released'
  heldAt: string;
  releasedAt?: string | null;
}

export interface UpdateUserRolePayload {
  userId: string;
  role: Role;
  active: boolean;
}



