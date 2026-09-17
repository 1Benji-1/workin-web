import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@freelance/types";
import type { EscrowHold, Payout } from "@freelance/types";

export interface EscrowPaymentResult {
  success: boolean;
  order_id: string;
  payment_id: string;
  escrow_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
}

export interface EscrowReleaseResult {
  success: boolean;
  order_id: string;
  payout_id: string;
  net_amount: number;
  platform_fee: number;
  status: string;
}

/**
 * Procesa el pago y depósito en custodia segura (Escrow simulado).
 * Ejecuta la función atómica SECURITY DEFINER en Postgres.
 *
 * NOTA DE ARQUITECTURA: En Fase 4 este método invoca el RPC simulado.
 * Cuando se integre Stripe Connect, este mismo método o una Edge Function
 * llamará a `stripe.paymentIntents.create` y registrará el webhook de confirmación.
 */
export async function processSimulatedEscrowPayment(
  supabase: SupabaseClient<Database>,
  orderId: string,
  paymentMethod = "tarjeta_simulada"
) {
  const { data, error } = await supabase.rpc("process_simulated_escrow_payment", {
    p_order_id: orderId,
    p_payment_method: paymentMethod,
  });

  return {
    data: data as unknown as EscrowPaymentResult | null,
    error,
  };
}

/**
 * Libera los fondos retenidos en Escrow hacia el freelancer tras la aprobación del cliente.
 *
 * NOTA DE ARQUITECTURA: Al conectar Stripe Connect, se invocará `stripe.transfers.create`
 * para enviar el neto a la cuenta del freelancer.
 */
export async function releaseEscrowPayment(
  supabase: SupabaseClient<Database>,
  orderId: string,
  comment?: string
) {
  const { data, error } = await supabase.rpc("release_escrow_payment", {
    p_order_id: orderId,
    p_comment: comment || null,
  });

  return {
    data: data as unknown as EscrowReleaseResult | null,
    error,
  };
}

/**
 * Liberación parcial de fondos para soporte y mediación de disputas (Fase 5 y 9).
 */
export async function partialReleaseEscrowPayment(
  supabase: SupabaseClient<Database>,
  orderId: string,
  freelancerPercentage: number,
  reason: string
) {
  const { data, error } = await supabase.rpc("partial_release_escrow_payment", {
    p_order_id: orderId,
    p_freelancer_percentage: freelancerPercentage,
    p_reason: reason,
  });

  return {
    data,
    error,
  };
}

/**
 * Obtiene la retención en custodia (Escrow) de una orden específica.
 */
export async function getEscrowByOrderId(
  supabase: SupabaseClient<Database>,
  orderId: string
) {
  const { data, error } = await supabase
    .from("escrow_holds")
    .select(`
      id,
      order_id,
      payment_id,
      amount,
      platform_fee,
      net_amount,
      status,
      released_at,
      created_at,
      updated_at
    `)
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const escrow: EscrowHold = {
    id: data.id,
    orderId: data.order_id,
    paymentId: data.payment_id,
    amount: Number(data.amount),
    platformFee: Number(data.platform_fee),
    netAmount: Number(data.net_amount),
    status: data.status as EscrowHold["status"],
    releasedAt: data.released_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return { data: escrow, error: null };
}

export interface PayoutWithOrder extends Payout {
  orderTitle?: string;
}

/**
 * Lista el historial de desembolsos (Payouts) de un freelancer.
 */
export async function getPayoutsByFreelancer(
  supabase: SupabaseClient<Database>,
  freelancerId: string
) {
  const { data, error } = await supabase
    .from("payouts")
    .select(`
      id,
      order_id,
      freelancer_id,
      amount,
      status,
      payout_provider,
      provider_payout_id,
      processed_at,
      created_at,
      orders:order_id (
        title
      )
    `)
    .eq("freelancer_id", freelancerId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const payouts: PayoutWithOrder[] = (data || []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderData = (row as any).orders as { title?: string } | null;
    return {
      id: row.id,
      orderId: row.order_id,
      freelancerId: row.freelancer_id,
      amount: Number(row.amount),
      status: row.status as Payout["status"],
      payoutProvider: row.payout_provider,
      providerPayoutId: row.provider_payout_id,
      processedAt: row.processed_at,
      createdAt: row.created_at,
      orderTitle: orderData?.title,
    };
  });

  return { data: payouts, error: null };
}
